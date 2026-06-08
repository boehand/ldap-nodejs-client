import { describe, it, expect } from 'vitest';
import {
  AppError,
  LdapError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ConfigError,
  getLdapErrorInfo,
  getHttpStatusCode,
  LdapErrorCode,
} from '../../utils/errors.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('TEST_CODE', 'Test message', 400, 'Test detail');

      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.detail).toBe('Test detail');
      expect(error.name).toBe('AppError');
    });

    it('should default to 500 status code', () => {
      const error = new AppError('ERROR', 'Message');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('LdapError', () => {
    it('should create an LdapError with LDAP code', () => {
      const error = new LdapError('INVALID_CREDENTIALS', 'Bad password', 49);

      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.ldapCode).toBe(49);
      expect(error.statusCode).toBe(401); // Should map to 401
      expect(error.name).toBe('LdapError');
    });

    it('should map LDAP error codes to HTTP status', () => {
      const testCases = [
        [49, 401], // INVALID_CREDENTIALS
        [32, 404], // NO_SUCH_OBJECT
        [50, 403], // INSUFFICIENT_ACCESS_RIGHTS
        [68, 409], // ENTRY_ALREADY_EXISTS
        [65, 400], // OBJECT_CLASS_VIOLATION
        [12, 503], // UNAVAILABLE
      ];

      for (const [ldapCode, expectedStatus] of testCases) {
        const error = new LdapError('TEST', 'message', ldapCode);
        expect(error.statusCode).toBe(expectedStatus);
      }
    });
  });

  describe('Specific Error Types', () => {
    it('should create AuthenticationError with 401 status', () => {
      const error = new AuthenticationError('Login failed');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError('User');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toContain('User');
    });

    it('should create ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create ConfigError with 500 status', () => {
      const error = new ConfigError('Missing env var');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('CONFIG_ERROR');
    });
  });

  describe('getLdapErrorInfo', () => {
    it('should extract info from AppError', () => {
      const error = new AppError('MY_ERROR', 'Error message', 400, 'Details');
      const info = getLdapErrorInfo(error);

      expect(info.code).toBe('MY_ERROR');
      expect(info.message).toBe('Error message');
    });

    it('should extract info from LdapError', () => {
      const error = new LdapError('LDAP_ERROR', 'LDAP message', 49);
      const info = getLdapErrorInfo(error);

      expect(info.code).toBe('LDAP_ERROR');
      expect(info.message).toBe('LDAP message');
      expect(info.ldapCode).toBe(49);
    });

    it('should extract info from generic Error', () => {
      const error = new Error('Generic error (49)');
      const info = getLdapErrorInfo(error);

      expect(info.message).toBe('Generic error (49)');
      expect(info.ldapCode).toBe(49); // Extracted from message
    });

    it('should handle unknown objects', () => {
      const info = getLdapErrorInfo('string error');

      expect(info.code).toBe('UNKNOWN_ERROR');
      expect(info.message).toBe('An unexpected error occurred');
    });
  });

  describe('getHttpStatusCode', () => {
    it('should return status code from AppError', () => {
      const error = new AppError('ERROR', 'message', 418);
      expect(getHttpStatusCode(error)).toBe(418);
    });

    it('should return status code from LdapError', () => {
      const error = new LdapError('NO_SUCH_OBJECT', 'Not found', 32);
      expect(getHttpStatusCode(error)).toBe(404);
    });

    it('should return 500 for unknown errors', () => {
      const error = new Error('Unknown error');
      expect(getHttpStatusCode(error)).toBe(500);
    });

    it('should return 500 for non-Error values', () => {
      expect(getHttpStatusCode('string')).toBe(500);
      expect(getHttpStatusCode({})).toBe(500);
      expect(getHttpStatusCode(null)).toBe(500);
    });
  });

  describe('Error Code Constants', () => {
    it('should have common LDAP error codes defined', () => {
      expect(LdapErrorCode.INVALID_CREDENTIALS).toBe(49);
      expect(LdapErrorCode.NO_SUCH_OBJECT).toBe(32);
      expect(LdapErrorCode.ENTRY_ALREADY_EXISTS).toBe(68);
      expect(LdapErrorCode.INSUFFICIENT_ACCESS_RIGHTS).toBe(50);
      expect(LdapErrorCode.UNAVAILABLE).toBe(12);
    });
  });
});
