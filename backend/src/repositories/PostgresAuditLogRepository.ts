import type { IAuditLogRepository } from './AuditLogRepository.ts';
import type { AuditLogEntry } from '../domain/models.ts';
import type { Queryable } from '../db/migrator.ts';

export class PostgresAuditLogRepository implements IAuditLogRepository {
  private client: Queryable;

  constructor(client: Queryable) {
    this.client = client;
  }

  private mapRowToEntry(row: any): AuditLogEntry {
    let meta: Record<string, unknown> | undefined = undefined;
    if (row.metadata) {
      try {
        meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      } catch {
        meta = { raw: row.metadata };
      }
    }

    const timestampStr =
      row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp || '');

    return {
      id: row.id,
      actorId: row.actor_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      timestamp: timestampStr,
      metadata: meta
    };
  }

  async log(entry: AuditLogEntry): Promise<void> {
    await this.client.query(
      `INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [
        entry.id,
        entry.actorId,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.timestamp || new Date().toISOString(),
        entry.metadata ? JSON.stringify(entry.metadata) : null
      ]
    );
  }

  async findAll(): Promise<AuditLogEntry[]> {
    const res = await this.client.query(
      `SELECT id, actor_id, action, resource_type, resource_id, timestamp, metadata
       FROM audit_logs
       ORDER BY timestamp DESC;`
    );
    return res.rows.map((r: any) => this.mapRowToEntry(r));
  }

  async findByActorId(actorId: string): Promise<AuditLogEntry[]> {
    const res = await this.client.query(
      `SELECT id, actor_id, action, resource_type, resource_id, timestamp, metadata
       FROM audit_logs
       WHERE actor_id = $1
       ORDER BY timestamp DESC;`,
      [actorId]
    );
    return res.rows.map((r: any) => this.mapRowToEntry(r));
  }
}
