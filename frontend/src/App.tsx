import React, { useEffect, useState } from 'react';
import type { PublicActivity } from './types/domain.js';
import { ShowcaseView } from './components/ShowcaseView.js';
import { apiClient } from './services/apiClient.js';

export const App: React.FC = () => {
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // In questa fase iniziale di predisposizione, carica le attività tramite il client
    // o fallback su un set dimostrativo validato per lo sviluppo del frontend
    apiClient
      .getPublicShowcase()
      .then((data) => {
        setActivities(data);
        setLoading(false);
      })
      .catch(() => {
        // Mock dimostrativo privacy-safe per sviluppo standalone frontend
        setActivities([
          {
            id: 'act-demo-1',
            nomeAttivita: 'Bottega Restauro Antico',
            categoria: 'artigianato',
            descrizioneBreve: 'Restauro di mobili antichi e manufatti lignei storici',
            descrizioneCompleta: 'Laboratorio artigiano specializzato in lucidatura a tampone e consolidamento ligneo.',
            serviziOfferti: ['Restauro d\'arte', 'Falegnameria', 'Perizie lignee'],
            localita: 'Borgo Antico',
            telefonoPubblico: '0984 000001',
            dataUltimoAggiornamento: '2024-05-15',
            trasparenza: {
              autonomiaAttivita: true,
              notaLegale: 'Attività autonoma del socio.'
            }
          },
          {
            id: 'act-demo-2',
            nomeAttivita: 'Studio Consulenza Digitale',
            categoria: 'digitale',
            descrizioneBreve: 'Progettazione siti web, architetture cloud e supporto informatico',
            descrizioneCompleta: 'Consulenza tecnica per imprese locali e digitalizzazione di processi associativi.',
            serviziOfferti: ['Siti web', 'Infrastruttura cloud', 'Sicurezza dati'],
            localita: 'Centro Servizi',
            telefonoPubblico: '0984 000002',
            dataUltimoAggiornamento: '2024-05-20',
            trasparenza: {
              autonomiaAttivita: true,
              notaLegale: 'Attività autonoma del socio.'
            }
          }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <ShowcaseView activities={activities} isLoading={loading} />
    </div>
  );
};
