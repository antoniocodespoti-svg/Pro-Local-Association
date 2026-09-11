import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

function scryptPromise(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N?: number; r?: number; p?: number; maxmem?: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, storedHash: string): Promise<boolean>;
  needsRehash?(storedHash: string): boolean;
}

export interface ScryptParams {
  costN: number; // CPU/memory cost parameter (must be power of 2)
  blockSizeR: number; // block size parameter
  parallelizationP: number; // parallelization parameter
  keyLength: number; // length of the derived key in bytes
  saltLength: number; // length of the random salt in bytes
}

// Parametri conformi alle raccomandazioni OWASP per password hashing con scrypt
export const DEFAULT_SCRYPT_PARAMS: ScryptParams = {
  costN: 16384, // 2^14 (16 MB memoria)
  blockSizeR: 8,
  parallelizationP: 1,
  keyLength: 64,
  saltLength: 16
};

/**
 * Implementazione sicura del password hashing basata su node:crypto.scrypt nativo.
 * Formato persistito versionabile (PHC format):
 * scrypt$N=16384,r=8,p=1$<salt_hex>$<derived_key_hex>
 */
export class ScryptPasswordHasher implements IPasswordHasher {
  private params: ScryptParams;

  constructor(customParams?: Partial<ScryptParams>) {
    this.params = {
      ...DEFAULT_SCRYPT_PARAMS,
      ...customParams
    };
  }

  async hash(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('La password deve essere una stringa non vuota');
    }

    const salt = randomBytes(this.params.saltLength);
    const derivedKey = await scryptPromise(password, salt, this.params.keyLength, {
      N: this.params.costN,
      r: this.params.blockSizeR,
      p: this.params.parallelizationP,
      maxmem: 64 * 1024 * 1024 // 64 MB limite sicurezza
    });

    const saltHex = salt.toString('hex');
    const keyHex = derivedKey.toString('hex');

    return `scrypt$N=${this.params.costN},r=${this.params.blockSizeR},p=${this.params.parallelizationP}$${saltHex}$${keyHex}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
      return false;
    }

    try {
      const parts = storedHash.split('$');
      if (parts.length !== 4) {
        return false;
      }

      const [algorithm, paramString, saltHex, keyHex] = parts;
      if (algorithm !== 'scrypt') {
        return false;
      }

      // Parsing parametri N, r, p
      const parsedParams: Record<string, number> = {};
      paramString.split(',').forEach((item) => {
        const [k, v] = item.split('=');
        if (k && v) {
          parsedParams[k.trim()] = parseInt(v.trim(), 10);
        }
      });

      const costN = parsedParams['N'];
      const blockSizeR = parsedParams['r'];
      const parallelizationP = parsedParams['p'];

      if (!costN || !blockSizeR || !parallelizationP) {
        return false;
      }

      const salt = Buffer.from(saltHex, 'hex');
      const expectedKey = Buffer.from(keyHex, 'hex');

      const calculatedKey = await scryptPromise(password, salt, expectedKey.length, {
        N: costN,
        r: blockSizeR,
        p: parallelizationP,
        maxmem: 64 * 1024 * 1024
      });

      if (expectedKey.length !== calculatedKey.length) {
        return false;
      }

      // Confronto timing-safe per prevenire attacchi di temporizzazione
      return timingSafeEqual(expectedKey, calculatedKey);
    } catch {
      return false;
    }
  }

  needsRehash(storedHash: string): boolean {
    try {
      const parts = storedHash.split('$');
      if (parts.length !== 4 || parts[0] !== 'scrypt') return true;
      const expectedPrefix = `scrypt$N=${this.params.costN},r=${this.params.blockSizeR},p=${this.params.parallelizationP}$`;
      return !storedHash.startsWith(expectedPrefix);
    } catch {
      return true;
    }
  }
}
