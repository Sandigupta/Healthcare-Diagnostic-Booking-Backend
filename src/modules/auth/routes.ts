import { Router } from 'express';
import { validate } from '../../middleware/validation.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import { loginSchema, signupSchema } from './schema.js';
import * as authService from './service.js';

export const authRouter = Router();

authRouter.post('/signup', authRateLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const user = await authService.signup(req.body);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', authRateLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});
