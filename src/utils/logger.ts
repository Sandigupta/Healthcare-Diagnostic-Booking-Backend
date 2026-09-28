import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  redact: {
    paths: [
      'password',
      'req.headers.authorization',
      'body.password',
      'DATABASE_URL',
      'JWT_SECRET',
    ],
    remove: true,
  },
});
