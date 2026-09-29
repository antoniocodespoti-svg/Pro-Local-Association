import React, { useState, useEffect } from 'react';
import type { PublicActivity, MemberAreaResponse, UpdateActivityInput } from './types/domain.ts';
import { apiClient } from './services/apiClient.ts';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ShowcaseView } from './components/ShowcaseView.tsx';
import { ActivityDetailView } from './components/ActivityDetailView.tsx';
import { MemberDashboardView } from './components/MemberDashboardView.tsx';
import { ActivityEditView } from './components/ActivityEditView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { TechnicalAdminView } from './components/TechnicalAdminView.tsx';

// Componente principale che consuma AuthContext
export const AppContent: React.FC = () => {
  const { status, user, logout } = useAuth();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  // Stato Vetrina Pubblica
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(true);
  const [showcaseError, setShowcaseError] = useState<string | null>(null);

  // Stato Dettaglio Attività
  const [selectedActivity, setSelectedActivity] = useState<PublicActivity | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Stato Area Socio
  const [memberData, setMemberData] = useState<MemberAreaResponse | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Sincronizzazione con il path del browser
  const navigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Controllo rotte protette e session expiration
  useEffect(() => {
    if (status === 'UNAUTHENTICATED') {
      if (currentPath === '/socio' || currentPath === '/socio/attivita') {
        navigate('/login');
      }
    }
  }, [status, currentPath]);

  // Caricamento vetrina pubblica
  const loadShowcase = async () => {
    setShowcaseLoading(true);
    setShowcaseError(null);
    try {
      const data = await apiClient.getPublicShowcase();
      setActivities(data);
    } catch (err: unknown) {
      setShowcaseError(
        err instanceof Error
          ? err.message
          : 'Impossibile connettersi alle REST API per recuperare la vetrina.'
      );
    } finally {
      setShowcaseLoading(false);
    }
  };

  // Caricamento dettaglio attività
  const loadActivityDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const act = await apiClient.getPublicActivity(id);
      setSelectedActivity(act);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Attività non trovata');
      setSelectedActivity(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Caricamento dati socio reale dal server
  const loadMemberArea = async () => {
    if (status !== 'AUTHENTICATED_MEMBER') {
      return;
    }
    setMemberLoading(true);
    setMemberError(null);
    try {
      const data = await apiClient.getMemberAreaMe();
      setMemberData(data);
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : 'Errore nel caricamento area socio');
    } finally {
      setMemberLoading(false);
    }
  };

  // Trigger caricamento dati al cambio di percorso o stato
  useEffect(() => {
    if (status === 'INITIALIZING') {
      return;
    }

    if (currentPath === '/') {
      loadShowcase();
    } else if (currentPath.startsWith('/attivita/')) {
      const id = currentPath.replace('/attivita/', '');
      if (id) {
        loadActivityDetail(id);
      }
    } else if (currentPath === '/socio' || currentPath === '/socio/attivita') {
      if (status === 'AUTHENTICATED_MEMBER') {
        loadMemberArea();
      }
    }
  }, [currentPath, status]);

  // Gestione salvataggio modifiche attività (PUT protetta con sessione e CSRF)
  const handleSaveActivity = async (activityId: string, payload: UpdateActivityInput) => {
    setFeedbackSuccess(null);
    await apiClient.updateActivity(activityId, payload);
    setFeedbackSuccess(
      'La tua scheda attività è stata aggiornata con successo. Conformemente allo statuto, la scheda è ora in attesa di approvazione.'
    );
    await loadMemberArea();
    navigate('/socio');
  };

  // Gestione logout
  const handleLogout = async () => {
    await logout();
    setMemberData(null);
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Header Web Navbar */}
      <header
        style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '16px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              onClick={() => navigate('/')}
              style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', cursor: 'pointer' }}
            >
              PRO-LOCAL
            </span>
            <span
              style={{
                fontSize: '11px',
                backgroundColor: '#1E293B',
                color: '#94A3B8',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              Associazione Territoriale
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                backgroundColor: currentPath === '/' || currentPath.startsWith('/attivita') ? '#1E293B' : 'transparent',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Vetrina Pubblica
            </button>

            {status === 'UNAUTHENTICATED' && (
              <button
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: currentPath === '/login' ? '#2563EB' : 'transparent',
                  color: '#FFFFFF',
                  border: '1px solid #3B82F6',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Accedi
              </button>
            )}

            {status === 'AUTHENTICATED_MEMBER' && (
              <>
                <button
                  onClick={() => navigate('/socio')}
                  style={{
                    backgroundColor: currentPath.startsWith('/socio') ? '#2563EB' : 'transparent',
                    color: '#FFFFFF',
                    border: '1px solid #3B82F6',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Area Socio
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#94A3B8',
                    border: '1px solid #334155',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Esci
                </button>
              </>
            )}

            {status === 'AUTHENTICATED_TECHNICAL_ADMIN' && (
              <>
                <button
                  onClick={() => navigate('/socio')}
                  style={{
                    backgroundColor: '#334155',
                    color: '#38BDF8',
                    border: '1px solid #0EA5E9',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Pannello Tecnico
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#EF4444',
                    border: '1px solid #991B1B',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Esci
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Notifica di Successo Globale */}
      {feedbackSuccess && (
        <div
          style={{
            maxWidth: '850px',
            margin: '20px auto 0 auto',
            padding: '12px 20px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #6EE7B7',
            borderRadius: '6px',
            color: '#065F46',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>✓ {feedbackSuccess}</span>
          <button
            onClick={() => setFeedbackSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Rendered in base alla route e allo stato di autenticazione */}
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {status === 'INITIALIZING' ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
            <p style={{ fontSize: '15px' }}>Verifica sessione in corso...</p>
          </div>
        ) : (
          <>
            {currentPath === '/' && (
              <ShowcaseView
                activities={activities}
                loading={showcaseLoading}
                error={showcaseError}
                onSelectActivity={(act) => navigate(`/attivita/${act.id}`)}
              />
            )}

            {currentPath.startsWith('/attivita/') && (
              <ActivityDetailView
                activity={selectedActivity}
                loading={detailLoading}
                error={detailError}
                onBack={() => navigate('/')}
              />
            )}

            {currentPath === '/login' && (
              <LoginView
                onSuccess={(actorType) => {
                  if (actorType === 'TECHNICAL_ADMIN') {
                    navigate('/socio');
                  } else {
                    navigate('/socio');
                  }
                }}
                onCancel={() => navigate('/')}
              />
            )}

            {currentPath === '/socio' && (
              status === 'AUTHENTICATED_TECHNICAL_ADMIN' ? (
                <TechnicalAdminView
                  user={user!}
                  onLogout={handleLogout}
                  onGoHome={() => navigate('/')}
                />
              ) : status === 'AUTHENTICATED_MEMBER' ? (
                <MemberDashboardView
                  memberData={memberData}
                  loading={memberLoading}
                  error={memberError}
                  onEditActivity={() => navigate('/socio/attivita')}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Reindirizzamento all'accesso in corso...</p>
                </div>
              )
            )}

            {currentPath === '/socio/attivita' && (
              status === 'AUTHENTICATED_TECHNICAL_ADMIN' ? (
                <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
                  <div style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', color: '#991B1B' }}>
                    <h3 style={{ margin: '0 0 8px 0' }}>Accesso Non Consentito</h3>
                    <p style={{ margin: '0 0 12px 0' }}>
                      L'Amministratore Tecnico non possiede una scheda socio né attività commerciali da modificare.
                    </p>
                    <button
                      onClick={() => navigate('/socio')}
                      style={{ padding: '6px 12px', backgroundColor: '#1E293B', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Torna al Pannello Tecnico
                    </button>
                  </div>
                </div>
              ) : status === 'AUTHENTICATED_MEMBER' ? (
                memberData ? (
                  <ActivityEditView
                    memberData={memberData}
                    onSave={handleSaveActivity}
                    onCancel={() => navigate('/socio')}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Caricamento dati socio in corso...</p>
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Reindirizzamento all'accesso in corso...</p>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Footer Istituzionale Neutrale */}
      <footer
        style={{
          backgroundColor: '#0F172A',
          borderTop: '1px solid #1E293B',
          color: '#94A3B8',
          padding: '24px 20px',
          fontSize: '13px',
          textAlign: 'center'
        }}
      >
        <p style={{ margin: '0 0 6px 0' }}>
          <strong>Associazione Pro-Local</strong> — Promozione democratica territoriale & Vetrina neutrale delle attività dei soci.
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
          Tutte le attività esposte mantengono la loro totale autonomia contrattuale e professionale. L'associazione non rilascia attestati commerciali né assume responsabilità di intermediazione.
        </p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
