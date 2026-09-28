import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage } from 'node:http';
import { logger } from './utils/logger.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/routes.js';
import { centresRouter } from './modules/centres/routes.js';
import { testsRouter } from './modules/tests/routes.js';
import { bookingsRouter } from './modules/bookings/routes.js';
import { paymentsRouter } from './modules/payments/routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: IncomingMessage) => req.url === '/health',
      },
      serializers: {
        req(req: IncomingMessage & { id?: unknown }) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
          };
        },
      },
    }),
  );
  app.use(generalRateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ data: { status: 'ok' } });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/centres', centresRouter);
  app.use('/api/tests', testsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/payments', paymentsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
