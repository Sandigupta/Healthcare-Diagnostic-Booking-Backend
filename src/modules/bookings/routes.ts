import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { bookingIdParamSchema, createBookingSchema } from './schema.js';
import * as bookingsService from './service.js';

export const bookingsRouter = Router();

bookingsRouter.use(authenticate);

bookingsRouter.post('/', validate(createBookingSchema), async (req, res, next) => {
  try {
    const booking = await bookingsService.createBooking(req.user!.userId, req.body);
    res.status(201).json({ data: booking });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get('/', validate(paginationQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await bookingsService.listUserBookings(
      req.user!.userId,
      req.query as never,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get(
  '/:id',
  validate(bookingIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const booking = await bookingsService.getBookingForUser(
        Number(req.params.id),
        req.user!.userId,
      );
      res.status(200).json({ data: booking });
    } catch (error) {
      next(error);
    }
  },
);

bookingsRouter.patch(
  '/:id/cancel',
  validate(bookingIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const booking = await bookingsService.cancelBooking(
        Number(req.params.id),
        req.user!.userId,
      );
      res.status(200).json({ data: booking });
    } catch (error) {
      next(error);
    }
  },
);
