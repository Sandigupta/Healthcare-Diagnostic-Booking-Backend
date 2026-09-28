import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../../src/utils/jwt.js';
import { AppError } from '../../src/utils/errors.js';

describe('jwt utils', () => {
  it('signs and verifies a token', () => {
    const token = signAccessToken({ userId: 1, email: 'a@example.com' });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe(1);
    expect(payload.email).toBe('a@example.com');
  });

  it('rejects invalid tokens', () => {
    expect(() => verifyAccessToken('not-a-token')).toThrow(AppError);
  });
});
