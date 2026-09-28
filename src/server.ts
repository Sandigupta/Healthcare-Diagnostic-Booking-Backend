import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    { event: 'server_started', port: env.PORT, env: env.NODE_ENV },
    `EVE API listening on port ${env.PORT}`,
  );
});
