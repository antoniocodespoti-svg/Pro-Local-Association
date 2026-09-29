import React from 'react';
import type { AuthenticatedUser } from '../types/auth.ts';

interface TechnicalAdminViewProps {
  user: AuthenticatedUser;
  onLogout: () => void;
  onGoHome: () => void;
}

export const TechnicalAdminView: React.FC<TechnicalAdminViewProps> = ({
  user,
  onLogout,
  onGoHome
}) => {
  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px' }}>
      <div
        style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '10px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#334155',
                color: '#38BDF8',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            >
              RUOLO TECNICO: {user.role}
            </span>
            <h1 style={{ fontSize: '22px', margin: 0, fontWeight: 700 }}>
              Sessione Amministratore Tecnico
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onGoHome}
              style={{
                padding: '8px 14px',
                backgroundColor: '#1E293B',
                color: '#FFFFFF',
                border: '1px solid #475569',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Vetrina Pubblica
            </button>
            <button
              onClick={onLogout}
              style={{
                padding: '8px 14px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Disconnetti
            </button>
          </div>
        </div>
      </div>

      {/* Box Principio di Non Ingerenza & Governance */}
      <div
        style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
          color: '#92400E',
          lineHeight: 1.5,
          fontSize: '14px'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#B45309' }}>
          Separazione dei Ruoli e Trasparenza Statutaria
        </h3>
        <p style={{ margin: '0 0 10px 0' }}>
          In conformità con lo Statuto dell'Associazione Pro-Local e con il modello di sicurezza RBAC:
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>L'Amministratore Tecnico non è un associato (<strong>memberId = null</strong>).</li>
          <li>Non possiede una scheda socio né può inserire attività economiche in vetrina.</li>
          <li>Non può deliberare, approvare o respingere istanze associative riservate agli organi democratici eletti.</li>
          <li>Ha accesso unicamente alle operazioni tecnologiche e di sicurezza del sistema.</li>
        </ul>
      </div>

      {/* Dati Sessione Tecnica */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '24px'
        }}
      >
        <h3 style={{ fontSize: '16px', color: '#1E293B', margin: '0 0 16px 0' }}>
          Dati dell'Account Tecnico
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Identificativo Utente</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
              {user.userId}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Tipologia Attore</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
              {user.actorType}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Scheda Associativa</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginTop: '2px' }}>
              Nessuna (Riservata ai soli soci)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
