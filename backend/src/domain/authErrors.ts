/**
 * Gerarchia degli Errori Applicativi per l'Autenticazione e il Session Lifecycle (Fase 3.3).
 * Completamente disaccoppiati da Express, framework HTTP e codici di stato di rete.
 */

export class AuthError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Errore generico restituito quando le credenziali fornite non sono valide
 * (email inesistente oppure password non corrispondente).
 * Non rivela l'esistenza o meno dell'email per prevenire account enumeration.
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message = 'Credenziali non valide.') {
    super(message, 'INVALID_CREDENTIALS');
  }
}

/**
 * Errore sollevato quando l'account è temporaneamente bloccato per troppi tentativi falliti consecutivi.
 */
export class AccountLockedError extends AuthError {
  public readonly lockedUntil: string;

  constructor(lockedUntil: string, message = 'Account temporaneamente bloccato per troppi tentativi falliti. Riprovare più tardi.') {
    super(message, 'ACCOUNT_LOCKED');
    this.lockedUntil = lockedUntil;
  }
}

/**
 * Errore sollevato quando l'account utente è stato disattivato dall'amministrazione.
 */
export class AccountInactiveError extends AuthError {
  constructor(message = 'Account utente non attivo. Contattare l\'amministrazione.') {
    super(message, 'ACCOUNT_INACTIVE');
  }
}

/**
 * Errore sollevato quando un session token è inesistente, non valido o scaduto.
 */
export class SessionInvalidError extends AuthError {
  public readonly reason?: string;

  constructor(message = 'Sessione non valida o scaduta.', reason?: string) {
    super(message, 'SESSION_INVALID');
    this.reason = reason;
  }
}
