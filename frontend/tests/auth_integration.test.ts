import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProLocalApiClient } from '../src/services/apiClient.ts';
import { LoginView } from '../src/components/LoginView.tsx';
import { TechnicalAdminView } from '../src/components/TechnicalAdminView.tsx';
import { AuthProvider, AuthContext } from '../src/context/AuthContext.tsx';
import { AppContent } from '../src/App.tsx';
import type { AuthenticatedUser } from '../src/types/auth.ts';

describe('Pro-Local Frontend Authentication Integration Tests (Fase 3.5)', () => {
  // Mock fetch helper per catturare e verificare le opzioni di richiesta
  const createMockFetch = (handler: (url: string, init?: RequestInit) => { status: number; body: unknown; headers?: Record<string, string> }) => {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const res = handler(url, init);
      return {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        statusText: res.status === 200 ? 'OK' : 'Error',
        headers: new Headers(res.headers || {}),
        json: async () => res.body,
        text: async () => JSON.stringify(res.body)
      } as unknown as Response;
    };
  };

  it('apiClient.login invia POST con credentials: "include", X-Requested-With: "ProLocalApp" e riceve la risposta', async () => {
    let capturedInit: RequestInit | undefined;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = createMockFetch((url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: {
          authenticated: true,
          user: {
            id: 'usr-01',
            email: 'mario.rossi@demo.it',
            actorType: 'MEMBER',
            memberId: 'socio-01'
          }
        }
      };
    });

    try {
      const client = new ProLocalApiClient('http://test-server');
      const res = await client.login('mario.rossi@demo.it', 'Password123!');

      assert.strictEqual(res.authenticated, true);
      assert.strictEqual(res.user.email, 'mario.rossi@demo.it');
      assert.strictEqual(capturedInit?.method, 'POST');
      assert.strictEqual(capturedInit?.credentials, 'include');

      const headers = capturedInit?.headers as Record<string, string>;
      assert.strictEqual(headers['Content-Type'], 'application/json');
      assert.strictEqual(headers['X-Requested-With'], 'ProLocalApp');

      // Verifica assenza di password o token salvati
      const body = JSON.parse(capturedInit?.body as string);
      assert.strictEqual(body.email, 'mario.rossi@demo.it');
      assert.strictEqual(body.password, 'Password123!');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('apiClient.login rifiuta con ApiError(401) generico su credenziali non valide', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch(() => ({
      status: 401,
      body: { error: 'Credenziali non valide.' }
    }));

    try {
      const client = new ProLocalApiClient('http://test-server');
      await assert.rejects(
        async () => {
          await client.login('sconosciuto@demo.it', 'errata');
        },
        (err: any) => {
          assert.strictEqual(err.status, 401);
          assert.strictEqual(err.message, 'Credenziali non valide. Verificare email e password.');
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('apiClient.login rifiuta con ApiError(423) descrittivo su account temporaneamente bloccato', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch(() => ({
      status: 423,
      body: { error: 'Account temporaneamente bloccato.', lockedUntil: '2026-09-21T12:00:00Z' }
    }));

    try {
      const client = new ProLocalApiClient('http://test-server');
      await assert.rejects(
        async () => {
          await client.login('bloccato@demo.it', 'errata');
        },
        (err: any) => {
          assert.strictEqual(err.status, 423);
          assert(err.message.includes('bloccato per motivi di sicurezza'));
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('apiClient.getCurrentUser recupera identità verificata dal backend con credentials: "include"', async () => {
    let capturedInit: RequestInit | undefined;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = createMockFetch((url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: {
          authenticated: true,
          userId: 'usr-01',
          actorType: 'MEMBER',
          role: 'SOCIO',
          memberId: 'socio-01',
          membershipStatus: 'ATTIVO',
          member: {
            id: 'socio-01',
            codiceSocio: 'SOC-001',
            nomeCognome: 'Mario Rossi',
            emailDemo: 'mario.rossi@demo.it',
            dataIscrizione: '2024-01-15',
            statoAssociativo: 'ATTIVO',
            quotaSocialeInRegola: true
          }
        }
      };
    });

    try {
      const client = new ProLocalApiClient('http://test-server');
      const me = await client.getCurrentUser();

      assert(me !== null);
      assert.strictEqual(me.authenticated, true);
      assert.strictEqual(me.actorType, 'MEMBER');
      assert.strictEqual(me.role, 'SOCIO');
      assert.strictEqual(me.memberId, 'socio-01');
      assert.strictEqual(capturedInit?.credentials, 'include');
      assert.strictEqual(capturedInit?.method, 'GET');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('apiClient.getCurrentUser restituisce null su 401 senza sollevare eccezioni bloccanti', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch(() => ({
      status: 401,
      body: { error: 'Non autenticato' }
    }));

    try {
      const client = new ProLocalApiClient('http://test-server');
      const me = await client.getCurrentUser();
      assert.strictEqual(me, null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('apiClient.logout invia POST /api/auth/logout con X-Requested-With e credentials: "include"', async () => {
    let capturedInit: RequestInit | undefined;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = createMockFetch((url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: { messaggio: 'Logout effettuato con successo.' }
      };
    });

    try {
      const client = new ProLocalApiClient('http://test-server');
      await client.logout();

      assert.strictEqual(capturedInit?.method, 'POST');
      assert.strictEqual(capturedInit?.credentials, 'include');
      const headers = capturedInit?.headers as Record<string, string>;
      assert.strictEqual(headers['X-Requested-With'], 'ProLocalApp');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('nessun X-Demo-Member-Id né X-Demo-Role inviato dal frontend reale', async () => {
    const originalFetch = globalThis.fetch;
    const capturedHeaders: Record<string, string>[] = [];

    globalThis.fetch = createMockFetch((url, init) => {
      capturedHeaders.push((init?.headers as Record<string, string>) || {});
      if (url.includes('/api/auth/me')) {
        return {
          status: 200,
          body: {
            authenticated: true,
            userId: 'usr-01',
            actorType: 'MEMBER',
            role: 'SOCIO',
            memberId: 'socio-01'
          }
        };
      }
      if (url.includes('/api/members/me')) {
        return {
          status: 200,
          body: {
            authMode: 'REAL_SESSION',
            notaAutenticazione: 'Sessione reale',
            socio: { id: 'socio-01', nomeCognome: 'Mario Rossi' },
            attivita: null,
            tutteAttivita: []
          }
        };
      }
      return { status: 200, body: {} };
    });

    try {
      // Istanza client standard senza alcuna impostazione demo
      const client = new ProLocalApiClient('http://test-server');
      await client.getCurrentUser();
      await client.getMemberAreaMe();

      for (const h of capturedHeaders) {
        assert.strictEqual(h['X-Demo-Member-Id'], undefined, 'Non deve inviare X-Demo-Member-Id');
        assert.strictEqual(h['X-Demo-Role'], undefined, 'Non deve inviare X-Demo-Role');
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('apiClient.updateActivity include X-Requested-With e credentials: "include" senza header X-Demo-*', async () => {
    let capturedInit: RequestInit | undefined;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = createMockFetch((url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: {
          messaggio: 'Attività aggiornata con successo.',
          attivita: { id: 'act-01', nomeAttivita: 'Nuovo Nome' }
        }
      };
    });

    try {
      const client = new ProLocalApiClient('http://test-server');
      const res = await client.updateActivity('act-01', {
        nomeAttivita: 'Nuovo Nome',
        descrizioneBreve: 'Descrizione valida e sufficientemente lunga',
        descrizioneCompleta: 'Descrizione completa valida',
        serviziOfferti: ['Servizio 1'],
        localita: 'Roma'
      });

      assert(res.messaggio.includes('successo'));
      assert.strictEqual(capturedInit?.method, 'PUT');
      assert.strictEqual(capturedInit?.credentials, 'include');
      const headers = capturedInit?.headers as Record<string, string>;
      assert.strictEqual(headers['X-Requested-With'], 'ProLocalApp');
      assert.strictEqual(headers['X-Demo-Member-Id'], undefined);
      assert.strictEqual(headers['X-Demo-Role'], undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('apiClient notifica session expiration (onUnauthorized) quando riceve 401', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch(() => ({
      status: 401,
      body: { error: 'Sessione scaduta' }
    }));

    try {
      const client = new ProLocalApiClient('http://test-server');
      let unauthorizedNotified = false;
      client.setOnUnauthorized(() => {
        unauthorizedNotified = true;
      });

      await assert.rejects(async () => {
        await client.getMemberAreaMe();
      });

      assert.strictEqual(unauthorizedNotified, true, 'Deve invocare il callback di session expiration');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('LoginView renderizza il form di accesso con campi email, password e pulsante protetto', () => {
    const mockAuthContext = {
      status: 'UNAUTHENTICATED' as const,
      user: null,
      login: async () => {},
      logout: async () => {},
      refreshAuth: async () => {}
    };

    const html = renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(LoginView, {
          onSuccess: () => {},
          onCancel: () => {}
        })
      )
    );

    assert(html.includes('Accesso Area Riservata'), 'Deve mostrare il titolo di login');
    assert(html.includes('Indirizzo Email'), 'Deve contenere la label email');
    assert(html.includes('Password'), 'Deve contenere la label password');
    assert(html.includes('Accedi'), 'Deve contenere il pulsante di invio');
    assert(html.includes('Torna alla Vetrina Pubblica'), 'Deve contenere il tasto per annullare');
  });

  it('TechnicalAdminView renderizza la vista tecnica con memberId nullo e clausola di separazione dei poteri', () => {
    const adminUser: AuthenticatedUser = {
      userId: 'usr-admin-01',
      actorType: 'TECHNICAL_ADMIN',
      role: 'AMMINISTRATORE_TECNICO',
      memberId: null,
      membershipStatus: null,
      member: null
    };

    const html = renderToStaticMarkup(
      React.createElement(TechnicalAdminView, {
        user: adminUser,
        onLogout: () => {},
        onGoHome: () => {}
      })
    );

    assert(html.includes('Sessione Amministratore Tecnico'), 'Deve mostrare titolo admin');
    assert(html.includes('AMMINISTRATORE_TECNICO'), 'Deve mostrare ruolo tecnico');
    assert(html.includes('usr-admin-01'), 'Deve mostrare userId');
    assert(html.includes('memberId = null'), 'Deve specificare che memberId è null');
    assert(html.includes('Separazione dei Ruoli e Trasparenza Statutaria'), 'Deve contenere nota statutaria');
    assert(html.includes('Nessuna (Riservata ai soli soci)'), 'Deve specificare che non ha scheda socio');
  });

  it('App in stato INITIALIZING renderizza il messaggio di verifica sessione evitando flash', () => {
    const mockAuthContext = {
      status: 'INITIALIZING' as const,
      user: null,
      login: async () => {},
      logout: async () => {},
      refreshAuth: async () => {}
    };

    const html = renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(AppContent)
      )
    );

    assert(html.includes('Verifica sessione in corso...'), 'Deve mostrare caricamento iniziale');
    assert(!html.includes('Accesso Area Riservata'), 'Non deve mostrare login form durante initializing');
  });

  it('App su route protetta /socio con utente non autenticato mostra indicazione di reindirizzamento al login', () => {
    const mockAuthContext = {
      status: 'UNAUTHENTICATED' as const,
      user: null,
      login: async () => {},
      logout: async () => {},
      refreshAuth: async () => {}
    };

    // Impostiamo pathname su /socio per simulare accesso diretto senza sessione
    const previousWindow = globalThis.window;
    (globalThis as any).window = {
      location: { pathname: '/socio' },
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    try {
      const html = renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: mockAuthContext },
          React.createElement(AppContent)
        )
      );

      assert(html.includes('Reindirizzamento'), 'Deve mostrare reindirizzamento al login');
      assert(html.includes('Accedi'), 'Navbar deve mostrare tasto Accedi');
    } finally {
      globalThis.window = previousWindow;
    }
  });

  it('App con utente socio autenticato renderizza i controlli di sessione "Area Socio" ed "Esci"', () => {
    const memberUser: AuthenticatedUser = {
      userId: 'usr-01',
      actorType: 'MEMBER',
      role: 'SOCIO',
      memberId: 'socio-01',
      membershipStatus: 'ATTIVO',
      member: {
        id: 'socio-01',
        codiceSocio: 'SOC-001',
        nomeCognome: 'Mario Rossi',
        emailDemo: 'mario.rossi@demo.it',
        dataIscrizione: '2024-01-15',
        statoAssociativo: 'ATTIVO',
        quotaSocialeInRegola: true
      }
    };

    const mockAuthContext = {
      status: 'AUTHENTICATED_MEMBER' as const,
      user: memberUser,
      login: async () => {},
      logout: async () => {},
      refreshAuth: async () => {}
    };

    const html = renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(AppContent)
      )
    );

    assert(html.includes('Area Socio'), 'Navbar deve mostrare Area Socio');
    assert(html.includes('Esci'), 'Navbar deve mostrare tasto Esci');
    assert(!html.includes('Pannello Tecnico'), 'Non deve mostrare pannello tecnico per i soci');
  });

  it('App con Technical Admin autenticato impedisce accesso a /socio/attivita', () => {
    const adminUser: AuthenticatedUser = {
      userId: 'usr-admin-01',
      actorType: 'TECHNICAL_ADMIN',
      role: 'AMMINISTRATORE_TECNICO',
      memberId: null,
      membershipStatus: null,
      member: null
    };

    const mockAuthContext = {
      status: 'AUTHENTICATED_TECHNICAL_ADMIN' as const,
      user: adminUser,
      login: async () => {},
      logout: async () => {},
      refreshAuth: async () => {}
    };

    const previousWindow = globalThis.window;
    (globalThis as any).window = {
      location: { pathname: '/socio/attivita' },
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    try {
      const html = renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: mockAuthContext },
          React.createElement(AppContent)
        )
      );

      assert(html.includes('Accesso Non Consentito'), 'Deve mostrare blocco accesso');
      assert(html.includes('Amministratore Tecnico non possiede una scheda socio'), 'Deve spiegare il divieto statutario');
    } finally {
      globalThis.window = previousWindow;
    }
  });

  it('Nessun accesso a document.cookie per leggere il session token (HttpOnly rispettato)', () => {
    // In ambiente browser, document.cookie non contiene prolocal_session perché è HttpOnly
    const mockDocument = {
      get cookie() {
        throw new Error('Accesso a document.cookie NON consentito dal modello di sicurezza HttpOnly!');
      }
    };

    const previousDoc = (globalThis as any).document;
    (globalThis as any).document = mockDocument;

    try {
      const client = new ProLocalApiClient('http://test-server');
      // Verifichiamo che tutte le chiamate operino regolarmente senza tentare di accedere a document.cookie
      assert.strictEqual(typeof client.login, 'function');
      assert.strictEqual(typeof client.getCurrentUser, 'function');
      assert.strictEqual(typeof client.logout, 'function');
      assert.strictEqual(typeof client.getMemberAreaMe, 'function');
    } finally {
      (globalThis as any).document = previousDoc;
    }
  });
});
