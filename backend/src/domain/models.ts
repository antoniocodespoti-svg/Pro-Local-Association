/**
 * Modelli di Dominio Indipendenti per la Piattaforma Pro-Local.
 * Validi sia per il Backend che condivisi concettualmente con l'applicazione client.
 */

/**
 * Stato associativo del socio dell'associazione Pro-Local.
 * Comprende tutti gli stati previsti dal dominio:
 * IN_ATTESA, ATTIVO, SOSPESO, RECEDUTO, ESCLUSO.
 * 
 * Regola fondamentale: solo ATTIVO consente la visibilità dell'attività nella vetrina pubblica.
 * La procedura formale, i quorum e le maggioranze per l'ESCLUSIONE rimangono rigorosamente [DA DEFINIRE].
 */
export const MembershipStatus = {
  IN_ATTESA: 'IN_ATTESA',
  ATTIVO: 'ATTIVO',
  SOSPESO: 'SOSPESO',
  RECEDUTO: 'RECEDUTO',
  ESCLUSO: 'ESCLUSO'
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

/**
 * Categoria tematica dell'attività economica/artigianale/professionale del socio.
 */
export const ActivityCategory = {
  ARTIGIANATO_RESTAURO: 'artigianato',
  CONSULENZA_PROFESSIONALE: 'consulenza',
  ENOGASTRONOMIA_LOCALE: 'enogastronomia',
  BENESSERE_PERSONA: 'benessere',
  INFORMATICA_DIGITALE: 'digitale',
  CULTURA_FORMAZIONE: 'cultura',
  SERVIZI_CASA: 'servizi_casa'
} as const;
export type ActivityCategory = (typeof ActivityCategory)[keyof typeof ActivityCategory];

/**
 * Ciclo di vita redazionale della scheda attività.
 * L'approvazione è un processo obbligatorio [DEFINITO];
 * L'organo specifico con competenza finale di approvazione è [DA DEFINIRE].
 */
export const PublicationStatus = {
  BOZZA: 'BOZZA',
  IN_ATTESA_APPROVAZIONE: 'IN_ATTESA_APPROVAZIONE',
  PUBBLICATA: 'PUBBLICATA',
  SOSPESA: 'SOSPESA',
  RIFIUTATA: 'RIFIUTATA'
} as const;
export type PublicationStatus = (typeof PublicationStatus)[keyof typeof PublicationStatus];

/**
 * Ruoli di governance e operativi del sistema Pro-Local.
 * Distinzione netta tra organi statutari sovrani/collegiali e ruoli tecnici di ausilio.
 */
export const ProLocalRole = {
  SOCIO: 'SOCIO',
  PRESIDENTE: 'PRESIDENTE',
  CONSIGLIO_DIRETTIVO: 'CONSIGLIO_DIRETTIVO',
  ASSEMBLEA: 'ASSEMBLEA',
  AMMINISTRATORE_TECNICO: 'AMMINISTRATORE_TECNICO'
} as const;
export type ProLocalRole = (typeof ProLocalRole)[keyof typeof ProLocalRole];

/**
 * Operazioni di sistema tracciate per autorizzazione RBAC.
 */
export const SystemAction = {
  // Operazioni tecniche
  GESTIONE_CONFIGURAZIONE_TECNICA: 'GESTIONE_CONFIGURAZIONE_TECNICA',
  DIAGNOSTICA_SISTEMA: 'DIAGNOSTICA_SISTEMA',
  MANUTENZIONE_INFRASTRUTTURA: 'MANUTENZIONE_INFRASTRUTTURA',
  CONSULTAZIONE_LOG_TECNICI: 'CONSULTAZIONE_LOG_TECNICI',

  // Operazioni associative (strettamente precluse all'Amministratore Tecnico)
  AMMISSIONE_SOCIO: 'AMMISSIONE_SOCIO',
  SOSPENSIONE_SOCIO: 'SOSPENSIONE_SOCIO',
  ESCLUSIONE_SOCIO: 'ESCLUSIONE_SOCIO',
  MODIFICA_STATUS_ASSOCIATIVO: 'MODIFICA_STATUS_ASSOCIATIVO',
  ELEZIONE_CONSIGLIERE: 'ELEZIONE_CONSIGLIERE',
  REVOCA_CONSIGLIERE: 'REVOCA_CONSIGLIERE',
  MODIFICA_DECISIONI_ASSOCIATIVE: 'MODIFICA_DECISIONI_ASSOCIATIVE',
  MODIFICA_STATUTO_REGOLE: 'MODIFICA_STATUTO_REGOLE',
  ATTRIBUZIONE_COMPETENZA_ASSOCIATIVA: 'ATTRIBUZIONE_COMPETENZA_ASSOCIATIVA',
  FORZATURA_PUBBLICAZIONE_VETRINA: 'FORZATURA_PUBBLICAZIONE_VETRINA',

  // Operazioni su attività
  MODIFICA_ATTIVITA: 'MODIFICA_ATTIVITA',
  RICHIESTA_PUBBLICAZIONE_ATTIVITA: 'RICHIESTA_PUBBLICAZIONE_ATTIVITA'
} as const;
export type SystemAction = (typeof SystemAction)[keyof typeof SystemAction];

/**
 * Entità Socio (Member) dell'associazione.
 * Dati privacy-safe dimostrativi, non personali reali.
 */
export interface Member {
  id: string;
  codiceSocio: string;
  nomeCognome: string;
  emailDemo: string;
  dataIscrizione: string;
  statoAssociativo: MembershipStatus;
  quotaSocialeInRegola: boolean;
  noteAmministrativeInterne?: string;
}

/**
 * Entità Scheda Attività Professionale o Economica del Socio.
 * Completamente disaccoppiata dall'associazione: l'associazione non certifica né garantisce l'attività.
 */
export interface BusinessActivity {
  id: string;
  memberId: string; // Foreign key verso Member (1 -> N)
  nomeAttivita: string;
  categoria: ActivityCategory;
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
  statoPubblicazione: PublicationStatus;
  dataUltimoAggiornamento: string;
  noteRevisioneAdmin?: string;
}
