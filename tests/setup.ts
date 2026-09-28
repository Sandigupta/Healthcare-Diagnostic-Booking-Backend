import { config } from 'dotenv';

config({ path: '.env' });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-at-least-16-chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.PORT = process.env.PORT ?? '3001';
process.env.LOG_LEVEL = 'silent';

if (!process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/eve_test';
}

if (process.env.TEST_DATABASE_URL || (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('@localhost:5432/eve_test'))) {
  process.env.EVE_RUN_DB_TESTS = process.env.EVE_RUN_DB_TESTS ?? '1';
}
