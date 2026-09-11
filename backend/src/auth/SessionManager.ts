import { randomBytes, createHash } from 'node:crypto';

/**
 * Parametri di configurazione centralizzati per i timeout delle sessioni.
 */
export const SESSION_CONFIG = {
  IDLE_TIMEOUT_MINUTES: 30,
  ABSOLUTE_TIMEOUT_HOURS: 8,
  SESSION_ID_BYTES: 32
} as const;

/**
 * Genera un raw session ID casuale crittograficamente sicuro con 32 byte di entropia (256 bit).
 * Questo valore grezzo deve essere consegnato ESCLUSIVAMENTE al client (via cookie HttpOnly).
 * NON deve essere salvato nel database né stampato nei log.
 */
export function generateRawSessionId(): string {
  return randomBytes(SESSION_CONFIG.SESSION_ID_BYTES).toString('hex');
}

/**
 * Calcola l'hash SHA-256 esadecimale (64 caratteri) di un raw session ID.
 * SOLO questo valore hash deve essere memorizzato nella colonna sessions.id del database.
 */
export function hashSessionId(rawSessionId: string): string {
  if (!rawSessionId || typeof rawSessionId !== 'string') {
    throw new Error('Session ID raw non valido per il calcolo dell hash');
  }
  return createHash('sha256').update(rawSessionId).digest('hex');
}

/**
 * Calcola la data/ora di scadenza iniziale assoluta per una nuova sessione.
 */
export function calculateAbsoluteExpiry(now: Date = new Date()): Date {
  const expiry = new Date(now.getTime());
  expiry.setHours(expiry.getHours() + SESSION_CONFIG.ABSOLUTE_TIMEOUT_HOURS);
  return expiry;
}

/**
 * Calcola la data/ora di scadenza per inattività (idle timeout).
 */
export function calculateIdleExpiry(lastAccessedAt: Date): Date {
  const expiry = new Date(lastAccessedAt.getTime());
  expiry.setMinutes(expiry.getMinutes() + SESSION_CONFIG.IDLE_TIMEOUT_MINUTES);
  return expiry;
}

export interface SessionValidityResult {
  isValid: boolean;
  reason?: 'EXPIRED_ABSOLUTE' | 'EXPIRED_IDLE' | 'NOT_FOUND';
}

/**
 * Verifica se una sessione è ancora valida rispetto a:
 * 1. Absolute timeout (expiresAt)
 * 2. Idle timeout (lastAccessedAt + 30 minuti)
 */
export function evaluateSessionValidity(
  session: { createdAt: string; lastAccessedAt: string; expiresAt: string } | null,
  now: Date = new Date()
): SessionValidityResult {
  if (!session) {
    return { isValid: false, reason: 'NOT_FOUND' };
  }

  const nowTime = now.getTime();
  const absoluteExpiryTime = new Date(session.expiresAt).getTime();
  if (nowTime >= absoluteExpiryTime) {
    return { isValid: false, reason: 'EXPIRED_ABSOLUTE' };
  }

  const lastAccessedTime = new Date(session.lastAccessedAt).getTime();
  const idleExpiryTime = calculateIdleExpiry(new Date(lastAccessedTime)).getTime();
  if (nowTime >= idleExpiryTime) {
    return { isValid: false, reason: 'EXPIRED_IDLE' };
  }

  return { isValid: true };
}
