/**
 * AES-256-GCM helpers for api_keys.encrypted_value.
 * Server-only — never import from client components.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

/** Fail fast when ENCRYPTION_SECRET is missing or not 32 bytes as hex. */
export function validateEncryptionSecret(): void {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || !/^[0-9a-fA-F]{64}$/.test(secret)) {
    throw new CryptoError('ENCRYPTION_SECRET must be 64 hex characters');
  }
}

function getKey(): Buffer {
  validateEncryptionSecret();
  return Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex');
}

/** base64(iv || authTag || ciphertext) */
export function encrypt(plaintext: string): string {
  try {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  } catch (error) {
    if (error instanceof CryptoError) throw error;
    throw new CryptoError('encrypt failed');
  }
}

export function decrypt(ciphertext: string): string {
  try {
    const key = getKey();
    const data = Buffer.from(ciphertext, 'base64');
    if (data.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      throw new CryptoError('invalid format');
    }
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    if (error instanceof CryptoError) throw error;
    throw new CryptoError('decrypt failed');
  }
}

export function getLastFour(plaintext: string): string {
  if (plaintext.length < 4) return plaintext;
  return plaintext.slice(-4);
}

if (typeof window === 'undefined') {
  validateEncryptionSecret();
}
