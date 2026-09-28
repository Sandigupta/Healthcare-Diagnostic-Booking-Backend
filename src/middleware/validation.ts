import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodType } from 'zod';
import { AppError } from '../utils/errors.js';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodType, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      // Express 5 exposes query/params as getters; redefine so handlers see coerced values
      Object.defineProperty(req, part, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(400, 'VALIDATION_ERROR', 'Invalid request', error.flatten()),
        );
        return;
      }
      next(error);
    }
  };
}
