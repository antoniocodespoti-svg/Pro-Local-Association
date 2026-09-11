/**
 * Modelli di Dominio per l'Autenticazione e la Gestione delle Sessioni (Fase 3.2).
 * Separazione rigorosa tra Identità Autenticabile (UserAccount) e Membro dell'Associazione (Member).
 */

export const ActorType = {
  MEMBER: 'MEMBER',
  TECHNICAL_ADMIN: 'TECHNICAL_ADMIN'
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];

/**
 * Entità Account Utente.
 * Rappresenta l'identità autenticabile con credenziali crittografiche.
 */
export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  actorType: ActorType;
  memberId: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null; // ISO 8601 o null
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dati per la creazione di un nuovo account utente.
 */
export interface CreateUserAccountDto {
  id?: string;
  email: string;
  passwordHash: string;
  actorType: ActorType;
  memberId?: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  isActive?: boolean;
}

/**
 * Entità Sessione Server-Side.
 * Salva esclusivamente l'hash SHA-256 del session ID raw.
 */
export interface Session {
  id: string; // SHA-256 esadecimale (64 char) del raw session token
  userId: string; // Foreign key verso UserAccount
  createdAt: string; // ISO 8601
  lastAccessedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Dati per la creazione di una nuova sessione.
 */
export interface CreateSessionDto {
  sessionHash: string; // id
  userId: string;
  expiresAt: string; // ISO 8601
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string;
  lastAccessedAt?: string;
}
