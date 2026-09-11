import type { Queryable } from '../migrator.ts';
import {
  MembershipStatus,
  PublicationStatus,
  ActivityCategory
} from '../../domain/models.ts';
import type { Member, BusinessActivity } from '../../domain/models.ts';

/**
 * ============================================================================
 * DATI DIMOSTRATIVI DI SVILUPPO E COLLAUDO (DEMO / DEVELOPMENT DATA ONLY)
 * ============================================================================
 * ATTENZIONE: Questi dati hanno finalità puramente illustrative e di test.
 * NON rappresentano soci reali, né contengono recapiti o dati personali effettivi.
 * I dati di produzione dovranno essere acquisiti esclusivamente a seguito delle
 * formali procedure deliberative previste dallo Statuto associativo Pro-Local.
 * ============================================================================
 */

export const DEMO_MEMBERS: Member[] = [
  {
    id: 'socio-01',
    codiceSocio: 'SOC-2024-001',
    nomeCognome: 'Mario Rossi',
    emailDemo: 'mario.rossi@demo-prolocal.it',
    dataIscrizione: '2024-01-15',
    statoAssociativo: MembershipStatus.ATTIVO,
    quotaSocialeInRegola: true,
    noteAmministrativeInterne: 'Socio fondatore in regola con il tesseramento [Dati dimostrativi]'
  },
  {
    id: 'socio-02',
    codiceSocio: 'SOC-2024-002',
    nomeCognome: 'Elena Bianchi',
    emailDemo: 'elena.bianchi@demo-prolocal.it',
    dataIscrizione: '2024-02-10',
    statoAssociativo: MembershipStatus.ATTIVO,
    quotaSocialeInRegola: true,
    noteAmministrativeInterne: 'Socio artigiano in regola [Dati dimostrativi]'
  },
  {
    id: 'socio-03',
    codiceSocio: 'SOC-2024-003',
    nomeCognome: 'Giuseppe Verdi',
    emailDemo: 'giuseppe.verdi@demo-prolocal.it',
    dataIscrizione: '2024-03-01',
    statoAssociativo: MembershipStatus.SOSPESO,
    quotaSocialeInRegola: false,
    noteAmministrativeInterne: 'Sospeso per mancato rinnovo quota [Dati dimostrativi]'
  },
  {
    id: 'socio-04',
    codiceSocio: 'SOC-2024-004',
    nomeCognome: 'Carla Neri',
    emailDemo: 'carla.neri@demo-prolocal.it',
    dataIscrizione: '2024-03-15',
    statoAssociativo: MembershipStatus.ESCLUSO,
    quotaSocialeInRegola: false,
    noteAmministrativeInterne: 'Provvedimento disciplinare [Dati dimostrativi - procedura finale DA DEFINIRE]'
  },
  {
    id: 'socio-05',
    codiceSocio: 'SOC-2024-005',
    nomeCognome: 'Roberto Gialli',
    emailDemo: 'roberto.gialli@demo-prolocal.it',
    dataIscrizione: '2024-04-01',
    statoAssociativo: MembershipStatus.RECEDUTO,
    quotaSocialeInRegola: false,
    noteAmministrativeInterne: 'Dimissioni volontarie formalizzate [Dati dimostrativi]'
  }
];

export const DEMO_ACTIVITIES: BusinessActivity[] = [
  {
    id: 'act-01',
    memberId: 'socio-01',
    nomeAttivita: 'Bottega di Restauro Storico',
    categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
    descrizioneBreve: 'Restauro conservativo di mobili antichi, doratura e falegnameria tradizionale',
    descrizioneCompleta:
      'Laboratorio artigianale dedicato al recupero di arredi storici, lucidatura a spirito e gommalacca, restauro di manufatti lignei e consulenza per la conservazione preventiva.',
    serviziOfferti: ['Restauro ligneo', 'Lucidatura a tampone', 'Consolidamento', 'Trattamento tarlo'],
    localita: 'Borgo Storico',
    indirizzoPubblico: 'Via degli Artigiani 12',
    telefonoPubblico: '0984 112233',
    emailPubblica: 'restauro.antico@artigiani-locali.demo',
    sitoWeb: 'https://restauro-storico.demo',
    socialInstagram: '@restaurostorico',
    orariApertura: 'Lun-Ven: 08:30 - 18:00, Sab: su appuntamento',
    statoPubblicazione: PublicationStatus.PUBBLICATA,
    dataUltimoAggiornamento: '2024-05-15'
  },
  {
    id: 'act-02',
    memberId: 'socio-02',
    nomeAttivita: 'Studio Grafico & Comunicazione Visiva',
    categoria: ActivityCategory.INFORMATICA_DIGITALE,
    descrizioneBreve: 'Progettazione identità visive, grafica editoriale e web design per il territorio',
    descrizioneCompleta:
      'Studio indipendente di progettazione grafica. Creiamo marchi, cataloghi di settore, packaging sostenibile e piattaforme web orientate alla promozione del territorio locale.',
    serviziOfferti: ['Brand identity', 'Web design', 'Grafica editoriale', 'Materiali promozionali'],
    localita: 'Centro Servizi',
    indirizzoPubblico: 'Piazza della Libertà 4',
    telefonoPubblico: '0984 445566',
    emailPubblica: 'elena@studiografico.demo',
    sitoWeb: 'https://studiografico-bianchi.demo',
    orariApertura: 'Lun-Ven: 09:00 - 13:00 / 14:30 - 18:30',
    statoPubblicazione: PublicationStatus.PUBBLICATA,
    dataUltimoAggiornamento: '2024-05-18'
  },
  {
    id: 'act-03',
    memberId: 'socio-03',
    nomeAttivita: 'Azienda Agricola Enogastronomica (Socio Sospeso)',
    categoria: ActivityCategory.ENOGASTRONOMIA_LOCALE,
    descrizioneBreve: 'Produzione di olio extravergine biologico e confetture tipiche',
    descrizioneCompleta: 'Azienda agricola a conduzione familiare che coltiva cultivar locali.',
    serviziOfferti: ['Vendita diretta', 'Olio EVO', 'Confetture artigianali'],
    localita: 'Colline del Sole',
    statoPubblicazione: PublicationStatus.PUBBLICATA, // Socio SOSPESO -> NON deve apparire in vetrina
    dataUltimoAggiornamento: '2024-04-10'
  },
  {
    id: 'act-04',
    memberId: 'socio-04',
    nomeAttivita: 'Laboratorio Ceramica (Socio Escluso)',
    categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
    descrizioneBreve: 'Ceramiche artistiche lavorate al tornio',
    descrizioneCompleta: 'Creazione di stoviglie e vasi in ceramica smaltata.',
    serviziOfferti: ['Corsi al tornio', 'Manufatti artistici'],
    localita: 'Borgo Basso',
    statoPubblicazione: PublicationStatus.PUBBLICATA, // Socio ESCLUSO -> NON deve apparire in vetrina
    dataUltimoAggiornamento: '2024-04-12'
  },
  {
    id: 'act-05',
    memberId: 'socio-01',
    nomeAttivita: 'Bozza Seconda Attività (Non Pubblicata)',
    categoria: ActivityCategory.CONSULENZA_PROFESSIONALE,
    descrizioneBreve: 'Consulenze peritali sui beni di pregio',
    descrizioneCompleta: 'Stime periziali per assicurazioni e restauri.',
    serviziOfferti: ['Perizie storiche'],
    localita: 'Borgo Storico',
    statoPubblicazione: PublicationStatus.BOZZA, // In bozza -> NON deve apparire in vetrina
    dataUltimoAggiornamento: '2024-05-20'
  },
  {
    id: 'act-06',
    memberId: 'socio-01',
    nomeAttivita: 'Attività in Attesa Approvazione',
    categoria: ActivityCategory.SERVIZI_CASA,
    descrizioneBreve: 'Manutenzioni specialistiche per il patrimonio storico',
    descrizioneCompleta: 'Interventi conservativi e manutenzione specialistica.',
    serviziOfferti: ['Manutenzione programmata'],
    localita: 'Borgo Storico',
    statoPubblicazione: PublicationStatus.IN_ATTESA_APPROVAZIONE, // In attesa -> NON deve apparire in vetrina
    dataUltimoAggiornamento: '2024-05-21'
  }
];

export async function seedDemoData(client: Queryable): Promise<{ membersCount: number; activitiesCount: number }> {
  let membersCount = 0;
  let activitiesCount = 0;

  for (const member of DEMO_MEMBERS) {
    const check = await client.query('SELECT id FROM members WHERE id = $1', [member.id]);
    if (check.rows.length === 0) {
      await client.query(
        `INSERT INTO members (
          id, codice_socio, nome_cognome, email_demo, data_iscrizione,
          membership_status, quota_sociale_in_regola, note_amministrative_interne
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          member.id,
          member.codiceSocio,
          member.nomeCognome,
          member.emailDemo,
          member.dataIscrizione,
          member.statoAssociativo,
          member.quotaSocialeInRegola,
          member.noteAmministrativeInterne || null
        ]
      );
      membersCount++;
    }
  }

  for (const act of DEMO_ACTIVITIES) {
    const check = await client.query('SELECT id FROM business_activities WHERE id = $1', [act.id]);
    if (check.rows.length === 0) {
      await client.query(
        `INSERT INTO business_activities (
          id, member_id, nome_attivita, categoria, descrizione_breve,
          descrizione_completa, servizi_offerti, localita, indirizzo_pubblico,
          telefono_pubblico, email_pubblica, sito_web, social_instagram,
          social_linkedin, orari_apertura, publication_status,
          data_ultimo_aggiornamento, note_revisione_admin
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);`,
        [
          act.id,
          act.memberId,
          act.nomeAttivita,
          act.categoria,
          act.descrizioneBreve,
          act.descrizioneCompleta,
          JSON.stringify(act.serviziOfferti),
          act.localita,
          act.indirizzoPubblico || null,
          act.telefonoPubblico || null,
          act.emailPubblica || null,
          act.sitoWeb || null,
          act.socialInstagram || null,
          act.socialLinkedin || null,
          act.orariApertura || null,
          act.statoPubblicazione,
          act.dataUltimoAggiornamento,
          act.noteRevisioneAdmin || null
        ]
      );
      activitiesCount++;
    }
  }

  return { membersCount, activitiesCount };
}
