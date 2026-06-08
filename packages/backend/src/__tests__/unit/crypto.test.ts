import { describe, it, expect } from 'vitest';
import { encryptPassword, decryptPassword, generateSessionId } from '../../utils/crypto.js';

describe('Crypto Utils', () => {
  describe('encryptPassword & decryptPassword', () => {
    it('should encrypt and decrypt password correctly', () => {
      const password = 'mySecretPassword123!';
      const masterKey = 'masterKeyForSession';

      const encrypted = encryptPassword(password, masterKey);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = decryptPassword(encrypted, masterKey);
      expect(decrypted).toBe(password);
    });

    it('should handle empty password', () => {
      const password = '';
      const masterKey = 'masterKey';

      const encrypted = encryptPassword(password, masterKey);
      const decrypted = decryptPassword(encrypted, masterKey);

      expect(decrypted).toBe(password);
    });

    it('should handle special characters in password', () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const masterKey = 'masterKey';

      const encrypted = encryptPassword(password, masterKey);
      const decrypted = decryptPassword(encrypted, masterKey);

      expect(decrypted).toBe(password);
    });

    it('should handle unicode characters', () => {
      const password = '密码🔐Пароль';
      const masterKey = 'masterKey';

      const encrypted = encryptPassword(password, masterKey);
      const decrypted = decryptPassword(encrypted, masterKey);

      expect(decrypted).toBe(password);
    });

    it('should produce different ciphertexts for same password (random salt/IV)', () => {
      const password = 'testPassword';
      const masterKey = 'masterKey';

      const encrypted1 = encryptPassword(password, masterKey);
      const encrypted2 = encryptPassword(password, masterKey);

      // Different ciphertexts due to random salt and IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same password
      expect(decryptPassword(encrypted1, masterKey)).toBe(password);
      expect(decryptPassword(encrypted2, masterKey)).toBe(password);
    });

    it('should fail with wrong masterKey', () => {
      const password = 'testPassword';
      const masterKey1 = 'masterKey1';
      const masterKey2 = 'masterKey2';

      const encrypted = encryptPassword(password, masterKey1);

      expect(() => {
        decryptPassword(encrypted, masterKey2);
      }).toThrow();
    });

    it('should fail with corrupted ciphertext', () => {
      const masterKey = 'masterKey';
      const corruptedCiphertext = 'invalidhexstring123abc';

      expect(() => {
        decryptPassword(corruptedCiphertext, masterKey);
      }).toThrow();
    });

    it('should handle long passwords', () => {
      const password = 'x'.repeat(1000);
      const masterKey = 'masterKey';

      const encrypted = encryptPassword(password, masterKey);
      const decrypted = decryptPassword(encrypted, masterKey);

      expect(decrypted).toBe(password);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a random session ID', () => {
      const sessionId = generateSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(64); // 32 bytes * 2 hex chars
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();
      const sessionId3 = generateSessionId();

      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId2).not.toBe(sessionId3);
      expect(sessionId1).not.toBe(sessionId3);
    });

    it('should be valid hex string', () => {
      const sessionId = generateSessionId();
      expect(/^[0-9a-f]+$/i.test(sessionId)).toBe(true);
    });
  });
});
