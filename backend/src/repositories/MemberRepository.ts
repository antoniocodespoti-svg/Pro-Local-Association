import type { Member } from '../domain/models.ts';
import type { MembershipStatus } from '../domain/models.ts';
import { MembershipStatus as MembershipStatusConst } from '../domain/models.ts';

export interface IMemberRepository {
  findById(id: string): Promise<Member | null>;
  findAll(): Promise<Member[]>;
  updateStatus(id: string, newStatus: MembershipStatus): Promise<Member | null>;
}

export class InMemoryMemberRepository implements IMemberRepository {
  private members: Map<string, Member> = new Map();

  constructor(initialMembers: Member[] = []) {
    initialMembers.forEach((m) => this.members.set(m.id, { ...m }));
  }

  async findById(id: string): Promise<Member | null> {
    const member = this.members.get(id);
    return member ? { ...member } : null;
  }

  async findAll(): Promise<Member[]> {
    return Array.from(this.members.values()).map((m) => ({ ...m }));
  }

  async updateStatus(id: string, newStatus: MembershipStatus): Promise<Member | null> {
    const member = this.members.get(id);
    if (!member) return null;
    const updated = {
      ...member,
      statoAssociativo: newStatus,
      quotaSocialeInRegola: newStatus === MembershipStatusConst.ATTIVO
    };
    this.members.set(id, updated);
    return { ...updated };
  }
}
