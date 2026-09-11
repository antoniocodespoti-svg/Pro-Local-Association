import type { AuditLogEntry } from '../domain/models.ts';

export interface IAuditLogRepository {
  log(entry: AuditLogEntry): Promise<void>;
  findAll(): Promise<AuditLogEntry[]>;
  findByActorId(actorId: string): Promise<AuditLogEntry[]>;
}

export class InMemoryAuditLogRepository implements IAuditLogRepository {
  private logs: AuditLogEntry[] = [];

  async log(entry: AuditLogEntry): Promise<void> {
    this.logs.push({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString()
    });
  }

  async findAll(): Promise<AuditLogEntry[]> {
    return [...this.logs];
  }

  async findByActorId(actorId: string): Promise<AuditLogEntry[]> {
    return this.logs.filter((l) => l.actorId === actorId);
  }
}
