import crypto from 'crypto';
import CryptoJS from 'crypto-js';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Encrypt a password using AES-256-GCM
 * Format: salt(16) + iv(12) + ciphertext + tag(16)
 */
export function encryptPassword(
  password: string,
  masterKey: string
): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from masterKey + salt using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');

    // Encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(password, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + ciphertext + tag
    const result = Buffer.concat([salt, iv, encrypted, tag]);

    return result.toString('hex');
  } catch (error) {
    throw new Error(`Failed to encrypt password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a password encrypted with encryptPassword()
 */
export function decryptPassword(
  encrypted: string,
  masterKey: string
): string {
  try {
    const buffer = Buffer.from(encrypted, 'hex');

    // Extract components
    const salt = buffer.slice(0, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.slice(buffer.length - TAG_LENGTH);
    const ciphertext = buffer.slice(
      SALT_LENGTH + IV_LENGTH,
      buffer.length - TAG_LENGTH
    );

    // Derive key from masterKey + salt
    const derivedKey = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Failed to decrypt password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a random session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}
