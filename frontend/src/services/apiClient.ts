import type { PublicActivity } from '../types/domain.js';

/**
 * Client HTTP per interagire con le REST API del Backend Pro-Local.
 */
export class ProLocalApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Recupera l'elenco delle attività ammesse alla vetrina pubblica.
   * Il backend garantisce che solo le schede approvate di soci ATTIVI vengano restituite.
   */
  async getPublicShowcase(): Promise<PublicActivity[]> {
    const response = await fetch(`${this.baseUrl}/showcase`);
    if (!response.ok) {
      throw new Error(`Errore caricamento vetrina: HTTP ${response.status}`);
    }
    return await response.json();
  }
}

export const apiClient = new ProLocalApiClient();
