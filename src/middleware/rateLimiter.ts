import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isTest = env.NODE_ENV === 'test';

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many payment requests. Please try again later.',
    },
  },
});

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many webhook requests. Please try again later.',
    },
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

/** Strict limiter used only in rate-limit tests */
export function createStrictTestLimiter(max = 2) {
  return rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    },
  });
}
