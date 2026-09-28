import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

export interface JwtPayload {
  userId: number;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof (decoded as JwtPayload).userId !== 'number' ||
      typeof (decoded as JwtPayload).email !== 'string'
    ) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication token');
    }
    return decoded as JwtPayload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Authentication token has expired');
    }
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication token');
  }
}
