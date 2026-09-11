import type { Session, CreateSessionDto } from '../domain/auth.ts';

export interface ISessionRepository {
  create(dto: CreateSessionDto): Promise<Session>;
  findBySessionHash(sessionHash: string): Promise<Session | null>;
  updateLastAccessedAt(sessionHash: string, lastAccessedAt?: string): Promise<void>;
  deleteBySessionHash(sessionHash: string): Promise<void>;
  deleteByUserId(userId: string): Promise<number>;
  deleteExpired(now?: string): Promise<number>;
}

export class InMemorySessionRepository implements ISessionRepository {
  private sessions: Map<string, Session> = new Map();

  constructor(initialSessions: Session[] = []) {
    initialSessions.forEach((s) => this.sessions.set(s.id, { ...s }));
  }

  async create(dto: CreateSessionDto): Promise<Session> {
    const now = new Date().toISOString();
    const session: Session = {
      id: dto.sessionHash,
      userId: dto.userId,
      createdAt: dto.createdAt ?? now,
      lastAccessedAt: dto.lastAccessedAt ?? now,
      expiresAt: dto.expiresAt,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null
    };

    this.sessions.set(session.id, { ...session });
    return { ...session };
  }

  async findBySessionHash(sessionHash: string): Promise<Session | null> {
    const s = this.sessions.get(sessionHash);
    return s ? { ...s } : null;
  }

  async updateLastAccessedAt(sessionHash: string, lastAccessedAt?: string): Promise<void> {
    const s = this.sessions.get(sessionHash);
    if (!s) return;
    s.lastAccessedAt = lastAccessedAt ?? new Date().toISOString();
    this.sessions.set(sessionHash, { ...s });
  }

  async deleteBySessionHash(sessionHash: string): Promise<void> {
    this.sessions.delete(sessionHash);
  }

  async deleteByUserId(userId: string): Promise<number> {
    let deletedCount = 0;
    for (const [id, s] of this.sessions.entries()) {
      if (s.userId === userId) {
        this.sessions.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async deleteExpired(now?: string): Promise<number> {
    const threshold = new Date(now ?? new Date().toISOString()).getTime();
    let deletedCount = 0;
    for (const [id, s] of this.sessions.entries()) {
      if (new Date(s.expiresAt).getTime() < threshold) {
        this.sessions.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }
}
