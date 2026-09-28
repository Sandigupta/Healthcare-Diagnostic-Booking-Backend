import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { closeDb, hasDatabaseUrl, truncateAll } from '../helpers/db.js';
import { authHeader, bearer, expectOk, login, signup } from '../helpers/http.js';

describe.runIf(hasDatabaseUrl())('auth API', () => {
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

  it('signs up a user without returning password hash', async () => {
    const { res } = await signup(app, {
      name: 'Sandeep Gupta',
      email: 'sandeep@example.com',
      password: 'password123',
    });
    expectOk(res, 201);
    expect(res.body.data.email).toBe('sandeep@example.com');
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.body.data.password).toBeUndefined();
  });

  it('rejects duplicate email', async () => {
    await signup(app, { email: 'dup@example.com' });
    const { res } = await signup(app, { email: 'dup@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('logs in and returns access token', async () => {
    await signup(app, { email: 'login@example.com', password: 'password123' });
    const res = await login(app, 'login@example.com', 'password123');
    expectOk(res, 200);
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  it('rejects wrong password', async () => {
    await signup(app, { email: 'wrong@example.com', password: 'password123' });
    const res = await login(app, 'wrong@example.com', 'bad-password');
    expect(res.status).toBe(401);
  });

  it('rejects protected routes without JWT', async () => {
    const res = await request(app).post('/api/bookings').send({});
    expect(res.status).toBe(401);
  });

  it('accepts protected routes with JWT', async () => {
    const { token } = await authHeader(app);
    const res = await request(app).get('/api/bookings').set(bearer(token));
    expectOk(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
