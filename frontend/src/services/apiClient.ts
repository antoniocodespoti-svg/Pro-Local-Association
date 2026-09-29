import type { PublicActivity, MemberAreaResponse, UpdateActivityInput } from '../types/domain.ts';
import { ApiError } from '../types/auth.ts';
import type { LoginResponse, CurrentUserResponse } from '../types/auth.ts';

export class ProLocalApiClient {
  private baseUrl: string;
  private onUnauthorizedCallback?: () => void;

  constructor(customBaseUrl?: string) {
    this.baseUrl = customBaseUrl || this.resolveBaseUrl();
  }

  private resolveBaseUrl(): string {
    if (typeof window !== 'undefined' && (window as any).__PROLOCAL_API_URL__) {
      return (window as any).__PROLOCAL_API_URL__;
    }
    return 'http://localhost:3001';
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setOnUnauthorized(callback?: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public notifyUnauthorized() {
    if (this.onUnauthorizedCallback) {
      this.onUnauthorizedCallback();
    }
  }

  /**
   * Autenticazione reale con credenziali HTTP.
   * Il backend restituisce cookie HttpOnly 'prolocal_session'.
   * Nessun token o password viene memorizzato lato client.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'ProLocalApp'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        throw new ApiError('Credenziali non valide. Verificare email e password.', 401);
      }
      if (res.status === 423) {
        throw new ApiError(
          'Account temporaneamente bloccato per motivi di sicurezza dopo troppi tentativi falliti. Riprovare più tardi.',
          423,
          'ACCOUNT_LOCKED',
          data
        );
      }
      if (res.status === 400) {
        throw new ApiError('I campi email e password sono obbligatori.', 400);
      }
      if (res.status === 403) {
        throw new ApiError('Accesso negato: account non attivo.', 403);
      }
      throw new ApiError('Errore durante la procedura di accesso. Riprovare più tardi.', res.status);
    }

    return data;
  }

  /**
   * Verifica la sessione attuale chiedendo al backend /api/auth/me tramite cookie HttpOnly.
   * Il backend è l'unica autorità sull'identità.
   */
  async getCurrentUser(): Promise<CurrentUserResponse | null> {
    const res = await fetch(`${this.baseUrl}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      throw new ApiError(`Errore durante la verifica della sessione (${res.status})`, res.status);
    }

    return res.json();
  }

  /**
   * Logout globale server-side.
   * Revoca la sessione e ordina al browser la cancellazione del cookie HttpOnly.
   */
  async logout(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'ProLocalApp'
      }
    });

    if (!res.ok && res.status !== 401) {
      // Procediamo comunque: il backend ha comunque cancellato il cookie se possibile
    }
  }

  /**
   * Recupera le attività pubbliche per la vetrina
   * Solo schede PUBBLICATE di soci con stato ATTIVO
   */
  async getPublicShowcase(): Promise<PublicActivity[]> {
    const res = await fetch(`${this.baseUrl}/api/showcase`);
    if (!res.ok) {
      throw new ApiError(`Errore durante il recupero della vetrina pubblica (${res.status})`, res.status);
    }
    return res.json();
  }

  /**
   * Recupera il dettaglio pubblico di una singola attività
   */
  async getPublicActivity(id: string): Promise<PublicActivity> {
    const res = await fetch(`${this.baseUrl}/api/activities/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new ApiError('Attività non trovata o non disponibile per la visualizzazione pubblica.', 404);
      }
      throw new ApiError(`Errore durante il recupero dell'attività (${res.status})`, res.status);
    }
    return res.json();
  }

  /**
   * Recupera i dati del socio autenticato e della sua attività collegata.
   * Usa esclusivamente la sessione reale tramite cookie HttpOnly.
   */
  async getMemberAreaMe(): Promise<MemberAreaResponse> {
    const res = await fetch(`${this.baseUrl}/api/members/me`, {
      credentials: 'include'
    });

    if (res.status === 401) {
      this.notifyUnauthorized();
      throw new ApiError('Sessione non valida o scaduta. Effettuare nuovamente il login.', 401);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorMsg = body.error || `Errore durante il caricamento dell'area socio (${res.status})`;
      throw new ApiError(errorMsg, res.status);
    }

    return res.json();
  }

  /**
   * Aggiorna la scheda attività da parte del socio titolare.
   * Richiesta mutativa protetta da CSRF (X-Requested-With) e sessione HTTP reale.
   */
  async updateActivity(
    activityId: string,
    data: UpdateActivityInput
  ): Promise<{ messaggio: string; attivita: any }> {
    const res = await fetch(`${this.baseUrl}/api/activities/${encodeURIComponent(activityId)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'ProLocalApp'
      },
      body: JSON.stringify(data)
    });

    if (res.status === 401) {
      this.notifyUnauthorized();
      throw new ApiError('Sessione non valida o scaduta. Effettuare nuovamente il login.', 401);
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = body.dettagli ? body.dettagli.join(', ') : body.error || 'Errore durante la modifica';
      throw new ApiError(errorMsg, res.status);
    }

    return body;
  }
}

export const apiClient = new ProLocalApiClient();
