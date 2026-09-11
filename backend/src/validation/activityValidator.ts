export interface UpdateActivityInput {
  nomeAttivita?: unknown;
  descrizioneBreve?: unknown;
  descrizioneCompleta?: unknown;
  serviziOfferti?: unknown;
  localita?: unknown;
  indirizzoPubblico?: unknown;
  telefonoPubblico?: unknown;
  emailPubblica?: unknown;
  sitoWeb?: unknown;
  socialInstagram?: unknown;
  socialLinkedin?: unknown;
  orariApertura?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: {
    nomeAttivita: string;
    descrizioneBreve: string;
    descrizioneCompleta: string;
    serviziOfferti: string[];
    localita: string;
    indirizzoPubblico?: string;
    telefonoPubblico?: string;
    emailPubblica?: string;
    sitoWeb?: string;
    socialInstagram?: string;
    socialLinkedin?: string;
    orariApertura?: string;
  };
}

export class ActivityValidator {
  public static validateUpdate(input: UpdateActivityInput): ValidationResult {
    const errors: string[] = [];

    // Validazione nome attività
    if (typeof input.nomeAttivita !== 'string' || input.nomeAttivita.trim().length === 0) {
      errors.push('Il nome dell\'attività è obbligatorio.');
    } else if (input.nomeAttivita.trim().length < 3 || input.nomeAttivita.trim().length > 100) {
      errors.push('Il nome dell\'attività deve essere compreso tra 3 e 100 caratteri.');
    }

    // Validazione descrizione breve
    if (typeof input.descrizioneBreve !== 'string' || input.descrizioneBreve.trim().length === 0) {
      errors.push('La descrizione breve è obbligatoria.');
    } else if (input.descrizioneBreve.trim().length < 10 || input.descrizioneBreve.trim().length > 250) {
      errors.push('La descrizione breve deve essere compresa tra 10 e 250 caratteri.');
    }

    // Validazione descrizione completa
    if (typeof input.descrizioneCompleta !== 'string' || input.descrizioneCompleta.trim().length === 0) {
      errors.push('La descrizione completa è obbligatoria.');
    } else if (input.descrizioneCompleta.trim().length < 20 || input.descrizioneCompleta.trim().length > 3000) {
      errors.push('La descrizione completa deve essere compresa tra 20 e 3000 caratteri.');
    }

    // Validazione località
    if (typeof input.localita !== 'string' || input.localita.trim().length === 0) {
      errors.push('La località è obbligatoria.');
    } else if (input.localita.trim().length > 100) {
      errors.push('La località non può superare i 100 caratteri.');
    }

    // Validazione servizi offerti
    let sanitizedServices: string[] = [];
    if (input.serviziOfferti !== undefined) {
      if (!Array.isArray(input.serviziOfferti)) {
        errors.push('I servizi offerti devono essere forniti come lista di elementi.');
      } else {
        sanitizedServices = input.serviziOfferti
          .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
          .map((s) => s.trim().slice(0, 50));
        if (sanitizedServices.length === 0) {
          errors.push('Indicare almeno un servizio offerto.');
        }
      }
    } else {
      errors.push('I servizi offerti sono obbligatori.');
    }

    // Validazione opzionale formato email pubblica
    let emailPubblica: string | undefined;
    if (input.emailPubblica !== undefined && input.emailPubblica !== null && input.emailPubblica !== '') {
      if (typeof input.emailPubblica !== 'string') {
        errors.push('L\'email pubblica deve essere una stringa.');
      } else {
        const trimmedEmail = input.emailPubblica.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          errors.push('Formato email pubblica non valido.');
        } else {
          emailPubblica = trimmedEmail;
        }
      }
    }

    // Validazione opzionale formato telefono pubblico
    let telefonoPubblico: string | undefined;
    if (input.telefonoPubblico !== undefined && input.telefonoPubblico !== null && input.telefonoPubblico !== '') {
      if (typeof input.telefonoPubblico !== 'string') {
        errors.push('Il telefono pubblico deve essere una stringa.');
      } else {
        telefonoPubblico = input.telefonoPubblico.trim().slice(0, 30);
      }
    }

    // Validazione opzionale URL sito web
    let sitoWeb: string | undefined;
    if (input.sitoWeb !== undefined && input.sitoWeb !== null && input.sitoWeb !== '') {
      if (typeof input.sitoWeb !== 'string') {
        errors.push('Il sito web deve essere una stringa.');
      } else {
        const trimmedUrl = input.sitoWeb.trim();
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
          errors.push('L\'URL del sito web deve iniziare con http:// o https://.');
        } else {
          sitoWeb = trimmedUrl;
        }
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      sanitizedData: {
        nomeAttivita: (input.nomeAttivita as string).trim(),
        descrizioneBreve: (input.descrizioneBreve as string).trim(),
        descrizioneCompleta: (input.descrizioneCompleta as string).trim(),
        serviziOfferti: sanitizedServices,
        localita: (input.localita as string).trim(),
        indirizzoPubblico: typeof input.indirizzoPubblico === 'string' ? input.indirizzoPubblico.trim() : undefined,
        telefonoPubblico,
        emailPubblica,
        sitoWeb,
        socialInstagram: typeof input.socialInstagram === 'string' ? input.socialInstagram.trim() : undefined,
        socialLinkedin: typeof input.socialLinkedin === 'string' ? input.socialLinkedin.trim() : undefined,
        orariApertura: typeof input.orariApertura === 'string' ? input.orariApertura.trim() : undefined
      }
    };
  }
}
