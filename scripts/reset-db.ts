import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

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

console.log('Database truncated');
await pool.end();
