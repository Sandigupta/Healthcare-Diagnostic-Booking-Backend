import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { bookings, payments, webhookEvents } from '../../db/schema/index.js';
import type { PaymentStatus } from '../../db/schema/index.js';
import { getBookingForUser } from '../bookings/service.js';
import { assertBookingTransition, canPayForBooking } from '../bookings/status.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';
import type { CreatePaymentInput, WebhookInput } from './schema.js';
import {
  WEBHOOK_MAX_RETRIES,
  WEBHOOK_RETRY_DELAY_MS,
  generatePaymentReference,
  simulatePaymentOutcome,
  sleep,
} from './simulate.js';

function bookingStatusFromPayment(status: PaymentStatus) {
  return status === 'SUCCESS' ? ('CONFIRMED' as const) : ('FAILED' as const);
}

export async function createPayment(userId: number, input: CreatePaymentInput) {
  const booking = await getBookingForUser(input.bookingId, userId);

  if (!canPayForBooking(booking.status)) {
    throw new AppError(
      409,
      'PAYMENT_NOT_ALLOWED',
      `Cannot pay for a booking with status ${booking.status}`,
    );
  }

  const forceOutcome =
    env.NODE_ENV === 'test' || env.NODE_ENV === 'development'
      ? input.forceOutcome
      : undefined;

  const outcome = simulatePaymentOutcome(forceOutcome);
  const paymentReference = generatePaymentReference();
  const nextBookingStatus = bookingStatusFromPayment(outcome);

  assertBookingTransition(booking.status, nextBookingStatus);

  const result = await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(payments)
      .values({
        bookingId: booking.id,
        paymentReference,
        amount: booking.amount,
        status: outcome,
      })
      .returning();

    const [updatedBooking] = await tx
      .update(bookings)
      .set({ status: nextBookingStatus, updatedAt: new Date() })
      .where(eq(bookings.id, booking.id))
      .returning();

    return { payment, booking: updatedBooking };
  });

  logger.info(
    {
      event: 'payment_processed',
      bookingId: booking.id,
      paymentId: result.payment.id,
      status: outcome,
    },
    'Payment processed',
  );

  return result;
}

async function processWebhookOnce(input: WebhookInput) {
  const existing = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, input.eventId))
    .limit(1);

  if (existing.length > 0 && existing[0].processedAt) {
    logger.info(
      { event: 'webhook_duplicate', eventId: input.eventId },
      'Duplicate webhook ignored',
    );
    return {
      duplicate: true as const,
      event: existing[0],
    };
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, input.bookingId))
    .limit(1);

  if (!booking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found for webhook');
  }

  // Find payment by external payment reference or create/update accordingly
  let [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.paymentReference, input.paymentId))
    .limit(1);

  const nextBookingStatus = bookingStatusFromPayment(input.status);

  const event = await db.transaction(async (tx) => {
    if (!payment) {
      [payment] = await tx
        .insert(payments)
        .values({
          bookingId: booking.id,
          paymentReference: input.paymentId,
          amount: booking.amount,
          status: input.status,
        })
        .returning();
    } else {
      [payment] = await tx
        .update(payments)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
        .returning();
    }

    // Only transition booking if still PENDING (avoid corrupting CANCELLED etc.)
    if (booking.status === 'PENDING') {
      assertBookingTransition(booking.status, nextBookingStatus);
      await tx
        .update(bookings)
        .set({ status: nextBookingStatus, updatedAt: new Date() })
        .where(eq(bookings.id, booking.id));
    }

    if (existing.length > 0) {
      const [updatedEvent] = await tx
        .update(webhookEvents)
        .set({
          processedAt: new Date(),
          lastAttemptAt: new Date(),
          status: input.status,
          paymentId: input.paymentId,
          bookingId: input.bookingId,
        })
        .where(eq(webhookEvents.eventId, input.eventId))
        .returning();
      return updatedEvent;
    }

    const [createdEvent] = await tx
      .insert(webhookEvents)
      .values({
        eventId: input.eventId,
        paymentId: input.paymentId,
        bookingId: input.bookingId,
        status: input.status,
        retryCount: 0,
        lastAttemptAt: new Date(),
        processedAt: new Date(),
      })
      .returning();

    return createdEvent;
  });

  return { duplicate: false as const, event, payment };
}

async function recordWebhookAttempt(eventId: string, paymentId: string, status: PaymentStatus, bookingId: number) {
  const existing = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, eventId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(webhookEvents).values({
      eventId,
      paymentId,
      bookingId,
      status,
      retryCount: 1,
      lastAttemptAt: new Date(),
    });
    return 1;
  }

  const nextCount = existing[0].retryCount + 1;
  await db
    .update(webhookEvents)
    .set({
      retryCount: nextCount,
      lastAttemptAt: new Date(),
    })
    .where(eq(webhookEvents.eventId, eventId));

  return nextCount;
}

export async function handleWebhook(input: WebhookInput) {
  logger.info(
    {
      event: 'webhook_received',
      eventId: input.eventId,
      paymentId: input.paymentId,
      bookingId: input.bookingId,
      status: input.status,
    },
    'Webhook received',
  );

  let lastError: unknown;

  for (let attempt = 1; attempt <= WEBHOOK_MAX_RETRIES; attempt++) {
    try {
      const result = await processWebhookOnce(input);

      logger.info(
        {
          event: 'webhook_processed',
          eventId: input.eventId,
          duplicate: result.duplicate,
          attempt,
        },
        'Webhook processed',
      );

      return result;
    } catch (error) {
      lastError = error;

      // Do not retry client/domain errors
      if (error instanceof AppError && error.statusCode < 500) {
        throw error;
      }

      const retryCount = await recordWebhookAttempt(
        input.eventId,
        input.paymentId,
        input.status,
        input.bookingId,
      );

      logger.error(
        {
          event: 'webhook_processing_failed',
          eventId: input.eventId,
          retryCount,
          attempt,
          err: error,
        },
        'Webhook processing failed',
      );

      if (attempt < WEBHOOK_MAX_RETRIES) {
        await sleep(WEBHOOK_RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new AppError(
    500,
    'WEBHOOK_PROCESSING_FAILED',
    'Webhook processing failed after maximum retries',
    { eventId: input.eventId, cause: lastError instanceof Error ? lastError.message : lastError },
  );
}
