/**
 * Contratti TypeScript per la UI Web di Pro-Local.
 * Ricevuti via REST API dal Backend.
 * 
 * La UI è puramente un layer di presentazione:
 * non contiene logiche di autorizzazione o calcoli di visibilità (gestiti dal backend).
 */

export interface PublicActivity {
  id: string;
  nomeAttivita: string;
  categoria: string;
  descrizioneBreve: string;
  descrizioneCompleta: string;
  serviziOfferti: string[];
  localita: string;
  indirizzoPubblico?: string;
  telefonoPubblico?: string;
  emailPubblica?: string;
  sitoWeb?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  orariApertura?: string;
  dataUltimoAggiornamento: string;
  trasparenza: {
    autonomiaAttivita: boolean;
    notaLegale: string;
  };
}

export interface ActivityFilterState {
  categoriaSelezionata: string | null;
  ricercaTestuale: string;
}
