import type { IUserAccountRepository } from './UserAccountRepository.ts';
import type { UserAccount, CreateUserAccountDto, ActorType } from '../domain/auth.ts';
import type { Queryable } from '../db/migrator.ts';

export class PostgresUserAccountRepository implements IUserAccountRepository {
  private client: Queryable;

  constructor(client: Queryable) {
    this.client = client;
  }

  private mapRowToUserAccount(row: any): UserAccount {
    const lockedUntilStr =
      row.locked_until instanceof Date
        ? row.locked_until.toISOString()
        : row.locked_until
        ? String(row.locked_until)
        : null;

    const createdAtStr =
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);

    const updatedAtStr =
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);

    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      actorType: row.actor_type as ActorType,
      memberId: row.member_id || null,
      failedLoginAttempts: Number(row.failed_login_attempts ?? 0),
      lockedUntil: lockedUntilStr,
      isActive: Boolean(row.is_active),
      createdAt: createdAtStr,
      updatedAt: updatedAtStr
    };
  }

  async findById(id: string): Promise<UserAccount | null> {
    const res = await this.client.query(
      `SELECT id, email, password_hash, actor_type, member_id,
              failed_login_attempts, locked_until, is_active, created_at, updated_at
       FROM user_accounts
       WHERE id = $1;`,
      [id]
    );

    if (res.rows.length === 0) return null;
    return this.mapRowToUserAccount(res.rows[0]);
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const normalized = email.trim().toLowerCase();
    const res = await this.client.query(
      `SELECT id, email, password_hash, actor_type, member_id,
              failed_login_attempts, locked_until, is_active, created_at, updated_at
       FROM user_accounts
       WHERE LOWER(email) = LOWER($1);`,
      [normalized]
    );

    if (res.rows.length === 0) return null;
    return this.mapRowToUserAccount(res.rows[0]);
  }

  async findByMemberId(memberId: string): Promise<UserAccount | null> {
    const res = await this.client.query(
      `SELECT id, email, password_hash, actor_type, member_id,
              failed_login_attempts, locked_until, is_active, created_at, updated_at
       FROM user_accounts
       WHERE member_id = $1;`,
      [memberId]
    );

    if (res.rows.length === 0) return null;
    return this.mapRowToUserAccount(res.rows[0]);
  }

  async create(dto: CreateUserAccountDto): Promise<UserAccount> {
    const id = dto.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const normalizedEmail = dto.email.trim().toLowerCase();
    const failedAttempts = dto.failedLoginAttempts ?? 0;
    const lockedUntil = dto.lockedUntil ?? null;
    const isActive = dto.isActive ?? true;
    const memberId = dto.memberId ?? null;

    const res = await this.client.query(
      `INSERT INTO user_accounts (
          id, email, password_hash, actor_type, member_id,
          failed_login_attempts, locked_until, is_active, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
       RETURNING id, email, password_hash, actor_type, member_id,
                 failed_login_attempts, locked_until, is_active, created_at, updated_at;`,
      [
        id,
        normalizedEmail,
        dto.passwordHash,
        dto.actorType,
        memberId,
        failedAttempts,
        lockedUntil,
        isActive
      ]
    );

    return this.mapRowToUserAccount(res.rows[0]);
  }

  async updateLoginFailureState(id: string, failedAttempts: number, lockedUntil: string | null): Promise<void> {
    await this.client.query(
      `UPDATE user_accounts
       SET failed_login_attempts = $1,
           locked_until = $2,
           updated_at = now()
       WHERE id = $3;`,
      [failedAttempts, lockedUntil, id]
    );
  }

  async resetLoginFailureState(id: string): Promise<void> {
    await this.client.query(
      `UPDATE user_accounts
       SET failed_login_attempts = 0,
           locked_until = NULL,
           updated_at = now()
       WHERE id = $1;`,
      [id]
    );
  }

  async setLockedUntil(id: string, lockedUntil: string | null): Promise<void> {
    await this.client.query(
      `UPDATE user_accounts
       SET locked_until = $1,
           updated_at = now()
       WHERE id = $2;`,
      [lockedUntil, id]
    );
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.client.query(
      `UPDATE user_accounts
       SET is_active = $1,
           updated_at = now()
       WHERE id = $2;`,
      [isActive, id]
    );
  }
}
