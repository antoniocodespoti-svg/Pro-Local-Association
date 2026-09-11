export interface DatabaseConfig {
  driver: 'memory' | 'postgres';
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export function getDatabaseConfig(): DatabaseConfig {
  const driver = (process.env.DB_DRIVER || 'memory').toLowerCase() as 'memory' | 'postgres';
  const connectionString = process.env.DATABASE_URL;

  if (driver === 'postgres' && !connectionString && !process.env.PGDATABASE) {
    throw new Error('Configurazione database non valida: per DB_DRIVER=postgres è necessario specificare DATABASE_URL oppure PGDATABASE.');
  }

  return {
    driver,
    connectionString,
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || 'prolocal_dev',
    ssl: process.env.PGSSL === 'true',
    maxConnections: process.env.PGMAX_CONNECTIONS ? parseInt(process.env.PGMAX_CONNECTIONS, 10) : 10
  };
}
