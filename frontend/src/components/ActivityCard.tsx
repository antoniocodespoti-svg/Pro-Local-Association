import React from 'react';
import type { PublicActivity } from '../types/domain.js';

interface ActivityCardProps {
  activity: PublicActivity;
  onSelect?: (activity: PublicActivity) => void;
}

/**
 * Scheda descrittiva dell'attività economica o professionale del socio.
 * Rispetta il PRINCIPIO B: Nessun badge ("Verificato", "Certificato", "Garantito"),
 * nessun sigillo né elemento promozionale ingannevole per il pubblico.
 */
export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onSelect }) => {
  return (
    <article
      onClick={() => onSelect?.(activity)}
      style={{
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '20px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
          {activity.nomeAttivita}
        </h3>
        <span style={{ fontSize: '12px', color: '#64748B', textTransform: 'capitalize' }}>
          {activity.categoria.replace('_', ' ')}
        </span>
      </div>

      <p style={{ fontSize: '14px', color: '#334155', margin: '8px 0 14px 0', lineHeight: 1.4 }}>
        {activity.descrizioneBreve}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {activity.serviziOfferti.map((servizio, idx) => (
          <span
            key={idx}
            style={{
              fontSize: '12px',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              padding: '3px 8px',
              borderRadius: '4px'
            }}
          >
            {servizio}
          </span>
        ))}
      </div>

      <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
        <span>📍 {activity.localita}</span>
        {activity.telefonoPubblico && <span>📞 {activity.telefonoPubblico}</span>}
      </div>
    </article>
  );
};
