import { and, count, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { bookings, diagnosticCentres, diagnosticTests } from '../../db/schema/index.js';
import { getCentreTestOffer } from '../centres/service.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { buildPaginationMeta, paginationOffset, type PaginationQuery } from '../../utils/pagination.js';
import { assertBookingTransition, canCancelBooking } from './status.js';
import type { CreateBookingInput } from './schema.js';

export async function createBooking(userId: number, input: CreateBookingInput) {
  const appointmentDate = new Date(input.appointmentDateTime);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid appointmentDateTime');
  }

  if (appointmentDate.getTime() <= Date.now()) {
    throw new AppError(400, 'INVALID_APPOINTMENT', 'Appointment must be in the future');
  }

  const [centre] = await db
    .select()
    .from(diagnosticCentres)
    .where(eq(diagnosticCentres.id, input.centreId))
    .limit(1);

  if (!centre) {
    throw new AppError(404, 'CENTRE_NOT_FOUND', 'Diagnostic centre not found');
  }

  const [test] = await db
    .select()
    .from(diagnosticTests)
    .where(eq(diagnosticTests.id, input.testId))
    .limit(1);

  if (!test) {
    throw new AppError(404, 'TEST_NOT_FOUND', 'Diagnostic test not found');
  }

  const offer = await getCentreTestOffer(input.centreId, input.testId);
  if (!offer) {
    throw new AppError(
      400,
      'TEST_NOT_OFFERED',
      'Selected centre does not offer this diagnostic test',
    );
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      userId,
      testId: input.testId,
      centreId: input.centreId,
      appointmentDateTime: appointmentDate,
      amount: offer.price,
      status: 'PENDING',
    })
    .returning();

  logger.info(
    {
      event: 'booking_created',
      bookingId: booking.id,
      userId,
      amount: booking.amount,
    },
    'Booking created',
  );

  return booking;
}

export async function listUserBookings(userId: number, pagination: PaginationQuery) {
  const { page, limit } = pagination;
  const offset = paginationOffset(page, limit);

  const whereClause = eq(bookings.userId, userId);

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(whereClause)
      .orderBy(bookings.id)
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(bookings).where(whereClause),
  ]);

  return {
    data: rows,
    pagination: buildPaginationMeta(page, limit, Number(totalResult[0]?.value ?? 0)),
  };
}

export async function getBookingForUser(bookingId: number, userId: number) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this booking');
  }

  return booking;
}

export async function cancelBooking(bookingId: number, userId: number) {
  const booking = await getBookingForUser(bookingId, userId);

  if (!canCancelBooking(booking.status)) {
    throw new AppError(
      409,
      'INVALID_STATUS_TRANSITION',
      `Cannot cancel a booking with status ${booking.status}`,
    );
  }

  assertBookingTransition(booking.status, 'CANCELLED');

  const [updated] = await db
    .update(bookings)
    .set({ status: 'CANCELLED', updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .returning();

  logger.info(
    { event: 'booking_cancelled', bookingId, userId },
    'Booking cancelled',
  );

  return updated;
}
