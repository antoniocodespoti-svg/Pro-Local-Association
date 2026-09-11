import type { PublicActivity, MemberAreaResponse, UpdateActivityInput } from '../types/domain.ts';

export class ProLocalApiClient {
  private baseUrl: string;
  private demoMemberId: string = 'socio-01';

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

  public setDemoMemberId(memberId: string) {
    this.demoMemberId = memberId;
  }

  public getDemoMemberId(): string {
    return this.demoMemberId;
  }

  /**
   * Recupera le attività pubbliche per la vetrina
   * Solo schede PUBBLICATE di soci con stato ATTIVO
   */
  async getPublicShowcase(): Promise<PublicActivity[]> {
    const res = await fetch(`${this.baseUrl}/api/showcase`);
    if (!res.ok) {
      throw new Error(`Errore durante il recupero della vetrina pubblica (${res.status})`);
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
        throw new Error('Attività non trovata o non disponibile per la visualizzazione pubblica.');
      }
      throw new Error(`Errore durante il recupero dell'attività (${res.status})`);
    }
    return res.json();
  }

  /**
   * Recupera i dati del socio demo e della sua attività collegata
   */
  async getMemberAreaMe(): Promise<MemberAreaResponse> {
    const res = await fetch(`${this.baseUrl}/api/members/me`, {
      headers: {
        'X-Demo-Member-Id': this.demoMemberId
      }
    });
    if (!res.ok) {
      throw new Error(`Errore durante il caricamento dell'area socio (${res.status})`);
    }
    return res.json();
  }

  /**
   * Aggiorna la scheda attività da parte del socio titolare
   * La modifica riavvia il workflow impostando lo stato su IN_ATTESA_APPROVAZIONE
   */
  async updateActivity(
    activityId: string,
    data: UpdateActivityInput
  ): Promise<{ messaggio: string; attivita: any }> {
    const res = await fetch(`${this.baseUrl}/api/activities/${encodeURIComponent(activityId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': this.demoMemberId,
        'X-Demo-Role': 'SOCIO'
      },
      body: JSON.stringify(data)
    });

    const body = await res.json();
    if (!res.ok) {
      const errorMsg = body.dettagli ? body.dettagli.join(', ') : body.error || 'Errore durante la modifica';
      throw new Error(errorMsg);
    }

    return body;
  }
}

export const apiClient = new ProLocalApiClient();
