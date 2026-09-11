import type { ISessionRepository } from './SessionRepository.ts';
import type { Session, CreateSessionDto } from '../domain/auth.ts';
import type { Queryable } from '../db/migrator.ts';

export class PostgresSessionRepository implements ISessionRepository {
  private client: Queryable;

  constructor(client: Queryable) {
    this.client = client;
  }

  private mapRowToSession(row: any): Session {
    const createdAtStr =
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);

    const lastAccessedAtStr =
      row.last_accessed_at instanceof Date
        ? row.last_accessed_at.toISOString()
        : String(row.last_accessed_at);

    const expiresAtStr =
      row.expires_at instanceof Date
        ? row.expires_at.toISOString()
        : String(row.expires_at);

    return {
      id: row.id,
      userId: row.user_id,
      createdAt: createdAtStr,
      lastAccessedAt: lastAccessedAtStr,
      expiresAt: expiresAtStr,
      ipAddress: row.ip_address || null,
      userAgent: row.user_agent || null
    };
  }

  async create(dto: CreateSessionDto): Promise<Session> {
    const ipAddress = dto.ipAddress ?? null;
    const userAgent = dto.userAgent ?? null;

    const res = await this.client.query(
      `INSERT INTO sessions (
          id, user_id, created_at, last_accessed_at, expires_at, ip_address, user_agent
       ) VALUES ($1, $2, now(), now(), $3, $4, $5)
       RETURNING id, user_id, created_at, last_accessed_at, expires_at, ip_address, user_agent;`,
      [dto.sessionHash, dto.userId, dto.expiresAt, ipAddress, userAgent]
    );

    return this.mapRowToSession(res.rows[0]);
  }

  async findBySessionHash(sessionHash: string): Promise<Session | null> {
    const res = await this.client.query(
      `SELECT id, user_id, created_at, last_accessed_at, expires_at, ip_address, user_agent
       FROM sessions
       WHERE id = $1;`,
      [sessionHash]
    );

    if (res.rows.length === 0) return null;
    return this.mapRowToSession(res.rows[0]);
  }

  async updateLastAccessedAt(sessionHash: string, lastAccessedAt?: string): Promise<void> {
    if (lastAccessedAt) {
      await this.client.query(
        `UPDATE sessions
         SET last_accessed_at = $1
         WHERE id = $2;`,
        [lastAccessedAt, sessionHash]
      );
    } else {
      await this.client.query(
        `UPDATE sessions
         SET last_accessed_at = now()
         WHERE id = $1;`,
        [sessionHash]
      );
    }
  }

  async deleteBySessionHash(sessionHash: string): Promise<void> {
    await this.client.query(
      `DELETE FROM sessions
       WHERE id = $1;`,
      [sessionHash]
    );
  }

  async deleteByUserId(userId: string): Promise<number> {
    const res = await this.client.query(
      `DELETE FROM sessions
       WHERE user_id = $1;`,
      [userId]
    );
    return res.rowCount ?? 0;
  }

  async deleteExpired(now?: string): Promise<number> {
    let res;
    if (now) {
      res = await this.client.query(
        `DELETE FROM sessions
         WHERE expires_at < $1;`,
        [now]
      );
    } else {
      res = await this.client.query(
        `DELETE FROM sessions
         WHERE expires_at < now();`
      );
    }
    return res.rowCount ?? 0;
  }
}
