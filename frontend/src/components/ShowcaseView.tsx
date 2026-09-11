import React, { useState } from 'react';
import type { PublicActivity } from '../types/domain.ts';
import { ActivityCard } from './ActivityCard.tsx';
import { LegalNotice } from './LegalNotice.tsx';

export interface ShowcaseViewProps {
  activities: PublicActivity[];
  loading?: boolean;
  error?: string | null;
  onSelectActivity?: (activity: PublicActivity) => void;
}

/**
 * Vista principale della Vetrina Territoriale Web di Pro-Local.
 * Mostra le attività approvate dei soci attivi con separazione assoluta
 * tra associazione e attività professionali.
 */
export const ShowcaseView: React.FC<ShowcaseViewProps> = ({
  activities,
  loading = false,
  error = null,
  onSelectActivity
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = Array.from(new Set(activities.map((a) => a.categoria)));

  const filtered = activities.filter((act) => {
    const matchesCategory = filterCategory === 'all' || act.categoria === filterCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      act.nomeAttivita.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.descrizioneBreve.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.localita.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
          Vetrina delle Attività dei Soci
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Spazio informativo delle attività professionali, commerciali e artigianali promosse dai soci di Pro-Local.
        </p>
      </header>

      {/* Nota Legale permanente per la cittadinanza */}
      <LegalNotice />

      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '8px',
            color: '#991B1B',
            margin: '20px 0'
          }}
        >
          {error}
        </div>
      )}

      {/* Controlli di ricerca e filtro per il visitatore */}
      <div style={{ display: 'flex', gap: '12px', margin: '20px 0', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Cerca attività per nome, descrizione o località..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 250px',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '14px'
          }}
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            fontSize: '14px'
          }}
        >
          <option value="all">Tutte le categorie</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
          <p>Caricamento vetrina pubblica in corso...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px dashed #CBD5E1',
            borderRadius: '8px',
            color: '#64748B'
          }}
        >
          <p style={{ margin: 0, fontSize: '15px' }}>
            Nessuna attività corrisponde ai criteri di ricerca o risulta pubblicata nella vetrina.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {filtered.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onSelect={() => onSelectActivity?.(activity)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
