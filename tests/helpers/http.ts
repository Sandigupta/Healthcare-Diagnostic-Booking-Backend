import request from 'supertest';
import type { Express } from 'express';

export async function signup(
  app: Express,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  const payload = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    password: overrides.password ?? 'password123',
  };

  const res = await request(app).post('/api/auth/signup').send(payload);
  return { res, payload };
}

export async function login(app: Express, email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

export async function authHeader(app: Express, email?: string) {
  const { res, payload } = await signup(app, email ? { email } : {});
  expectOk(res, 201);
  const loginRes = await login(app, payload.email, payload.password);
  expectOk(loginRes, 200);
  return {
    token: loginRes.body.data.accessToken as string,
    user: res.body.data,
    email: payload.email,
    password: payload.password,
  };
}

export function expectOk(res: { status: number; body: unknown }, status: number) {
  if (res.status !== status) {
    throw new Error(`Expected ${status}, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
