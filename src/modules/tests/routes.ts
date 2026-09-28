import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { createTestSchema, testIdParamSchema } from './schema.js';
import * as testsService from './service.js';

export const testsRouter = Router();

testsRouter.get('/', validate(paginationQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await testsService.listTests(req.query as never);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

testsRouter.get('/:id', validate(testIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const test = await testsService.getTestById(Number(req.params.id));
    res.status(200).json({ data: test });
  } catch (error) {
    next(error);
  }
});

testsRouter.post('/', authenticate, validate(createTestSchema), async (req, res, next) => {
  try {
    const test = await testsService.createTest(req.body);
    res.status(201).json({ data: test });
  } catch (error) {
    next(error);
  }
});
