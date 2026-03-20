import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT = 'core-associates-ia-salt';

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32);
}

/**
 * Encrypts text using AES-256-GCM.
 * Output format: `enc:iv_hex:tag_hex:ciphertext_hex`
 */
export function encryptApiKey(plaintext: string): string {
  const secret = process.env.AI_ENCRYPTION_KEY;
  if (!secret) return plaintext; // No encryption key configured, store as-is

  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an API key encrypted with `encryptApiKey`.
 * If the value doesn't start with `enc:`, it's returned as-is (backward compatibility).
 */
export function decryptApiKey(stored: string): string {
  if (!stored.startsWith('enc:')) return stored; // Not encrypted (legacy)

  const secret = process.env.AI_ENCRYPTION_KEY;
  if (!secret) throw new Error('AI_ENCRYPTION_KEY requerida para descifrar API keys');

  const parts = stored.split(':');
  if (parts.length !== 4) return stored;

  const key = deriveKey(secret);
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = Buffer.from(parts[3], 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

/**
 * Returns true if the value appears to be encrypted.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith('enc:');
}
