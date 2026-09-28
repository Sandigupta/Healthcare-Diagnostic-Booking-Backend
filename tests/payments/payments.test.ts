import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { closeDb, hasDatabaseUrl, truncateAll } from '../helpers/db.js';
import { authHeader, bearer, expectOk } from '../helpers/http.js';

async function createPendingBooking(app: Express, token: string) {
  const centreRes = await request(app)
    .post('/api/centres')
    .set(bearer(token))
    .send({ name: 'Pay Centre', location: 'Mumbai' });
  const testRes = await request(app)
    .post('/api/tests')
    .set(bearer(token))
    .send({ name: 'CBC' });
  await request(app)
    .post(`/api/centres/${centreRes.body.data.id}/tests`)
    .set(bearer(token))
    .send({ testId: testRes.body.data.id, price: 500 });

  const bookingRes = await request(app)
    .post('/api/bookings')
    .set(bearer(token))
    .send({
      testId: testRes.body.data.id,
      centreId: centreRes.body.data.id,
      appointmentDateTime: new Date(Date.now() + 86400000).toISOString(),
    });
  expectOk(bookingRes, 201);
  return bookingRes.body.data;
}

describe.runIf(hasDatabaseUrl())('payments API', () => {
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

  it('confirms booking on successful payment', async () => {
    const { token } = await authHeader(app);
    const booking = await createPendingBooking(app, token);

    const res = await request(app)
      .post('/api/payments')
      .set(bearer(token))
      .send({ bookingId: booking.id, forceOutcome: 'SUCCESS' });

    expectOk(res, 201);
    expect(res.body.data.payment.status).toBe('SUCCESS');
    expect(res.body.data.booking.status).toBe('CONFIRMED');
  });

  it('marks booking failed on failed payment', async () => {
    const { token } = await authHeader(app);
    const booking = await createPendingBooking(app, token);

    const res = await request(app)
      .post('/api/payments')
      .set(bearer(token))
      .send({ bookingId: booking.id, forceOutcome: 'FAILED' });

    expectOk(res, 201);
    expect(res.body.data.payment.status).toBe('FAILED');
    expect(res.body.data.booking.status).toBe('FAILED');
  });

  it('rejects payment for cancelled booking', async () => {
    const { token } = await authHeader(app);
    const booking = await createPendingBooking(app, token);

    await request(app).patch(`/api/bookings/${booking.id}/cancel`).set(bearer(token));

    const res = await request(app)
      .post('/api/payments')
      .set(bearer(token))
      .send({ bookingId: booking.id, forceOutcome: 'SUCCESS' });

    expect(res.status).toBe(409);
  });

  it('rejects payment for another user booking', async () => {
    const userA = await authHeader(app, 'pay-a@example.com');
    const userB = await authHeader(app, 'pay-b@example.com');
    const booking = await createPendingBooking(app, userA.token);

    const res = await request(app)
      .post('/api/payments')
      .set(bearer(userB.token))
      .send({ bookingId: booking.id, forceOutcome: 'SUCCESS' });

    expect(res.status).toBe(403);
  });
});
