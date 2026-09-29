import type { Request } from 'express';

export const SESSION_COOKIE_NAME = 'prolocal_session';

/**
 * Estrae il valore di un cookie specifico dall'header 'cookie' della richiesta HTTP.
 * Gestisce cookie multipli, spaziature, cookie assenti o malformati.
 * Non logga mai il valore del cookie né i token.
 */
export function parseCookie(req: Request, cookieName: string = SESSION_COOKIE_NAME): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return null;
  }

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    if (key === cookieName) {
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!val) return null;
      try {
        return decodeURIComponent(val);
      } catch {
        return null;
      }
    }
  }

  return null;
}
