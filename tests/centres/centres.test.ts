import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { closeDb, hasDatabaseUrl, truncateAll } from '../helpers/db.js';
import { authHeader, bearer, expectOk } from '../helpers/http.js';

describe.runIf(hasDatabaseUrl())('centres and tests API', () => {
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

  it('creates and lists centres and tests with pagination', async () => {
    const { token } = await authHeader(app);

    const centreRes = await request(app)
      .post('/api/centres')
      .set(bearer(token))
      .send({ name: 'EVE Labs', location: 'Bangalore' });
    expectOk(centreRes, 201);

    const testRes = await request(app)
      .post('/api/tests')
      .set(bearer(token))
      .send({ name: 'CBC', description: 'Blood count' });
    expectOk(testRes, 201);

    const attachRes = await request(app)
      .post(`/api/centres/${centreRes.body.data.id}/tests`)
      .set(bearer(token))
      .send({ testId: testRes.body.data.id, price: 499 });
    expectOk(attachRes, 201);
    expect(attachRes.body.data.price).toBe('499.00');

    const listCentres = await request(app).get('/api/centres?page=1&limit=10');
    expectOk(listCentres, 200);
    expect(listCentres.body.pagination.total).toBe(1);

    const centreTests = await request(app).get(
      `/api/centres/${centreRes.body.data.id}/tests`,
    );
    expectOk(centreTests, 200);
    expect(centreTests.body.data).toHaveLength(1);
  });

  it('returns 404 for missing centre', async () => {
    const res = await request(app).get('/api/centres/99999');
    expect(res.status).toBe(404);
  });
});
