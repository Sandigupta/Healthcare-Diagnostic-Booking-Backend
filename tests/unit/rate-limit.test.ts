import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createStrictTestLimiter } from '../../src/middleware/rateLimiter.js';

describe('rate limiting', () => {
  it('returns 429 after exceeding max requests', async () => {
    const app = express();
    app.use(createStrictTestLimiter(2));
    app.get('/limited', (_req, res) => {
      res.status(200).json({ data: { ok: true } });
    });

    const first = await request(app).get('/limited');
    const second = await request(app).get('/limited');
    const third = await request(app).get('/limited');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
