import React from 'react';
import type { MemberAreaResponse } from '../types/domain.ts';

interface MemberDashboardViewProps {
  memberData: MemberAreaResponse | null;
  loading: boolean;
  error: string | null;
  onEditActivity: () => void;
  onSwitchDemoMember: (memberId: string) => void;
}

export const MemberDashboardView: React.FC<MemberDashboardViewProps> = ({
  memberData,
  loading,
  error,
  onEditActivity,
  onSwitchDemoMember
}) => {
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        <p>Caricamento area socio demo in corso...</p>
      </div>
    );
  }

  if (error || !memberData) {
    return (
      <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px' }}>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '8px',
            color: '#991B1B'
          }}
        >
          <h3 style={{ margin: '0 0 8px 0' }}>Errore Caricamento Area Socio</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  const { socio, attivita, authMode, notaAutenticazione } = memberData;

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', padding: '0 20px' }}>
      {/* Banner Esplicito di Autenticazione Demo */}
      <div
        style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #93C5FD',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '13px',
          color: '#1E40AF'
        }}
      >
        <strong>MODALITÀ COLLAUDO: {authMode}</strong>
        <p style={{ margin: '4px 0 8px 0', lineHeight: 1.4 }}>{notaAutenticazione}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>Cambia utente demo:</span>
          <button
            onClick={() => onSwitchDemoMember('socio-01')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: socio.id === 'socio-01' ? '#2563EB' : '#FFFFFF',
              color: socio.id === 'socio-01' ? '#FFFFFF' : '#1E293B',
              border: '1px solid #CBD5E1',
              borderRadius: '4px'
            }}
          >
            Socio 1 (Mario Rossi - Attivo)
          </button>
          <button
            onClick={() => onSwitchDemoMember('socio-02')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: socio.id === 'socio-02' ? '#2563EB' : '#FFFFFF',
              color: socio.id === 'socio-02' ? '#FFFFFF' : '#1E293B',
              border: '1px solid #CBD5E1',
              borderRadius: '4px'
            }}
          >
            Socio 2 (Elena Bianchi - Attivo)
          </button>
          <button
            onClick={() => onSwitchDemoMember('socio-03')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: socio.id === 'socio-03' ? '#2563EB' : '#FFFFFF',
              color: socio.id === 'socio-03' ? '#FFFFFF' : '#1E293B',
              border: '1px solid #CBD5E1',
              borderRadius: '4px'
            }}
          >
            Socio 3 (Giuseppe Verdi - Sospeso)
          </button>
          <button
            onClick={() => onSwitchDemoMember('socio-04')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: socio.id === 'socio-04' ? '#2563EB' : '#FFFFFF',
              color: socio.id === 'socio-04' ? '#FFFFFF' : '#1E293B',
              border: '1px solid #CBD5E1',
              borderRadius: '4px'
            }}
          >
            Socio 4 (Carla Neri - Escluso)
          </button>
        </div>
      </div>

      <h1 style={{ fontSize: '24px', color: '#0F172A', marginBottom: '6px' }}>Area Personale del Socio</h1>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
        Gestione democratica interna e collegamento con la propria scheda attività in vetrina.
      </p>

      {/* Profilo Associativo */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <h2 style={{ fontSize: '18px', color: '#1E293B', margin: '0 0 16px 0' }}>Stato Associativo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Nome e Cognome</span>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>{socio.nomeCognome}</div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Codice Socio</span>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>{socio.codiceSocio}</div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Stato di Iscrizione</span>
            <div style={{ marginTop: '2px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor:
                    socio.statoAssociativo === 'ATTIVO'
                      ? '#DCFCE7'
                      : socio.statoAssociativo === 'SOSPESO'
                      ? '#FEF3C7'
                      : '#FEE2E2',
                  color:
                    socio.statoAssociativo === 'ATTIVO'
                      ? '#166534'
                      : socio.statoAssociativo === 'SOSPESO'
                      ? '#92400E'
                      : '#991B1B'
                }}
              >
                {socio.statoAssociativo}
              </span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Data Iscrizione</span>
            <div style={{ fontSize: '14px', color: '#334155' }}>{socio.dataIscrizione}</div>
          </div>
        </div>
      </div>

      {/* Attività Commerciale / Professionale Collegata */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', color: '#1E293B', margin: 0 }}>Scheda Attività Autonoma</h2>
          {attivita && (
            <button
              onClick={onEditActivity}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Modifica Scheda
            </button>
          )}
        </div>

        {attivita ? (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Stato Pubblicazione Vetrina:</span>{' '}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor:
                    attivita.statoPubblicazione === 'PUBBLICATA' && socio.statoAssociativo === 'ATTIVO'
                      ? '#DCFCE7'
                      : '#FEF3C7',
                  color:
                    attivita.statoPubblicazione === 'PUBBLICATA' && socio.statoAssociativo === 'ATTIVO'
                      ? '#166534'
                      : '#92400E'
                }}
              >
                {attivita.statoPubblicazione === 'PUBBLICATA' && socio.statoAssociativo === 'ATTIVO'
                  ? 'PUBBLICATA (Visibile in vetrina)'
                  : `${attivita.statoPubblicazione} (Non visibile in vetrina)`}
              </span>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0F172A' }}>{attivita.nomeAttivita}</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#475569' }}>{attivita.descrizioneBreve}</p>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              <span>📍 {attivita.localita}</span> | <span>Ultimo aggiornamento: {attivita.dataUltimoAggiornamento}</span>
            </div>
          </div>
        ) : (
          <div style={{ color: '#64748B', fontSize: '14px' }}>
            Nessuna scheda attività attualmente associata a questo socio.
          </div>
        )}
      </div>
    </div>
  );
};
