import React from 'react';
import type { PublicActivity } from '../types/domain.ts';
import { LegalNotice } from './LegalNotice.tsx';

interface ActivityDetailViewProps {
  activity: PublicActivity | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({
  activity,
  loading,
  error,
  onBack
}) => {
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        <p>Caricamento scheda attività in corso...</p>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          ← Torna alla Vetrina
        </button>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '8px',
            color: '#991B1B'
          }}
        >
          <h3 style={{ margin: '0 0 8px 0' }}>Attività non disponibile</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {error || 'La scheda richiesta non esiste o non soddisfa i requisiti associativi di visibilità pubblica.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px' }}>
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          backgroundColor: '#F1F5F9',
          border: '1px solid #CBD5E1',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '14px'
        }}
      >
        ← Torna alla Vetrina
      </button>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}
      >
        {/* Header Scheda: Nessun badge o attestato promozionale */}
        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '20px', marginBottom: '20px' }}>
          <span
            style={{
              fontSize: '13px',
              textTransform: 'uppercase',
              color: '#64748B',
              letterSpacing: '0.05em',
              fontWeight: 600
            }}
          >
            {activity.categoria.replace(/_/g, ' ')}
          </span>
          <h1 style={{ margin: '8px 0 12px 0', fontSize: '28px', color: '#0F172A' }}>
            {activity.nomeAttivita}
          </h1>
          <p style={{ fontSize: '16px', color: '#334155', margin: 0, lineHeight: 1.5 }}>
            {activity.descrizioneBreve}
          </p>
        </div>

        {/* Descrizione Completa */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', color: '#1E293B', marginBottom: '10px' }}>
            Descrizione dell'Attività
          </h2>
          <p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {activity.descrizioneCompleta}
          </p>
        </div>

        {/* Servizi Offerti */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', color: '#1E293B', marginBottom: '10px' }}>
            Servizi & Prestazioni
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {activity.serviziOfferti.map((s, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Recapiti e Contatti Pubblici Autonomi */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}
        >
          <h2 style={{ fontSize: '16px', color: '#1E293B', margin: '0 0 14px 0' }}>
            Recapiti e Informazioni di Contatto
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '14px' }}>
            <div>
              <strong>Località:</strong> {activity.localita}
            </div>
            {activity.indirizzoPubblico && (
              <div>
                <strong>Indirizzo:</strong> {activity.indirizzoPubblico}
              </div>
            )}
            {activity.telefonoPubblico && (
              <div>
                <strong>Telefono:</strong> {activity.telefonoPubblico}
              </div>
            )}
            {activity.emailPubblica && (
              <div>
                <strong>Email:</strong> {activity.emailPubblica}
              </div>
            )}
            {activity.sitoWeb && (
              <div>
                <strong>Sito Web:</strong>{' '}
                <a href={activity.sitoWeb} target="_blank" rel="noopener noreferrer" style={{ color: '#0284C7' }}>
                  {activity.sitoWeb}
                </a>
              </div>
            )}
            {activity.orariApertura && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Orari:</strong> {activity.orariApertura}
              </div>
            )}
          </div>
        </div>

        {/* Nota di Trasparenza e Responsabilità Legale */}
        <LegalNotice customNote={activity.trasparenza?.notaLegale} />
      </div>
    </div>
  );
};
