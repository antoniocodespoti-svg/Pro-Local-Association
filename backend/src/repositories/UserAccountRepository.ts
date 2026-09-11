import type { UserAccount, CreateUserAccountDto } from '../domain/auth.ts';

export interface IUserAccountRepository {
  findById(id: string): Promise<UserAccount | null>;
  findByEmail(email: string): Promise<UserAccount | null>;
  findByMemberId(memberId: string): Promise<UserAccount | null>;
  create(account: CreateUserAccountDto): Promise<UserAccount>;
  updateLoginFailureState(id: string, failedAttempts: number, lockedUntil: string | null): Promise<void>;
  resetLoginFailureState(id: string): Promise<void>;
  setLockedUntil(id: string, lockedUntil: string | null): Promise<void>;
  setActive(id: string, isActive: boolean): Promise<void>;
}

export class InMemoryUserAccountRepository implements IUserAccountRepository {
  private accounts: Map<string, UserAccount> = new Map();

  constructor(initialAccounts: UserAccount[] = []) {
    initialAccounts.forEach((acc) => this.accounts.set(acc.id, { ...acc }));
  }

  async findById(id: string): Promise<UserAccount | null> {
    const acc = this.accounts.get(id);
    return acc ? { ...acc } : null;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const normalized = email.trim().toLowerCase();
    for (const acc of this.accounts.values()) {
      if (acc.email.toLowerCase() === normalized) {
        return { ...acc };
      }
    }
    return null;
  }

  async findByMemberId(memberId: string): Promise<UserAccount | null> {
    for (const acc of this.accounts.values()) {
      if (acc.memberId === memberId) {
        return { ...acc };
      }
    }
    return null;
  }

  async create(dto: CreateUserAccountDto): Promise<UserAccount> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`Email già registrata: ${normalizedEmail}`);
    }

    if (dto.memberId) {
      const existingMemberAccount = await this.findByMemberId(dto.memberId);
      if (existingMemberAccount) {
        throw new Error(`Account già esistente per il membro: ${dto.memberId}`);
      }
    }

    const now = new Date().toISOString();
    const newAccount: UserAccount = {
      id: dto.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      passwordHash: dto.passwordHash,
      actorType: dto.actorType,
      memberId: dto.memberId ?? null,
      failedLoginAttempts: dto.failedLoginAttempts ?? 0,
      lockedUntil: dto.lockedUntil ?? null,
      isActive: dto.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };

    this.accounts.set(newAccount.id, { ...newAccount });
    return { ...newAccount };
  }

  async updateLoginFailureState(id: string, failedAttempts: number, lockedUntil: string | null): Promise<void> {
    const acc = this.accounts.get(id);
    if (!acc) return;
    acc.failedLoginAttempts = failedAttempts;
    acc.lockedUntil = lockedUntil;
    acc.updatedAt = new Date().toISOString();
    this.accounts.set(id, { ...acc });
  }

  async resetLoginFailureState(id: string): Promise<void> {
    const acc = this.accounts.get(id);
    if (!acc) return;
    acc.failedLoginAttempts = 0;
    acc.lockedUntil = null;
    acc.updatedAt = new Date().toISOString();
    this.accounts.set(id, { ...acc });
  }

  async setLockedUntil(id: string, lockedUntil: string | null): Promise<void> {
    const acc = this.accounts.get(id);
    if (!acc) return;
    acc.lockedUntil = lockedUntil;
    acc.updatedAt = new Date().toISOString();
    this.accounts.set(id, { ...acc });
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const acc = this.accounts.get(id);
    if (!acc) return;
    acc.isActive = isActive;
    acc.updatedAt = new Date().toISOString();
    this.accounts.set(id, { ...acc });
  }
}
