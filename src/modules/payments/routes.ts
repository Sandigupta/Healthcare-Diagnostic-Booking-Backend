import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { paymentRateLimiter, webhookRateLimiter } from '../../middleware/rateLimiter.js';
import { createPaymentSchema, webhookSchema } from './schema.js';
import * as paymentsService from './service.js';

export const paymentsRouter = Router();

paymentsRouter.post(
  '/',
  paymentRateLimiter,
  authenticate,
  validate(createPaymentSchema),
  async (req, res, next) => {
    try {
      const result = await paymentsService.createPayment(req.user!.userId, req.body);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.post(
  '/webhook',
  webhookRateLimiter,
  validate(webhookSchema),
  async (req, res, next) => {
    try {
      const result = await paymentsService.handleWebhook(req.body);
      res.status(200).json({
        data: {
          received: true,
          duplicate: result.duplicate,
          eventId: result.event.eventId,
          processedAt: result.event.processedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
