export interface Migration {
  name: string;
  sql: string;
}

export interface Queryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount?: number | null }>;
  connect?(): Promise<{
    query(sql: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount?: number | null }>;
    release(): void;
  }>;
}

export const MIGRATIONS: Migration[] = [
  {
    name: '001_create_members',
    sql: `
      CREATE TABLE IF NOT EXISTS members (
          id VARCHAR(64) PRIMARY KEY,
          codice_socio VARCHAR(64) NOT NULL UNIQUE,
          nome_cognome VARCHAR(255) NOT NULL,
          email_demo VARCHAR(255) NOT NULL,
          data_iscrizione DATE NOT NULL,
          membership_status VARCHAR(32) NOT NULL CHECK (
              membership_status IN ('IN_ATTESA', 'ATTIVO', 'SOSPESO', 'RECEDUTO', 'ESCLUSO')
          ),
          quota_sociale_in_regola BOOLEAN NOT NULL DEFAULT FALSE,
          note_amministrative_interne TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_members_status ON members(membership_status);
    `
  },
  {
    name: '002_create_business_activities',
    sql: `
      CREATE TABLE IF NOT EXISTS business_activities (
          id VARCHAR(64) PRIMARY KEY,
          member_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
          nome_attivita VARCHAR(255) NOT NULL,
          categoria VARCHAR(64) NOT NULL,
          descrizione_breve VARCHAR(255) NOT NULL,
          descrizione_completa TEXT NOT NULL,
          servizi_offerti TEXT NOT NULL,
          localita VARCHAR(255) NOT NULL,
          indirizzo_pubblico VARCHAR(255),
          telefono_pubblico VARCHAR(64),
          email_pubblica VARCHAR(255),
          sito_web VARCHAR(255),
          social_instagram VARCHAR(255),
          social_linkedin VARCHAR(255),
          orari_apertura VARCHAR(255),
          publication_status VARCHAR(32) NOT NULL CHECK (
              publication_status IN ('BOZZA', 'IN_ATTESA_APPROVAZIONE', 'PUBBLICATA', 'SOSPESA', 'RIFIUTATA')
          ),
          data_ultimo_aggiornamento DATE NOT NULL,
          note_revisione_admin TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_activities_member_id ON business_activities(member_id);
      CREATE INDEX IF NOT EXISTS idx_activities_pub_status ON business_activities(publication_status);
    `
  },
  {
    name: '003_create_audit_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(64) PRIMARY KEY,
          actor_id VARCHAR(64) NOT NULL,
          action VARCHAR(128) NOT NULL,
          resource_type VARCHAR(64) NOT NULL,
          resource_id VARCHAR(64) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
          metadata TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
    `
  },
  {
    name: '004_create_auth_tables',
    sql: `
      CREATE TABLE IF NOT EXISTS user_accounts (
          id VARCHAR(64) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          actor_type VARCHAR(32) NOT NULL CHECK (actor_type IN ('MEMBER', 'TECHNICAL_ADMIN')),
          member_id VARCHAR(64) NULL REFERENCES members(id) ON DELETE RESTRICT,
          failed_login_attempts INTEGER NOT NULL DEFAULT 0,
          locked_until TIMESTAMPTZ NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT uq_user_accounts_member_id UNIQUE(member_id),
          CONSTRAINT chk_actor_type_member CHECK (
              (actor_type = 'TECHNICAL_ADMIN' AND member_id IS NULL) OR
              (actor_type = 'MEMBER' AND member_id IS NOT NULL)
          )
      );
      CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
      CREATE INDEX IF NOT EXISTS idx_user_accounts_member_id ON user_accounts(member_id);

      CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at TIMESTAMPTZ NOT NULL,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `
  }
];

export class DatabaseMigrator {
  private client: Queryable;

  constructor(client: Queryable) {
    this.client = client;
  }

  /**
   * Crea la tabella di tracciamento delle migrazioni se non esiste.
   */
  async initMigrationTable(): Promise<void> {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }

  /**
   * Restituisce i nomi di tutte le migrazioni già applicate.
   */
  async getAppliedMigrations(): Promise<string[]> {
    await this.initMigrationTable();
    const res = await this.client.query('SELECT name FROM schema_migrations ORDER BY id ASC;');
    return res.rows.map((row: any) => row.name as string);
  }

  /**
   * Esegue tutte le migrazioni non ancora applicate nell'ordine corretto.
   */
  async runMigrations(): Promise<{ applied: string[]; alreadyUpToDate: boolean }> {
    await this.initMigrationTable();
    const appliedNow: string[] = [];
    const existing = await this.getAppliedMigrations();

    for (const migration of MIGRATIONS) {
      if (!existing.includes(migration.name)) {
        // Se il client è un Pool (o espone connect()), riserviamo una connessione dedicata per garantire che BEGIN/COMMIT/ROLLBACK avvengano sulla stessa connessione
        const dedicatedClient = typeof this.client.connect === 'function'
          ? await this.client.connect()
          : null;
        const txClient = dedicatedClient || this.client;

        try {
          await txClient.query('BEGIN');
          await txClient.query(migration.sql);
          await txClient.query(
            'INSERT INTO schema_migrations (name, applied_at) VALUES ($1, now());',
            [migration.name]
          );
          await txClient.query('COMMIT');
          appliedNow.push(migration.name);
        } catch (error) {
          try {
            await txClient.query('ROLLBACK');
          } catch {
            // Ignora errore su rollback secondario
          }
          throw new Error(
            `[Migration Error] Fallimento durante l'applicazione della migrazione "${migration.name}": ${(error as Error).message}`
          );
        } finally {
          if (dedicatedClient && typeof dedicatedClient.release === 'function') {
            dedicatedClient.release();
          }
        }
      }
    }

    return {
      applied: appliedNow,
      alreadyUpToDate: appliedNow.length === 0
    };
  }

  /**
   * Esegue un reset completo delle tabelle dell'applicazione (solo per test o ambienti isolati).
   */
  async dropAllTables(): Promise<void> {
    await this.client.query('DROP TABLE IF EXISTS audit_logs CASCADE;');
    await this.client.query('DROP TABLE IF EXISTS business_activities CASCADE;');
    await this.client.query('DROP TABLE IF EXISTS members CASCADE;');
    await this.client.query('DROP TABLE IF EXISTS schema_migrations CASCADE;');
  }
}
