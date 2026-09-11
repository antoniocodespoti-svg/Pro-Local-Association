import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LegalNotice } from '../src/components/LegalNotice.tsx';
import { ActivityCard } from '../src/components/ActivityCard.tsx';
import { ShowcaseView } from '../src/components/ShowcaseView.tsx';
import { ActivityDetailView } from '../src/components/ActivityDetailView.tsx';
import { MemberDashboardView } from '../src/components/MemberDashboardView.tsx';
import type { PublicActivity, MemberAreaResponse } from '../src/types/domain.ts';

describe('Pro-Local Frontend Components SSR Rendering Tests', () => {
  const sampleActivity: PublicActivity = {
    id: 'act-01',
    nomeAttivita: 'Bottega Artigiana del Legno',
    categoria: 'ARTIGIANATO_RESTAURO',
    descrizioneBreve: 'Restauro conservativo mobili d\'epoca',
    descrizioneCompleta: 'Restauro di arredi storici con vernici e colle naturali atossiche.',
    serviziOfferti: ['Restauro', 'Lucidatura a gommalacca'],
    localita: 'Borgo Antico',
    indirizzoPubblico: 'Via degli Artigiani 12',
    telefonoPubblico: '0984 123456',
    emailPubblica: 'bottega@demo.it',
    sitoWeb: 'https://bottega-legno.demo',
    dataUltimoAggiornamento: '2024-05-10',
    trasparenza: {
      autonomiaAttivita: true,
      notaLegale: 'Spazio informativo non vincolante. Nessuna garanzia commerciale.'
    }
  };

  const sampleMemberData: MemberAreaResponse = {
    authMode: 'DEMO_FASE_2_2',
    notaAutenticazione: 'Modalità di collaudo demo per la Fase 2.2',
    socio: {
      id: 'socio-01',
      codiceSocio: 'SOC-001',
      nomeCognome: 'Mario Rossi',
      emailDemo: 'mario.rossi@demo.it',
      dataIscrizione: '2024-01-10',
      statoAssociativo: 'ATTIVO',
      quotaSocialeInRegola: true
    },
    attivita: {
      id: 'act-01',
      memberId: 'socio-01',
      nomeAttivita: 'Bottega Artigiana del Legno',
      categoria: 'ARTIGIANATO_RESTAURO',
      descrizioneBreve: 'Restauro conservativo mobili d\'epoca',
      descrizioneCompleta: 'Restauro di arredi storici...',
      serviziOfferti: ['Restauro'],
      localita: 'Borgo Antico',
      statoPubblicazione: 'PUBBLICATA',
      dataUltimoAggiornamento: '2024-05-10'
    },
    tutteAttivita: []
  };

  it('LegalNotice renderizza il testo di trasparenza senza ambiguità', () => {
    const html = renderToStaticMarkup(React.createElement(LegalNotice));
    assert.strictEqual(html.includes('Nota di Trasparenza e Autonomia Professionale'), true);
    assert.strictEqual(html.includes('non certifica né garantisce i servizi'), true);
    assert.strictEqual(html.includes('non svolge attività di intermediazione'), true);
  });

  it('ActivityCard visualizza i dati e non contiene badge ingannevoli ("certificato", "garantito", "partner ufficiale")', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActivityCard, { activity: sampleActivity })
    );
    assert.strictEqual(html.includes('Bottega Artigiana del Legno'), true);
    assert.strictEqual(html.includes('Restauro conservativo mobili'), true);
    assert.strictEqual(html.includes('Borgo Antico'), true);

    // Verifica divieto badge promozionali / attestazioni
    assert.strictEqual(html.toLowerCase().includes('certificato'), false);
    assert.strictEqual(html.toLowerCase().includes('garantito'), false);
    assert.strictEqual(html.toLowerCase().includes('partner ufficiale'), false);
    assert.strictEqual(html.toLowerCase().includes('verificato'), false);
  });

  it('ShowcaseView renderizza sia LegalNotice che la lista attività', () => {
    const html = renderToStaticMarkup(
      React.createElement(ShowcaseView, {
        activities: [sampleActivity],
        loading: false,
        error: null
      })
    );
    assert.strictEqual(html.includes('Vetrina delle Attività dei Soci'), true);
    assert.strictEqual(html.includes('Nota di Trasparenza e Autonomia Professionale'), true);
    assert.strictEqual(html.includes('Bottega Artigiana del Legno'), true);
  });

  it('ShowcaseView gestisce stato di caricamento ed errore API', () => {
    const loadingHtml = renderToStaticMarkup(
      React.createElement(ShowcaseView, {
        activities: [],
        loading: true,
        error: null
      })
    );
    assert.strictEqual(loadingHtml.includes('Caricamento vetrina pubblica'), true);

    const errorHtml = renderToStaticMarkup(
      React.createElement(ShowcaseView, {
        activities: [],
        loading: false,
        error: 'Errore di connessione API'
      })
    );
    assert.strictEqual(errorHtml.includes('Errore di connessione API'), true);
  });

  it('ActivityDetailView renderizza il dettaglio e la nota legale specifica', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActivityDetailView, {
        activity: sampleActivity,
        loading: false,
        error: null,
        onBack: () => {}
      })
    );
    assert.strictEqual(html.includes('Bottega Artigiana del Legno'), true);
    assert.strictEqual(html.includes('Lucidatura a gommalacca'), true);
    assert.strictEqual(html.includes('0984 123456'), true);
    assert.strictEqual(html.includes('Spazio informativo non vincolante'), true);
  });

  it('MemberDashboardView renderizza profilo socio e stato attività in modalità DEMO', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberDashboardView, {
        memberData: sampleMemberData,
        loading: false,
        error: null,
        onEditActivity: () => {},
        onSwitchDemoMember: () => {}
      })
    );
    assert.strictEqual(html.includes('MODALITÀ COLLAUDO: DEMO_FASE_2_2'), true);
    assert.strictEqual(html.includes('Mario Rossi'), true);
    assert.strictEqual(html.includes('SOC-001'), true);
    assert.strictEqual(html.includes('ATTIVO'), true);
    assert.strictEqual(html.includes('Bottega Artigiana del Legno'), true);
    assert.strictEqual(html.includes('PUBBLICATA (Visibile in vetrina)'), true);
  });
});
