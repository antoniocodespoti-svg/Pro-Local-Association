import type { ISessionRepository } from '../repositories/SessionRepository.ts';

export interface SessionCleanupLogger {
  log: (msg: string) => void;
  error: (msg: string, ...args: unknown[]) => void;
}

export interface SessionCleanupOptions {
  /**
   * Intervallo in millisecondi tra un ciclo di pulizia e il successivo.
   * Default: 60 minuti (3.600.000 ms).
   */
  intervalMs?: number;
  /**
   * Logger personalizzato (utile per isolamento nei test unitari).
   * Default: console standard.
   */
  logger?: SessionCleanupLogger;
}

/**
 * Servizio applicativo per la rimozione periodica delle sessioni scadute.
 *
 * Caratteristiche:
 * - Ciclo periodico configurabile (default 60 minuti).
 * - Failure isolation: cattura e registra eventuali eccezioni senza propagarle o bloccare il processo.
 * - Ciclo di vita controllabile: metodi start() e stop() per evitare leak di timer o task zombie.
 */
export class SessionCleanupService {
  private sessionRepo: ISessionRepository;
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private logger: SessionCleanupLogger;

  constructor(sessionRepo: ISessionRepository, options?: SessionCleanupOptions) {
    this.sessionRepo = sessionRepo;
    // 60 minuti in millisecondi = 60 * 60 * 1000 = 3_600_000 ms
    this.intervalMs = options?.intervalMs ?? 60 * 60 * 1000;
    this.logger = options?.logger ?? {
      log: (msg: string) => console.log(msg),
      error: (msg: string, ...args: unknown[]) => console.error(msg, ...args)
    };
  }

  /**
   * Esegue un singolo ciclo di rimozione delle sessioni scadute con isolamento dei fallimenti.
   *
   * @param now Timestamp opzionale ISO 8601 di riferimento (utile per testing).
   * @returns Il numero di sessioni eliminate, oppure -1 in caso di errore non bloccante.
   */
  async runCleanupOnce(now?: string): Promise<number> {
    try {
      const deletedCount = await this.sessionRepo.deleteExpired(now);
      if (deletedCount > 0) {
        this.logger.log(`[SessionCleanup] Rimosse ${deletedCount} sessioni scadute.`);
      }
      return deletedCount;
    } catch (err: unknown) {
      // Failure isolation: cattura qualsiasi errore (es. disconnessione temporanea PostgreSQL)
      // senza bloccare il server e garantendo che il ciclo successivo possa proseguire.
      this.logger.error('[SessionCleanup] Errore durante la rimozione periodica delle sessioni scadute:', err);
      return -1;
    }
  }

  /**
   * Avvia il timer di pulizia periodica.
   */
  start(): void {
    if (this.timer) {
      return; // Già in esecuzione
    }

    this.isRunning = true;
    this.timer = setInterval(async () => {
      await this.runCleanupOnce();
    }, this.intervalMs);

    // Evita di trattenere attivo il processo Node se non ci sono altri task in ascolto
    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  /**
   * Ferma il timer di pulizia periodica e rilascia le risorse.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  /**
   * Indica se il timer periodico è attualmente attivo.
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Restituisce l'intervallo configurato in millisecondi.
   */
  getIntervalMs(): number {
    return this.intervalMs;
  }
}
