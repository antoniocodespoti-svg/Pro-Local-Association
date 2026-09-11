import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import {
  MembershipStatus,
  PublicationStatus,
  ProLocalRole,
  ActivityCategory
} from './domain/models.ts';
import type { Member, BusinessActivity } from './domain/models.ts';
import type { IMemberRepository } from './repositories/MemberRepository.ts';
import { InMemoryMemberRepository } from './repositories/MemberRepository.ts';
import type { IBusinessActivityRepository } from './repositories/BusinessActivityRepository.ts';
import { InMemoryBusinessActivityRepository } from './repositories/BusinessActivityRepository.ts';
import type { IAuditLogRepository } from './repositories/AuditLogRepository.ts';
import { InMemoryAuditLogRepository } from './repositories/AuditLogRepository.ts';
import { ShowcaseService } from './services/ShowcaseService.ts';
import { ActivityManagementService } from './services/ActivityManagementService.ts';
import { ActivityValidator } from './validation/activityValidator.ts';

export function createProLocalApp(customRepositories?: {
  memberRepo?: IMemberRepository;
  activityRepo?: IBusinessActivityRepository;
  auditRepo?: IAuditLogRepository;
}) {
  const app = express();

  // Middleware per sviluppo locale (facilmente restringibile in produzione)
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Demo-Member-Id', 'X-Demo-Role']
    })
  );
  app.use(express.json());

  // Inizializzazione Repository in-memory con dati dimostrativi conformi al dominio
  const defaultMembers: Member[] = [
    {
      id: 'socio-01',
      codiceSocio: 'SOC-2024-001',
      nomeCognome: 'Mario Rossi',
      emailDemo: 'mario.rossi@demo-prolocal.it',
      dataIscrizione: '2024-01-15',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true,
      noteAmministrativeInterne: 'Socio fondatore in regola con il tesseramento'
    },
    {
      id: 'socio-02',
      codiceSocio: 'SOC-2024-002',
      nomeCognome: 'Elena Bianchi',
      emailDemo: 'elena.bianchi@demo-prolocal.it',
      dataIscrizione: '2024-02-10',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true,
      noteAmministrativeInterne: 'Socio artigiano in regola'
    },
    {
      id: 'socio-03',
      codiceSocio: 'SOC-2024-003',
      nomeCognome: 'Giuseppe Verdi',
      emailDemo: 'giuseppe.verdi@demo-prolocal.it',
      dataIscrizione: '2024-03-01',
      statoAssociativo: MembershipStatus.SOSPESO,
      quotaSocialeInRegola: false,
      noteAmministrativeInterne: 'Sospeso per mancato rinnovo quota'
    },
    {
      id: 'socio-04',
      codiceSocio: 'SOC-2024-004',
      nomeCognome: 'Carla Neri',
      emailDemo: 'carla.neri@demo-prolocal.it',
      dataIscrizione: '2024-03-15',
      statoAssociativo: MembershipStatus.ESCLUSO,
      quotaSocialeInRegola: false,
      noteAmministrativeInterne: 'Provvedimento disciplinare'
    }
  ];

  const defaultActivities: BusinessActivity[] = [
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
      statoPubblicazione: PublicationStatus.PUBBLICATA, // Nota: scheda pubblicata ma socio SOSPESO -> NON deve apparire
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
      statoPubblicazione: PublicationStatus.PUBBLICATA, // Socio ESCLUSO -> NON deve apparire
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
      statoPubblicazione: PublicationStatus.BOZZA, // In bozza -> NON deve apparire
      dataUltimoAggiornamento: '2024-05-20'
    }
  ];

  const memberRepo = customRepositories?.memberRepo || new InMemoryMemberRepository(defaultMembers);
  const activityRepo =
    customRepositories?.activityRepo || new InMemoryBusinessActivityRepository(defaultActivities);
  const auditRepo = customRepositories?.auditRepo || new InMemoryAuditLogRepository();

  const showcaseService = new ShowcaseService(activityRepo, memberRepo);
  const activityManagementService = new ActivityManagementService(activityRepo, auditRepo);

  // =========================================================================
  // 1. GET /api/showcase (Vetrina pubblica)
  // Regola di Dominio: solo PublicationStatus.PUBBLICATA AND MembershipStatus.ATTIVO
  // =========================================================================
  app.get('/api/showcase', async (_req: Request, res: Response) => {
    try {
      const publicActivities = await showcaseService.getPublicShowcase();
      res.status(200).json(publicActivities);
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Errore interno durante il recupero della vetrina pubblica.'
      });
    }
  });

  // =========================================================================
  // 2. GET /api/activities/:id (Dettaglio pubblico attività)
  // Nessun bypass: se l'attività non è pubblica, restituisce 404 per non rivelarne l'esistenza
  // =========================================================================
  app.get('/api/activities/:id', async (req: Request, res: Response) => {
    try {
      const activityId = String(req.params.id);
      const activity = await showcaseService.getPublicActivityById(activityId);

      if (!activity) {
        return res.status(404).json({
          error: 'Attività non trovata o non disponibile per la visualizzazione pubblica.'
        });
      }

      res.status(200).json(activity);
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Errore interno durante il recupero dell\'attività.'
      });
    }
  });

  // =========================================================================
  // 3. GET /api/members/me (Area Socio Demo)
  // Utilizza autenticazione demo esplicita tramite header 'X-Demo-Member-Id'.
  // =========================================================================
  app.get('/api/members/me', async (req: Request, res: Response) => {
    try {
      // Header DEMO esplicitato (NON è autenticazione di produzione)
      const demoMemberId = (req.header('X-Demo-Member-Id') || 'socio-01').trim();
      const member = await memberRepo.findById(demoMemberId);

      if (!member) {
        return res.status(404).json({
          error: `Socio demo con ID "${demoMemberId}" non trovato nel sistema demo.`
        });
      }

      // Recupero dell'attività (o attività) associata al socio
      const activities = await activityRepo.findByMemberId(demoMemberId);

      res.status(200).json({
        authMode: 'DEMO_FASE_2_2',
        notaAutenticazione:
          'ATTENZIONE: Meccanismo DEMO di collaudo per la Fase 2.2. L\'autenticazione reale basata su sessioni/credenziali protette sarà introdotta nella fase successiva.',
        socio: {
          id: member.id,
          codiceSocio: member.codiceSocio,
          nomeCognome: member.nomeCognome,
          emailDemo: member.emailDemo,
          dataIscrizione: member.dataIscrizione,
          statoAssociativo: member.statoAssociativo,
          quotaSocialeInRegola: member.quotaSocialeInRegola
        },
        attivita: activities.length > 0 ? activities[0] : null,
        tutteAttivita: activities
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Errore interno durante il caricamento del profilo socio demo.'
      });
    }
  });

  // =========================================================================
  // 4. PUT /api/activities/:id (Modifica attività del socio)
  // Regola di Dominio ed RBAC:
  // - Solo il socio owner può modificare la propria attività
  // - L'amministratore tecnico non può mai modificare schede commerciali
  // - La modifica riavvia il workflow impostando lo stato a IN_ATTESA_APPROVAZIONE
  // =========================================================================
  app.put('/api/activities/:id', async (req: Request, res: Response) => {
    try {
      const activityId = String(req.params.id);

      // Determinazione dell'attore dal contesto Demo
      const actorMemberId = (req.header('X-Demo-Member-Id') || 'socio-01').trim();
      const rawRole = (req.header('X-Demo-Role') || ProLocalRole.SOCIO).trim();
      const actorRole =
        rawRole === ProLocalRole.AMMINISTRATORE_TECNICO
          ? ProLocalRole.AMMINISTRATORE_TECNICO
          : ProLocalRole.SOCIO;

      // 1. Validazione input lato server (non ci fidiamo del frontend)
      const validation = ActivityValidator.validateUpdate(req.body);
      if (!validation.isValid || !validation.sanitizedData) {
        return res.status(400).json({
          error: 'Dati attività non validi.',
          dettagli: validation.errors
        });
      }

      // 2. Esecuzione tramite ActivityManagementService (verifica autorizzazione e ownership)
      try {
        const updatedActivity = await activityManagementService.updateActivity(
          actorMemberId,
          actorRole,
          activityId,
          validation.sanitizedData
        );

        res.status(200).json({
          messaggio:
            'Scheda attività aggiornata con successo. Per le regole associative, la scheda è stata posta in attesa di approvazione.',
          attivita: updatedActivity
        });
      } catch (serviceErr: unknown) {
        const message = serviceErr instanceof Error ? serviceErr.message : 'Accesso negato';
        if (message.includes('non trovata')) {
          return res.status(404).json({ error: 'Attività non trovata.' });
        }
        if (message.includes('Accesso negato')) {
          return res.status(403).json({
            error:
              'Accesso negato: puoi modificare esclusivamente la tua attività personale. L\'amministratore tecnico e altri soggetti non hanno titolo per modificare schede dei soci.'
          });
        }
        return res.status(400).json({ error: message });
      }
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Errore interno durante l\'aggiornamento dell\'attività.'
      });
    }
  });

  // Gestione rotte non trovate
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint REST non trovato.' });
  });

  return app;
}
