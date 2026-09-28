import { sql } from 'drizzle-orm';

export function hasDatabaseUrl(): boolean {
  if (process.env.EVE_RUN_DB_TESTS === '1') {
    return Boolean(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL);
  }

  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) return false;

  // Default placeholder from setup.ts — not a real DB unless explicitly enabled
  if (url.includes('@localhost:5432/eve_test')) {
    return false;
  }

  return true;
}

export async function truncateAll() {
  const { db } = await import('../../src/db/index.js');
  await db.execute(sql`
    TRUNCATE TABLE
      webhook_events,
      payments,
      bookings,
      centre_tests,
      diagnostic_tests,
      diagnostic_centres,
      users
    RESTART IDENTITY CASCADE
  `);
}

export async function closeDb() {
  const { pool } = await import('../../src/db/index.js');
  await pool.end();
}
