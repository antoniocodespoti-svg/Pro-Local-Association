import React, { useState } from 'react';
import type { PublicActivity } from '../types/domain.js';
import { ActivityCard } from './ActivityCard.js';
import { LegalNotice } from './LegalNotice.js';

interface ShowcaseViewProps {
  activities: PublicActivity[];
  isLoading?: boolean;
}

/**
 * Vista principale della Vetrina Territoriale Web di Pro-Local.
 * Mostra le attività approvate dei soci attivi con separazione assoluta
 * tra associazione e attività professionali.
 */
export const ShowcaseView: React.FC<ShowcaseViewProps> = ({ activities, isLoading = false }) => {
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

      <LegalNotice />

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
            fontSize: '14px',
            backgroundColor: '#FFFFFF'
          }}
        >
          <option value="all">Tutte le categorie ({activities.length})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>Caricamento in corso...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
          Nessuna attività corrisponde ai criteri di ricerca selezionati.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
};
