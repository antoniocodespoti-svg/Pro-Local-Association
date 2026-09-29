import type { Request, Response, NextFunction } from 'express';
import type { AuthService, AuthenticatedActor } from '../services/AuthService.ts';
import { parseCookie, SESSION_COOKIE_NAME } from './cookieUtils.ts';
import { ProLocalRole } from '../domain/models.ts';

export const CSRF_HEADER_NAME = 'x-requested-with';
export const CSRF_HEADER_EXPECTED_VALUE = 'prolocalapp';

/**
 * Contesto dell'attore autenticato accessibile dagli endpoint di backend.
 * Identità, ruolo e stato verificati dal server (cookie di sessione valido).
 */
export interface AuthenticatedRequestContext {
  isRealAuth: boolean;
  actorId: string; // accountId univoco
  memberId: string | null;
  role: ProLocalRole;
  actorType?: 'MEMBER' | 'TECHNICAL_ADMIN';
  authenticatedActor?: AuthenticatedActor;
}

// Estensione dell'interfaccia Request di Express
declare global {
  namespace Express {
    interface Request {
      authContext?: AuthenticatedRequestContext;
    }
  }
}

export interface AuthMiddlewareOptions {
  authService: AuthService;
}

/**
 * Middleware di risoluzione dell'attore HTTP.
 *
 * REGOLE ARCHITETTURALI E DI SICUREZZA:
 * 1. AUTENTICAZIONE ESCLUSIVA SERVER-SIDE:
 *    Se è presente un cookie 'prolocal_session', la sessione viene verificata tramite AuthService.
 *    Se la sessione è valida, il contesto viene costruito ESCLUSIVAMENTE dai dati server-side.
 *    Nessun header client-side alternativo (come X-Demo-*) viene preso in considerazione.
 * 2. SESSIONE SCADUTA / INVALIDA:
 *    Se il cookie di sessione è presente ma non è più valido o è scaduto, il cookie viene CANCELLATO nella risposta
 *    e la richiesta procede come non autenticata (le route protette risponderanno 401).
 * 3. NESSUN FALLBACK DEMO:
 *    L'autenticazione è obbligatoria e sicura di default. Non esiste alcun bypass o fallback.
 * 4. PROTEZIONE CSRF:
 *    Per le sessioni reali (cookie-based), ogni richiesta mutativa (POST, PUT, PATCH, DELETE) DEVE contenere
 *    l'header 'X-Requested-With: ProLocalApp' (case-insensitive). In caso contrario viene rigettata con HTTP 403 Forbidden.
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions) {
  const { authService } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const rawSessionToken = parseCookie(req, SESSION_COOKIE_NAME);

    if (rawSessionToken) {
      try {
        const actor = await authService.resolveAuthenticatedActor(rawSessionToken);

        // Protezione CSRF per richieste con autenticazione reale a cookie
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
        if (isMutation) {
          const csrfHeader = req.header(CSRF_HEADER_NAME);
          if (!csrfHeader || csrfHeader.trim().toLowerCase() !== CSRF_HEADER_EXPECTED_VALUE) {
            return res.status(403).json({
              error: 'Protezione CSRF violata: header X-Requested-With assente o non valido per richieste con sessione reale.'
            });
          }
        }

        // Assegnazione contesto autenticato reale verificato dal server
        req.authContext = {
          isRealAuth: true,
          actorId: actor.userId,
          memberId: actor.memberId,
          role: actor.role,
          actorType: actor.actorType,
          authenticatedActor: actor
        };

        return next();
      } catch (err: unknown) {
        // Se la sessione è scaduta o invalida, cancelliamo il cookie dal client
        clearSessionCookie(res);
        return next();
      }
    }

    // Nessun cookie di sessione: la richiesta prosegue come non autenticata
    return next();
  };
}

/**
 * Imposta il cookie prolocal_session HttpOnly nel client.
 */
export function setSessionCookie(res: Response, rawToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  // 8 ore in secondi = 8 * 3600 = 28800
  const maxAgeSeconds = 8 * 60 * 60;

  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProduction,
    maxAge: maxAgeSeconds * 1000 // express res.cookie accetta millisecondi per maxAge
  });
}

/**
 * Cancella il cookie prolocal_session dal client.
 */
export function clearSessionCookie(res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProduction,
    expires: new Date(0),
    maxAge: 0
  });
}
