import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { closeDb, hasDatabaseUrl, truncateAll } from '../helpers/db.js';
import { authHeader, bearer, expectOk } from '../helpers/http.js';

async function seedOffer(app: Express, token: string) {
  const centreRes = await request(app)
    .post('/api/centres')
    .set(bearer(token))
    .send({ name: 'Centre A', location: 'Delhi' });
  expectOk(centreRes, 201);

  const testRes = await request(app)
    .post('/api/tests')
    .set(bearer(token))
    .send({ name: 'Lipid Profile' });
  expectOk(testRes, 201);

  const attachRes = await request(app)
    .post(`/api/centres/${centreRes.body.data.id}/tests`)
    .set(bearer(token))
    .send({ testId: testRes.body.data.id, price: 799.5 });
  expectOk(attachRes, 201);

  return {
    centreId: centreRes.body.data.id as number,
    testId: testRes.body.data.id as number,
  };
}

function futureIso() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

describe.runIf(hasDatabaseUrl())('bookings API', () => {
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

  it('creates a booking with server-determined amount', async () => {
    const { token } = await authHeader(app);
    const { centreId, testId } = await seedOffer(app, token);

    const res = await request(app)
      .post('/api/bookings')
      .set(bearer(token))
      .send({
        testId,
        centreId,
        appointmentDateTime: futureIso(),
        amount: 1,
      });

    expectOk(res, 201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.amount).toBe('799.50');
  });

  it('forbids accessing another user booking', async () => {
    const userA = await authHeader(app, 'a@example.com');
    const userB = await authHeader(app, 'b@example.com');
    const { centreId, testId } = await seedOffer(app, userA.token);

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set(bearer(userA.token))
      .send({ testId, centreId, appointmentDateTime: futureIso() });
    expectOk(bookingRes, 201);

    const getRes = await request(app)
      .get(`/api/bookings/${bookingRes.body.data.id}`)
      .set(bearer(userB.token));
    expect(getRes.status).toBe(403);
  });

  it('cancels a pending booking', async () => {
    const { token } = await authHeader(app);
    const { centreId, testId } = await seedOffer(app, token);

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set(bearer(token))
      .send({ testId, centreId, appointmentDateTime: futureIso() });
    expectOk(bookingRes, 201);

    const cancelRes = await request(app)
      .patch(`/api/bookings/${bookingRes.body.data.id}/cancel`)
      .set(bearer(token));
    expectOk(cancelRes, 200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
  });

  it('rejects booking when centre does not offer test', async () => {
    const { token } = await authHeader(app);
    const centreRes = await request(app)
      .post('/api/centres')
      .set(bearer(token))
      .send({ name: 'Centre B', location: 'Pune' });
    const testRes = await request(app)
      .post('/api/tests')
      .set(bearer(token))
      .send({ name: 'Thyroid' });

    const res = await request(app)
      .post('/api/bookings')
      .set(bearer(token))
      .send({
        testId: testRes.body.data.id,
        centreId: centreRes.body.data.id,
        appointmentDateTime: futureIso(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TEST_NOT_OFFERED');
  });
});
