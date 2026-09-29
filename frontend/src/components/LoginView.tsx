import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ApiError } from '../types/auth.ts';

interface LoginViewProps {
  onSuccess: (actorType: 'MEMBER' | 'TECHNICAL_ADMIN') => void;
  onCancel: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onCancel }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('I campi email e password sono obbligatori.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await login(trimmedEmail, password);
      // Non memorizziamo la password in memoria dopo l'operazione
      setPassword('');
      onSuccess('MEMBER');
    } catch (err: unknown) {
      // Pulizia immediata della password su errore
      setPassword('');
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMessage('Credenziali non valide. Verificare email e password.');
        } else if (err.status === 423) {
          setErrorMessage(
            'Account temporaneamente bloccato per motivi di sicurezza dopo troppi tentativi falliti. Riprovare più tardi.'
          );
        } else {
          setErrorMessage(err.message);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Errore durante l\'accesso. Riprovare.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '0 20px' }}>
      <button
        onClick={onCancel}
        style={{
          padding: '6px 12px',
          backgroundColor: '#F1F5F9',
          border: '1px solid #CBD5E1',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#475569'
        }}
      >
        ← Torna alla Vetrina Pubblica
      </button>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '32px 28px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
            Accesso Area Riservata
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            Inserisci le tue credenziali di socio o amministratore per accedere ai servizi riservati.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #F87171',
              borderRadius: '6px',
              color: '#991B1B',
              fontSize: '13px',
              marginBottom: '20px',
              lineHeight: 1.4
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="login-email"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
            >
              Indirizzo Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="es. socio@prolocal.it"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxSizing: 'border-box',
                backgroundColor: loading ? '#F8FAFC' : '#FFFFFF'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="login-password"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci la password"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxSizing: 'border-box',
                backgroundColor: loading ? '#F8FAFC' : '#FFFFFF'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#94A3B8' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>
            Sessione protetta con cookie cifrato HttpOnly e protezione anti-manomissione CSRF.
          </p>
        </div>
      </div>
    </div>
  );
};
