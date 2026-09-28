import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { eq } from 'drizzle-orm';
import { closeDb, hasDatabaseUrl, truncateAll } from '../helpers/db.js';
import { authHeader, bearer, expectOk } from '../helpers/http.js';

async function createPendingBooking(app: Express, token: string) {
  const centreRes = await request(app)
    .post('/api/centres')
    .set(bearer(token))
    .send({ name: 'Webhook Centre', location: 'Chennai' });
  const testRes = await request(app)
    .post('/api/tests')
    .set(bearer(token))
    .send({ name: 'Thyroid' });
  await request(app)
    .post(`/api/centres/${centreRes.body.data.id}/tests`)
    .set(bearer(token))
    .send({ testId: testRes.body.data.id, price: 900 });

  const bookingRes = await request(app)
    .post('/api/bookings')
    .set(bearer(token))
    .send({
      testId: testRes.body.data.id,
      centreId: centreRes.body.data.id,
      appointmentDateTime: new Date(Date.now() + 86400000).toISOString(),
    });
  expectOk(bookingRes, 201);
  return bookingRes.body.data as { id: number; amount: string };
}

describe.runIf(hasDatabaseUrl())('payment webhook', () => {
  let app: Express;

  beforeAll(async () => {
    const { createApp } = await import('../../src/app.js');
    app = createApp();
    await truncateAll();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('processes webhook and is idempotent on duplicate eventId', async () => {
    const { db } = await import('../../src/db/index.js');
    const { bookings, payments } = await import('../../src/db/schema/index.js');

    const { token } = await authHeader(app);
    const booking = await createPendingBooking(app, token);

    const payload = {
      eventId: 'evt_idempotent_1',
      paymentId: 'pay_external_1',
      bookingId: booking.id,
      status: 'SUCCESS' as const,
    };

    const first = await request(app).post('/api/payments/webhook').send(payload);
    expectOk(first, 200);
    expect(first.body.data.duplicate).toBe(false);

    const [bookingAfterFirst] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id));
    expect(bookingAfterFirst.status).toBe('CONFIRMED');

    const paymentRows = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, booking.id));
    expect(paymentRows).toHaveLength(1);
    expect(paymentRows[0].status).toBe('SUCCESS');

    const second = await request(app).post('/api/payments/webhook').send(payload);
    expectOk(second, 200);
    expect(second.body.data.duplicate).toBe(true);

    const paymentRowsAfter = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, booking.id));
    expect(paymentRowsAfter).toHaveLength(1);

    const [bookingAfterSecond] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id));
    expect(bookingAfterSecond.status).toBe('CONFIRMED');
  });

  it('marks booking failed via webhook FAILED status', async () => {
    const { db } = await import('../../src/db/index.js');
    const { bookings } = await import('../../src/db/schema/index.js');

    const { token } = await authHeader(app);
    const booking = await createPendingBooking(app, token);

    const res = await request(app).post('/api/payments/webhook').send({
      eventId: 'evt_fail_1',
      paymentId: 'pay_fail_1',
      bookingId: booking.id,
      status: 'FAILED',
    });

    expectOk(res, 200);

    const [updated] = await db.select().from(bookings).where(eq(bookings.id, booking.id));
    expect(updated.status).toBe('FAILED');
  });
});
