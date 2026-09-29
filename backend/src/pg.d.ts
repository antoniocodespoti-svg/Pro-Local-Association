declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query(sql: string, params?: unknown[]): Promise<{ rows: any[]; rowCount?: number | null }>;
    connect(): Promise<{
      query(sql: string, params?: unknown[]): Promise<{ rows: any[]; rowCount?: number | null }>;
      release(): void;
    }>;
    end(): Promise<void>;
  }

  namespace pg {
    export type Pool = InstanceType<typeof import('pg').Pool>;
  }

  const defaultExport: {
    Pool: typeof Pool;
  };

  export default defaultExport;
}

