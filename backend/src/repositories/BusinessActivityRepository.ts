import type { BusinessActivity } from '../domain/models.ts';
import type { PublicationStatus } from '../domain/models.ts';

export interface IBusinessActivityRepository {
  findById(id: string): Promise<BusinessActivity | null>;
  findByMemberId(memberId: string): Promise<BusinessActivity[]>;
  findAll(): Promise<BusinessActivity[]>;
  update(activity: BusinessActivity): Promise<BusinessActivity>;
  updatePublicationStatus(id: string, status: PublicationStatus): Promise<BusinessActivity | null>;
}

export class InMemoryBusinessActivityRepository implements IBusinessActivityRepository {
  private activities: Map<string, BusinessActivity> = new Map();

  constructor(initialActivities: BusinessActivity[] = []) {
    initialActivities.forEach((a) => this.activities.set(a.id, { ...a }));
  }

  async findById(id: string): Promise<BusinessActivity | null> {
    const act = this.activities.get(id);
    return act ? { ...act } : null;
  }

  async findByMemberId(memberId: string): Promise<BusinessActivity[]> {
    return Array.from(this.activities.values())
      .filter((a) => a.memberId === memberId)
      .map((a) => ({ ...a }));
  }

  async findAll(): Promise<BusinessActivity[]> {
    return Array.from(this.activities.values()).map((a) => ({ ...a }));
  }

  async update(activity: BusinessActivity): Promise<BusinessActivity> {
    const updated = {
      ...activity,
      dataUltimoAggiornamento: new Date().toISOString().split('T')[0]
    };
    this.activities.set(activity.id, updated);
    return { ...updated };
  }

  async updatePublicationStatus(id: string, status: PublicationStatus): Promise<BusinessActivity | null> {
    const act = this.activities.get(id);
    if (!act) return null;
    const updated = {
      ...act,
      statoPubblicazione: status,
      dataUltimoAggiornamento: new Date().toISOString().split('T')[0]
    };
    this.activities.set(id, updated);
    return { ...updated };
  }
}
