import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
