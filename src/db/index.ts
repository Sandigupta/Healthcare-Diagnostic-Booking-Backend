import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

neonConfig.webSocketConstructor = ws;

const connectionString =
  env.NODE_ENV === 'test' && env.TEST_DATABASE_URL
    ? env.TEST_DATABASE_URL
    : env.DATABASE_URL;

let _pool: Pool | null = null;
let _db: NeonDatabase<typeof schema> | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString });
  }
  return _pool;
}

export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = drizzle(getPool(), { schema });
    }
    const value = Reflect.get(_db, prop, receiver);
    return typeof value === 'function' ? value.bind(_db) : value;
  },
});

export const pool = {
  end: async () => {
    if (_pool) {
      await _pool.end();
      _pool = null;
      _db = null;
    }
  },
};

export type Database = NeonDatabase<typeof schema>;
