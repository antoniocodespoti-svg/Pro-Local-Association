import type { ActivityRevision, RevisionStatus } from '../domain/models.ts';
import { RevisionStatus as RevisionStatusConst } from '../domain/models.ts';

export interface IActivityRevisionRepository {
  create(revision: ActivityRevision): Promise<ActivityRevision>;
  findById(id: string): Promise<ActivityRevision | null>;
  findByIdForUpdate(id: string): Promise<ActivityRevision | null>;
  findByActivityId(activityId: string): Promise<ActivityRevision[]>;
  findPendingByActivityId(activityId: string): Promise<ActivityRevision | null>;
  findPending(): Promise<ActivityRevision[]>;
  update(revision: ActivityRevision): Promise<ActivityRevision>;
}

export class InMemoryActivityRevisionRepository implements IActivityRevisionRepository {
  private revisions: Map<string, ActivityRevision> = new Map();

  constructor(initialRevisions: ActivityRevision[] = []) {
    initialRevisions.forEach((r) => this.revisions.set(r.id, { ...r }));
  }

  async create(revision: ActivityRevision): Promise<ActivityRevision> {
    const copy = { ...revision };
    this.revisions.set(revision.id, copy);
    return { ...copy };
  }

  async findById(id: string): Promise<ActivityRevision | null> {
    const r = this.revisions.get(id);
    return r ? { ...r } : null;
  }

  async findByIdForUpdate(id: string): Promise<ActivityRevision | null> {
    return this.findById(id);
  }

  async findByActivityId(activityId: string): Promise<ActivityRevision[]> {
    return Array.from(this.revisions.values())
      .filter((r) => r.activityId === activityId)
      .map((r) => ({ ...r }));
  }

  async findPendingByActivityId(activityId: string): Promise<ActivityRevision | null> {
    const found = Array.from(this.revisions.values()).find(
      (r) => r.activityId === activityId && r.revisionStatus === RevisionStatusConst.IN_ATTESA_APPROVAZIONE
    );
    return found ? { ...found } : null;
  }

  async findPending(): Promise<ActivityRevision[]> {
    return Array.from(this.revisions.values())
      .filter((r) => r.revisionStatus === RevisionStatusConst.IN_ATTESA_APPROVAZIONE)
      .map((r) => ({ ...r }));
  }

  async update(revision: ActivityRevision): Promise<ActivityRevision> {
    if (!this.revisions.has(revision.id)) {
      throw new Error(`Revisione non trovata per l'aggiornamento: ${revision.id}`);
    }
    const copy = { ...revision };
    this.revisions.set(revision.id, copy);
    return { ...copy };
  }
}
