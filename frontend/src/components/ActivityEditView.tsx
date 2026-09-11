import React, { useState } from 'react';
import type { MemberAreaResponse, UpdateActivityInput } from '../types/domain.ts';

interface ActivityEditViewProps {
  memberData: MemberAreaResponse;
  onSave: (activityId: string, data: UpdateActivityInput) => Promise<void>;
  onCancel: () => void;
}

export const ActivityEditView: React.FC<ActivityEditViewProps> = ({
  memberData,
  onSave,
  onCancel
}) => {
  const currentActivity = memberData.attivita;

  const [nomeAttivita, setNomeAttivita] = useState(currentActivity?.nomeAttivita || '');
  const [descrizioneBreve, setDescrizioneBreve] = useState(currentActivity?.descrizioneBreve || '');
  const [descrizioneCompleta, setDescrizioneCompleta] = useState(
    currentActivity?.descrizioneCompleta || ''
  );
  const [serviziInput, setServiziInput] = useState(
    currentActivity?.serviziOfferti.join(', ') || ''
  );
  const [localita, setLocalita] = useState(currentActivity?.localita || '');
  const [indirizzoPubblico, setIndirizzoPubblico] = useState(
    currentActivity?.indirizzoPubblico || ''
  );
  const [telefonoPubblico, setTelefonoPubblico] = useState(
    currentActivity?.telefonoPubblico || ''
  );
  const [emailPubblica, setEmailPubblica] = useState(
    currentActivity?.emailPubblica || ''
  );
  const [sitoWeb, setSitoWeb] = useState(currentActivity?.sitoWeb || '');
  const [orariApertura, setOrariApertura] = useState(
    currentActivity?.orariApertura || ''
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!currentActivity) {
    return (
      <div style={{ maxWidth: '700px', margin: '30px auto', padding: '0 20px' }}>
        <p>Nessuna attività collegata da modificare.</p>
        <button onClick={onCancel}>Torna all'area socio</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const serviziOfferti = serviziInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (serviziOfferti.length === 0) {
      setErrorMessage('Indicare almeno un servizio offerto (separati da virgola).');
      return;
    }

    setSaving(true);
    try {
      await onSave(currentActivity.id, {
        nomeAttivita,
        descrizioneBreve,
        descrizioneCompleta,
        serviziOfferti,
        localita,
        indirizzoPubblico: indirizzoPubblico.trim() || undefined,
        telefonoPubblico: telefonoPubblico.trim() || undefined,
        emailPubblica: emailPubblica.trim() || undefined,
        sitoWeb: sitoWeb.trim() || undefined,
        orariApertura: orariApertura.trim() || undefined
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '30px auto', padding: '0 20px' }}>
      <button
        onClick={onCancel}
        style={{
          padding: '6px 12px',
          backgroundColor: '#F1F5F9',
          border: '1px solid #CBD5E1',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '13px'
        }}
      >
        ← Annulla e Torna alla Dashboard
      </button>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <h1 style={{ fontSize: '22px', color: '#0F172A', margin: '0 0 8px 0' }}>
          Modifica Scheda della Tua Attività
        </h1>

        {/* Nota di Regola di Dominio sul cambio stato */}
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#92400E',
            lineHeight: 1.4
          }}
        >
          <strong>Regola Associativa:</strong> Il socio ha diritto esclusivo di aggiornare la propria
          attività. A tutela della trasparenza associativa, qualsiasi modifica inviata pone la scheda nello stato{' '}
          <strong>IN ATTESA DI APPROVAZIONE</strong> in vista della ripubblicazione.
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #F87171',
              borderRadius: '6px',
              padding: '12px',
              color: '#991B1B',
              fontSize: '13px',
              marginBottom: '20px'
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label htmlFor="nomeAttivita" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
              Nome dell'Attività *
            </label>
            <input
              id="nomeAttivita"
              type="text"
              value={nomeAttivita}
              onChange={(e) => setNomeAttivita(e.target.value)}
              required
              minLength={3}
              maxLength={100}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label htmlFor="descrizioneBreve" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
              Descrizione Breve (10 - 250 caratteri) *
            </label>
            <input
              id="descrizioneBreve"
              type="text"
              value={descrizioneBreve}
              onChange={(e) => setDescrizioneBreve(e.target.value)}
              required
              minLength={10}
              maxLength={250}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label htmlFor="descrizioneCompleta" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
              Descrizione Completa *
            </label>
            <textarea
              id="descrizioneCompleta"
              rows={4}
              value={descrizioneCompleta}
              onChange={(e) => setDescrizioneCompleta(e.target.value)}
              required
              minLength={20}
              maxLength={3000}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label htmlFor="serviziInput" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
              Servizi Offerti (separati da virgola) *
            </label>
            <input
              id="serviziInput"
              type="text"
              value={serviziInput}
              onChange={(e) => setServiziInput(e.target.value)}
              placeholder="es. Restauro mobili, Doratura, Perizie"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="localita" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
                Località *
              </label>
              <input
                id="localita"
                type="text"
                value={localita}
                onChange={(e) => setLocalita(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label htmlFor="indirizzoPubblico" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
                Indirizzo Pubblico
              </label>
              <input
                id="indirizzoPubblico"
                type="text"
                value={indirizzoPubblico}
                onChange={(e) => setIndirizzoPubblico(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="telefonoPubblico" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
                Telefono Pubblico
              </label>
              <input
                id="telefonoPubblico"
                type="text"
                value={telefonoPubblico}
                onChange={(e) => setTelefonoPubblico(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label htmlFor="emailPubblica" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
                Email Pubblica
              </label>
              <input
                id="emailPubblica"
                type="email"
                value={emailPubblica}
                onChange={(e) => setEmailPubblica(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="sitoWeb" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
              Sito Web Ufficiale (deve iniziare con http:// o https://)
            </label>
            <input
              id="sitoWeb"
              type="url"
              value={sitoWeb}
              onChange={(e) => setSitoWeb(e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label htmlFor="orariApertura" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
              Orari di Apertura
            </label>
            <input
              id="orariApertura"
              type="text"
              value={orariApertura}
              onChange={(e) => setOrariApertura(e.target.value)}
              placeholder="es. Lun-Ven 09:00 - 18:00"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 24px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {saving ? 'Salvataggio...' : 'Salva Modifiche Scheda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
