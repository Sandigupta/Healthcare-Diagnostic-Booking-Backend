import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from 'ws';
import 'dotenv/config';
import { centreTests, diagnosticCentres, diagnosticTests } from './schema/index.js';

neonConfig.webSocketConstructor = ws;

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  console.log('Seeding database...');

  const existingCentres = await db.select().from(diagnosticCentres).limit(1);
  if (existingCentres.length > 0) {
    console.log('Database already has data; skipping seed');
    await pool.end();
    return;
  }

  const [centre1] = await db
    .insert(diagnosticCentres)
    .values({ name: 'EVE Labs Koramangala', location: 'Bangalore, Karnataka' })
    .returning();

  const [centre2] = await db
    .insert(diagnosticCentres)
    .values({ name: 'EVE Labs Andheri', location: 'Mumbai, Maharashtra' })
    .returning();

  const [cbc] = await db
    .insert(diagnosticTests)
    .values({ name: 'Complete Blood Count', description: 'CBC with differential' })
    .returning();

  const [lipid] = await db
    .insert(diagnosticTests)
    .values({ name: 'Lipid Profile', description: 'Cholesterol and triglycerides' })
    .returning();

  const [thyroid] = await db
    .insert(diagnosticTests)
    .values({ name: 'Thyroid Panel', description: 'TSH, T3, T4' })
    .returning();

  await db.insert(centreTests).values([
    { centreId: centre1.id, testId: cbc.id, price: '499.00' },
    { centreId: centre1.id, testId: lipid.id, price: '799.00' },
    { centreId: centre1.id, testId: thyroid.id, price: '899.00' },
    { centreId: centre2.id, testId: cbc.id, price: '449.00' },
    { centreId: centre2.id, testId: lipid.id, price: '749.00' },
  ]);

  const offers = await db.select().from(centreTests).where(eq(centreTests.centreId, centre1.id));
  console.log(`Seed complete: 2 centres, 3 tests, ${offers.length + 2} centre-test offers`);
  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
