import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');
  await pool.end();
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
