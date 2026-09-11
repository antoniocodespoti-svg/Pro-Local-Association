import pg from 'pg';
import { getDatabaseConfig } from './config.ts';
import type { DatabaseConfig } from './config.ts';

const { Pool } = pg;

export function createPgPool(customConfig?: DatabaseConfig): pg.Pool {
  const config = customConfig || getDatabaseConfig();

  if (config.connectionString) {
    return new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      max: config.maxConnections || 10,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000
    });
  }

  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    max: config.maxConnections || 10,
    idleTimeoutMillis: config.idleTimeoutMillis || 30000,
    connectionTimeoutMillis: config.connectionTimeoutMillis || 5000
  });
}
