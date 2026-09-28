import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import {
  attachTestSchema,
  centreIdParamSchema,
  createCentreSchema,
} from './schema.js';
import * as centresService from './service.js';

export const centresRouter = Router();

centresRouter.get('/', validate(paginationQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await centresService.listCentres(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

centresRouter.get(
  '/:id',
  validate(centreIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const centre = await centresService.getCentreById(Number(req.params.id));
      res.status(200).json({ data: centre });
    } catch (error) {
      next(error);
    }
  },
);

centresRouter.post('/', authenticate, validate(createCentreSchema), async (req, res, next) => {
  try {
    const centre = await centresService.createCentre(req.body);
    res.status(201).json({ data: centre });
  } catch (error) {
    next(error);
  }
});

centresRouter.get(
  '/:id/tests',
  validate(centreIdParamSchema, 'params'),
  validate(paginationQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await centresService.listCentreTests(
        Number(req.params.id),
        req.query as never,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

centresRouter.post(
  '/:id/tests',
  authenticate,
  validate(centreIdParamSchema, 'params'),
  validate(attachTestSchema),
  async (req, res, next) => {
    try {
      const offer = await centresService.attachTestToCentre(Number(req.params.id), req.body);
      res.status(201).json({ data: offer });
    } catch (error) {
      next(error);
    }
  },
);
