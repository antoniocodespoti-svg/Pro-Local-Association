import type { IUserAccountRepository } from '../repositories/UserAccountRepository.ts';
import type { ISessionRepository } from '../repositories/SessionRepository.ts';
import type { IMemberRepository } from '../repositories/MemberRepository.ts';
import type { IPasswordHasher } from '../auth/PasswordHasher.ts';
import type { IAuditLogRepository } from '../repositories/AuditLogRepository.ts';
import type { UserAccount, ActorType } from '../domain/auth.ts';
import type { Member, MembershipStatus, ProLocalRole } from '../domain/models.ts';
import { ProLocalRole as ProLocalRoleConst } from '../domain/models.ts';
import {
  generateRawSessionId,
  hashSessionId,
  calculateAbsoluteExpiry,
  evaluateSessionValidity
} from '../auth/SessionManager.ts';
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  SessionInvalidError
} from '../domain/authErrors.ts';

/**
 * Metadati opzionali di contesto client per l'autenticazione.
 */
export interface AuthContextMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Risultato restituito da una chiamata authenticate con successo.
 * Il rawSessionToken viene restituito ESCLUSIVAMENTE al chiamante
 * (per consentire al controller HTTP di impostarlo nel cookie HttpOnly).
 */
export interface AuthenticationResult {
  rawSessionToken: string;
  sessionExpiresAt: string;
  userAccount: {
    id: string;
    email: string;
    actorType: ActorType;
    memberId: string | null;
  };
}

/**
 * Attore risolto a partire da una sessione valida.
 * Fornisce al sistema le informazioni essenziali per il futuro middleware e policy RBAC.
 */
export interface AuthenticatedActor {
  userId: string;
  actorType: ActorType;
  role: ProLocalRole;
  memberId: string | null;
  member: Member | null;
  membershipStatus: MembershipStatus | null;
  session: {
    hash: string;
    createdAt: string;
    lastAccessedAt: string;
    expiresAt: string;
  };
}

export const AUTH_POLICY = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15
} as const;

export class AuthService {
  private userAccountRepo: IUserAccountRepository;
  private sessionRepo: ISessionRepository;
  private memberRepo: IMemberRepository;
  private passwordHasher: IPasswordHasher;
  private auditLogRepo?: IAuditLogRepository;

  constructor(options: {
    userAccountRepo: IUserAccountRepository;
    sessionRepo: ISessionRepository;
    memberRepo: IMemberRepository;
    passwordHasher: IPasswordHasher;
    auditLogRepo?: IAuditLogRepository;
  }) {
    this.userAccountRepo = options.userAccountRepo;
    this.sessionRepo = options.sessionRepo;
    this.memberRepo = options.memberRepo;
    this.passwordHasher = options.passwordHasher;
    this.auditLogRepo = options.auditLogRepo;
  }

  /**
   * Autentica un utente tramite email e password.
   *
   * Flusso rigoroso:
   * 1. Normalizza email in lowercase e trim.
   * 2. Ricerca UserAccount tramite findByEmail.
   * 3. Se l'account non esiste, restituisce InvalidCredentialsError generico (no account enumeration).
   * 4. Se account non attivo, impedisce accesso (AccountInactiveError).
   * 5. Se account bloccato e locked_until nel futuro, impedisce login (AccountLockedError).
   * 6. Verifica password con IPasswordHasher.
   * 7. In caso di password errata: incrementa tentativi falliti; se >= 5 applica lockout di 15 min;
   *    registra audit LOGIN_FAILED (senza password né token).
   * 8. In caso di password corretta: azzera failed_login_attempts e locked_until.
   * 9. Genera token raw a 32 byte e memorizza esclusivamente l'hash SHA-256 in ISessionRepository.
   * 10. Registra audit LOGIN_SUCCESS (con actorId reale).
   * 11. Restituisce il rawSessionToken al chiamante.
   */
  async authenticate(
    rawEmail: string,
    password: string,
    metadata?: AuthContextMetadata,
    now: Date = new Date()
  ): Promise<AuthenticationResult> {
    const normalizedEmail = (rawEmail || '').trim().toLowerCase();

    const account = await this.userAccountRepo.findByEmail(normalizedEmail);

    if (!account) {
      await this.safeAuditLog({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actorId: 'anonymous',
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        resourceId: normalizedEmail || 'unknown',
        timestamp: now.toISOString(),
        metadata: {
          reason: 'USER_NOT_FOUND',
          ipAddress: metadata?.ipAddress || null,
          userAgent: metadata?.userAgent || null
        }
      });
      throw new InvalidCredentialsError();
    }

    // Verifica stato attivo
    if (!account.isActive) {
      await this.safeAuditLog({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actorId: account.id,
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        resourceId: account.id,
        timestamp: now.toISOString(),
        metadata: {
          reason: 'ACCOUNT_INACTIVE',
          ipAddress: metadata?.ipAddress || null,
          userAgent: metadata?.userAgent || null
        }
      });
      throw new AccountInactiveError();
    }

    // Verifica eventuale blocco temporaneo (Account Lockout)
    if (account.lockedUntil) {
      const lockedUntilDate = new Date(account.lockedUntil);
      if (now.getTime() < lockedUntilDate.getTime()) {
        await this.safeAuditLog({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          actorId: account.id,
          action: 'LOGIN_FAILED',
          resourceType: 'auth',
          resourceId: account.id,
          timestamp: now.toISOString(),
          metadata: {
            reason: 'ACCOUNT_LOCKED',
            lockedUntil: account.lockedUntil,
            ipAddress: metadata?.ipAddress || null,
            userAgent: metadata?.userAgent || null
          }
        });
        throw new AccountLockedError(account.lockedUntil);
      }
    }

    // Verifica password con comparazione timing-safe
    const passwordValid = await this.passwordHasher.verify(password, account.passwordHash);

    if (!passwordValid) {
      const newAttempts = account.failedLoginAttempts + 1;
      let newLockedUntil: string | null = null;

      if (newAttempts >= AUTH_POLICY.MAX_FAILED_ATTEMPTS) {
        const lockDate = new Date(now.getTime() + AUTH_POLICY.LOCKOUT_DURATION_MINUTES * 60 * 1000);
        newLockedUntil = lockDate.toISOString();
      }

      await this.userAccountRepo.updateLoginFailureState(account.id, newAttempts, newLockedUntil);

      await this.safeAuditLog({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actorId: account.id,
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        resourceId: account.id,
        timestamp: now.toISOString(),
        metadata: {
          reason: 'INVALID_PASSWORD',
          failedAttempts: newAttempts,
          lockedUntil: newLockedUntil,
          ipAddress: metadata?.ipAddress || null,
          userAgent: metadata?.userAgent || null
        }
      });

      if (newLockedUntil) {
        throw new AccountLockedError(newLockedUntil);
      }
      throw new InvalidCredentialsError();
    }

    // Password corretta: reset contatore fallimenti e sblocco
    if (account.failedLoginAttempts > 0 || account.lockedUntil !== null) {
      await this.userAccountRepo.resetLoginFailureState(account.id);
    }

    // Generazione sessione: token raw a 32 byte, persistito unicamente hash SHA-256
    const rawSessionToken = generateRawSessionId();
    const sessionHash = hashSessionId(rawSessionToken);
    const expiresAt = calculateAbsoluteExpiry(now).toISOString();
    const createdAt = now.toISOString();

    await this.sessionRepo.create({
      sessionHash,
      userId: account.id,
      expiresAt,
      createdAt,
      lastAccessedAt: createdAt,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null
    });

    await this.safeAuditLog({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId: account.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'auth',
      resourceId: account.id,
      timestamp: createdAt,
      metadata: {
        actorType: account.actorType,
        ipAddress: metadata?.ipAddress || null,
        userAgent: metadata?.userAgent || null
      }
    });

    return {
      rawSessionToken,
      sessionExpiresAt: expiresAt,
      userAccount: {
        id: account.id,
        email: account.email,
        actorType: account.actorType,
        memberId: account.memberId
      }
    };
  }

  /**
   * Risolve l'attore autenticato a partire dal token raw della sessione.
   *
   * Flusso:
   * 1. Calcola l'hash SHA-256 del token ricevuto.
   * 2. Recupera la sessione tramite ISessionRepository.
   * 3. Verifica idle timeout (30 min) e absolute timeout (8h). Se scaduta, cancella la sessione e solleva SessionInvalidError.
   * 4. Recupera lo UserAccount collegato. Se inesistente o inattivo, revoca e solleva errore.
   * 5. Se actorType = TECHNICAL_ADMIN:
   *    - role = AMMINISTRATORE_TECNICO
   *    - memberId = null
   *    - member = null, membershipStatus = null (non tocca la tabella members)
   * 6. Se actorType = MEMBER:
   *    - recupera il Member tramite memberRepo dal database;
   *    - il ruolo e lo stato associativo vengono letti ESCLUSIVAMENTE da Member (mai dal client, mai dalla sessione statica).
   * 7. Aggiorna last_accessed_at senza estendere l'expires_at assoluto.
   */
  async resolveAuthenticatedActor(rawSessionToken: string, now: Date = new Date()): Promise<AuthenticatedActor> {
    if (!rawSessionToken || typeof rawSessionToken !== 'string') {
      throw new SessionInvalidError('Token di sessione assente o malformato.');
    }

    const sessionHash = hashSessionId(rawSessionToken);
    const session = await this.sessionRepo.findBySessionHash(sessionHash);

    if (!session) {
      throw new SessionInvalidError('Sessione non trovata.', 'NOT_FOUND');
    }

    const validity = evaluateSessionValidity(session, now);
    if (!validity.isValid) {
      // Sessione scaduta: rimozione proattiva
      await this.sessionRepo.deleteBySessionHash(sessionHash);
      throw new SessionInvalidError('Sessione scaduta.', validity.reason);
    }

    const user = await this.userAccountRepo.findById(session.userId);
    if (!user || !user.isActive) {
      await this.sessionRepo.deleteBySessionHash(sessionHash);
      throw new SessionInvalidError('Utente inattivo o rimosso.');
    }

    // Risoluzione ruoli e socio
    let role: ProLocalRole;
    let member: Member | null = null;
    let membershipStatus: MembershipStatus | null = null;

    if (user.actorType === 'TECHNICAL_ADMIN') {
      role = ProLocalRoleConst.AMMINISTRATORE_TECNICO;
    } else {
      if (!user.memberId) {
        await this.sessionRepo.deleteBySessionHash(sessionHash);
        throw new SessionInvalidError('Account socio orfano di memberId.');
      }

      member = await this.memberRepo.findById(user.memberId);
      if (!member) {
        await this.sessionRepo.deleteBySessionHash(sessionHash);
        throw new SessionInvalidError('Profilo socio associato non trovato.');
      }

      membershipStatus = member.statoAssociativo;
      role = ProLocalRoleConst.SOCIO;
    }

    // Aggiornamento lastAccessedAt per rinnovare l'idle timeout
    const currentTimestamp = now.toISOString();
    await this.sessionRepo.updateLastAccessedAt(sessionHash, currentTimestamp);

    return {
      userId: user.id,
      actorType: user.actorType,
      role,
      memberId: user.memberId,
      member,
      membershipStatus,
      session: {
        hash: session.id,
        createdAt: session.createdAt,
        lastAccessedAt: currentTimestamp,
        expiresAt: session.expiresAt
      }
    };
  }

  /**
   * Effettua il logout revocando la sessione tramite hash.
   * L'operazione è idempotente: non fallisce se la sessione è già stata revocata o è scaduta.
   * Registra audit log se la sessione esisteva.
   */
  async logout(rawSessionToken: string, metadata?: AuthContextMetadata, now: Date = new Date()): Promise<void> {
    if (!rawSessionToken || typeof rawSessionToken !== 'string') {
      return;
    }

    try {
      const sessionHash = hashSessionId(rawSessionToken);
      const session = await this.sessionRepo.findBySessionHash(sessionHash);

      if (session) {
        await this.sessionRepo.deleteBySessionHash(sessionHash);

        await this.safeAuditLog({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          actorId: session.userId,
          action: 'LOGOUT',
          resourceType: 'auth',
          resourceId: session.userId,
          timestamp: now.toISOString(),
          metadata: {
            ipAddress: metadata?.ipAddress || null,
            userAgent: metadata?.userAgent || null
          }
        });
      }
    } catch {
      // Idempotente e safe
    }
  }

  private async safeAuditLog(entry: {
    id: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!this.auditLogRepo) return;
    try {
      await this.auditLogRepo.log(entry);
    } catch {
      // L'audit failure non deve interrompere silenziosamente o distruggere il flusso
    }
  }
}
