import express from 'express';
import type { Request, Response, NextFunction } from 'express';
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
import type { IUserAccountRepository } from './repositories/UserAccountRepository.ts';
import { InMemoryUserAccountRepository } from './repositories/UserAccountRepository.ts';
import type { ISessionRepository } from './repositories/SessionRepository.ts';
import { InMemorySessionRepository } from './repositories/SessionRepository.ts';
import { ScryptPasswordHasher, type IPasswordHasher } from './auth/PasswordHasher.ts';
import { AuthService } from './services/AuthService.ts';
import { ShowcaseService } from './services/ShowcaseService.ts';
import { ActivityManagementService } from './services/ActivityManagementService.ts';
import { ActivityValidator } from './validation/activityValidator.ts';
import {
  createAuthMiddleware,
  setSessionCookie,
  clearSessionCookie
} from './auth/authMiddleware.ts';
import { parseCookie, SESSION_COOKIE_NAME } from './auth/cookieUtils.ts';
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  SessionInvalidError
} from './domain/authErrors.ts';

export interface AppRepositoriesOptions {
  memberRepo?: IMemberRepository;
  activityRepo?: IBusinessActivityRepository;
  auditRepo?: IAuditLogRepository;
  userAccountRepo?: IUserAccountRepository;
  sessionRepo?: ISessionRepository;
  passwordHasher?: IPasswordHasher;
  authService?: AuthService;
}

export function createProLocalApp(customRepositories?: AppRepositoriesOptions) {
  const app = express();

  // CORS configurato con supporto per credentials e protezione da wildcard aperte
  app.use(
    cors({
      origin: (origin, callback) => {
        // Consenti richieste senza origin (es. curl, test locali, app mobile) o qualsiasi origin in dev/test
        if (!origin || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Origine non autorizzata dalle policy CORS.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Requested-With']
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
  const userAccountRepo = customRepositories?.userAccountRepo || new InMemoryUserAccountRepository();
  const sessionRepo = customRepositories?.sessionRepo || new InMemorySessionRepository();
  const passwordHasher = customRepositories?.passwordHasher || new ScryptPasswordHasher();

  const authService =
    customRepositories?.authService ||
    new AuthService({
      userAccountRepo,
      sessionRepo,
      memberRepo,
      passwordHasher,
      auditLogRepo: auditRepo
    });

  const showcaseService = new ShowcaseService(activityRepo, memberRepo);
  const activityManagementService = new ActivityManagementService(activityRepo, auditRepo);

  // Registrazione del middleware di autenticazione globale
  app.use(
    createAuthMiddleware({
      authService
    })
  );

  // =========================================================================
  // 0. HEALTH CHECK
  // =========================================================================
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // =========================================================================
  // 1. AUTHENTICATION ENDPOINTS (FASE 3.4)
  // - POST /api/auth/login
  // - POST /api/auth/logout
  // - GET /api/auth/me
  // =========================================================================

  /**
   * POST /api/auth/login
   * Valida le credenziali, genera la sessione server-side, imposta il cookie HttpOnly 'prolocal_session'.
   * Nessun raw token o password nel body di risposta.
   */
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};

      // 1. Validazione rigorosa del body
      if (
        !email ||
        typeof email !== 'string' ||
        email.trim() === '' ||
        !password ||
        typeof password !== 'string'
      ) {
        return res.status(400).json({
          error: 'Richiesta non valida. I campi email e password sono obbligatori.'
        });
      }

      // Metadata di contesto per auditing e sicurezza
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      // 2. Chiamata ad AuthService (gestisce lockout, Scrypt verification, audit logging)
      try {
        const authResult = await authService.authenticate(email, password, {
          ipAddress: Array.isArray(clientIp) ? clientIp[0] : clientIp,
          userAgent
        });

        // 3. Impostazione del cookie HttpOnly con il raw token di sessione
        setSessionCookie(res, authResult.rawSessionToken);

        // 4. Risposta di successo: nessun raw token né password restituiti
        return res.status(200).json({
          authenticated: true,
          user: {
            id: authResult.userAccount.id,
            email: authResult.userAccount.email,
            actorType: authResult.userAccount.actorType,
            memberId: authResult.userAccount.memberId
          }
        });
      } catch (authErr: unknown) {
        if (authErr instanceof InvalidCredentialsError) {
          return res.status(401).json({ error: authErr.message });
        }
        if (authErr instanceof AccountLockedError) {
          return res.status(423).json({
            error: authErr.message,
            lockedUntil: authErr.lockedUntil
          });
        }
        if (authErr instanceof AccountInactiveError) {
          return res.status(403).json({ error: authErr.message });
        }
        throw authErr;
      }
    } catch (err: unknown) {
      return res.status(500).json({
        error: 'Errore interno del server durante la procedura di login.'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Restituisce i dettagli dell'attore autenticato reale (da cookie di sessione valido).
   * Restituisce 401 se la sessione è assente, scaduta o invalida (cancellando il cookie).
   */
  app.get('/api/auth/me', (req: Request, res: Response) => {
    // Richiede esclusivamente autenticazione reale (isRealAuth = true)
    if (!req.authContext || !req.authContext.isRealAuth || !req.authContext.authenticatedActor) {
      // Se era presente un cookie malformato o scaduto, clearSessionCookie è già stato invocato nel middleware
      clearSessionCookie(res);
      return res.status(401).json({
        error: 'Non autenticato: nessuna sessione attiva valida.'
      });
    }

    const actor = req.authContext.authenticatedActor;

    return res.status(200).json({
      authenticated: true,
      userId: actor.userId,
      actorType: actor.actorType,
      role: actor.role,
      memberId: actor.memberId,
      membershipStatus: actor.membershipStatus,
      member: actor.member
        ? {
            id: actor.member.id,
            codiceSocio: actor.member.codiceSocio,
            nomeCognome: actor.member.nomeCognome,
            emailDemo: actor.member.emailDemo,
            dataIscrizione: actor.member.dataIscrizione,
            statoAssociativo: actor.member.statoAssociativo,
            quotaSocialeInRegola: actor.member.quotaSocialeInRegola
          }
        : null
    });
  });

  /**
   * POST /api/auth/logout
   * Operazione idempotente: revoca la sessione nel repository, registra audit LOGOUT e cancella il cookie.
   */
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const rawSessionToken = parseCookie(req, SESSION_COOKIE_NAME);

      if (rawSessionToken) {
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        await authService.logout(rawSessionToken, {
          ipAddress: Array.isArray(clientIp) ? clientIp[0] : clientIp,
          userAgent
        });
      }

      // Cancella sempre il cookie per garantire idempotenza
      clearSessionCookie(res);

      return res.status(200).json({
        messaggio: 'Logout effettuato con successo.'
      });
    } catch (err: unknown) {
      clearSessionCookie(res);
      return res.status(200).json({
        messaggio: 'Logout effettuato.'
      });
    }
  });

  // =========================================================================
  // 2. GET /api/showcase (Vetrina pubblica)
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
  // 3. GET /api/members/me (Area Socio)
  // Richiede autenticazione reale tramite sessione HTTP (cookie prolocal_session).
  // Se non autenticato: 401.
  // =========================================================================
  app.get('/api/members/me', async (req: Request, res: Response) => {
    try {
      const auth = req.authContext;
      if (!auth) {
        return res.status(401).json({
          error: 'Non autenticato: effettuare il login per accedere all\'area socio.'
        });
      }

      // Se autenticato come Amministratore Tecnico, non ha un profilo socio
      if (auth.role === ProLocalRole.AMMINISTRATORE_TECNICO || !auth.memberId) {
        return res.status(403).json({
          error: 'Accesso negato: l\'amministratore tecnico non dispone di una scheda socio.'
        });
      }

      const memberId = auth.memberId;
      const member = auth.authenticatedActor?.member || (await memberRepo.findById(memberId));

      if (!member) {
        return res.status(404).json({
          error: `Socio con ID "${memberId}" non trovato nel sistema.`
        });
      }

      // Recupero dell'attività (o attività) associata al socio
      const activities = await activityRepo.findByMemberId(memberId);

      res.status(200).json({
        authMode: 'REAL_SESSION',
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
        error: 'Errore interno durante il caricamento del profilo socio.'
      });
    }
  });

  // =========================================================================
  // 4. PUT /api/activities/:id (Modifica attività del socio)
  // Regola di Dominio ed RBAC:
  // - Richiede autenticazione reale tramite sessione HTTP e protezione CSRF
  // - Solo il socio owner può modificare la propria attività
  // - L'amministratore tecnico non può mai modificare schede commerciali
  // - La modifica riavvia il workflow impostando lo stato a IN_ATTESA_APPROVAZIONE
  // =========================================================================
  app.put('/api/activities/:id', async (req: Request, res: Response) => {
    try {
      const activityId = String(req.params.id);

      const auth = req.authContext;
      if (!auth) {
        return res.status(401).json({
          error: 'Non autenticato: effettuare il login per modificare la scheda attività.'
        });
      }

      // Solo i soci registrati possono modificare schede attività; l'amministratore tecnico è escluso
      if (auth.role === ProLocalRole.AMMINISTRATORE_TECNICO || !auth.memberId) {
        return res.status(403).json({
          error:
            'Accesso negato: puoi modificare esclusivamente la tua attività personale. L\'amministratore tecnico e altri soggetti non hanno titolo per modificare schede dei soci.'
        });
      }

      const actorMemberId = auth.memberId;
      const actorRole = auth.role;

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

  // Middleware globale di gestione errori HTTP (evita information leakage e stack trace HTML)
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
      return res.status(400).json({ error: 'Payload JSON non valido o malformato.' });
    }
    const message = err instanceof Error ? err.message : '';
    if (message.includes('CORS')) {
      return res.status(403).json({ error: 'Origine non autorizzata dalle policy CORS.' });
    }
    return res.status(500).json({ error: 'Errore interno del server.' });
  });

  return app;
}
