import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, isAppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isAppError(err)) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.flatten(),
      },
    });
    return;
  }

  logger.error({ event: 'unhandled_error', err }, 'Unhandled error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
