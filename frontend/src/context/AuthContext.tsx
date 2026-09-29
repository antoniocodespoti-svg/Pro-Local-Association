import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthStatus, AuthenticatedUser } from '../types/auth.ts';
import { apiClient } from '../services/apiClient.ts';

export interface AuthContextType {
  status: AuthStatus;
  user: AuthenticatedUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('INITIALIZING');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const data = await apiClient.getCurrentUser();
      if (data && data.authenticated) {
        setUser(data);
        if (data.actorType === 'TECHNICAL_ADMIN') {
          setStatus('AUTHENTICATED_TECHNICAL_ADMIN');
        } else {
          setStatus('AUTHENTICATED_MEMBER');
        }
      } else {
        setUser(null);
        setStatus('UNAUTHENTICATED');
      }
    } catch {
      setUser(null);
      setStatus('UNAUTHENTICATED');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Gestione centralizzata session expiration (401 da qualsiasi endpoint autenticato)
  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      setUser(null);
      setStatus('UNAUTHENTICATED');
    });
    return () => {
      apiClient.setOnUnauthorized(undefined);
    };
  }, []);

  const login = async (email: string, password: string) => {
    await apiClient.login(email, password);
    const currentUser = await apiClient.getCurrentUser();
    if (currentUser && currentUser.authenticated) {
      setUser(currentUser);
      if (currentUser.actorType === 'TECHNICAL_ADMIN') {
        setStatus('AUTHENTICATED_TECHNICAL_ADMIN');
      } else {
        setStatus('AUTHENTICATED_MEMBER');
      }
    } else {
      setUser(null);
      setStatus('UNAUTHENTICATED');
      throw new Error('Impossibile verificare la sessione dopo il login.');
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
      setStatus('UNAUTHENTICATED');
    }
  };

  return (
    <AuthContext.Provider value={{ status, user, login, logout, refreshAuth: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
}
