import { LdapErrorInfo } from '../types/index.js';

// LDAP Error codes from RFC 4511
export enum LdapErrorCode {
  SUCCESS = 0,
  OPERATIONS_ERROR = 1,
  PROTOCOL_ERROR = 2,
  TIMELIMIT_EXCEEDED = 3,
  SIZELIMIT_EXCEEDED = 4,
  COMPARE_FALSE = 5,
  COMPARE_TRUE = 6,
  AUTH_METHOD_NOT_SUPPORTED = 7,
  STRONG_AUTH_REQUIRED = 8,
  REFERRAL = 10,
  UNAVAILABLE = 12,
  UNWILLING_TO_PERFORM = 13,
  LOOP_DETECT = 54,
  NAMING_VIOLATION = 64,
  OBJECT_CLASS_VIOLATION = 65,
  NOT_ALLOWED_ON_NON_LEAF = 66,
  NOT_ALLOWED_ON_RDN = 67,
  ENTRY_ALREADY_EXISTS = 68,
  OBJECT_CLASS_MODS_PROHIBITED = 69,
  AFFECTS_MULTIPLE_DSAS = 71,
  INVALID_CREDENTIALS = 49,
  INSUFFICIENT_ACCESS_RIGHTS = 50,
  BUSY = 51,
  UNAVAILABLE_CRITICAL_EXTENSION = 12,
  NO_SUCH_ATTRIBUTE = 16,
  UNDEFINED_ATTRIBUTE_TYPE = 17,
  INAPPROPRIATE_MATCHING = 18,
  CONSTRAINT_VIOLATION = 19,
  ATTRIBUTE_OR_VALUE_EXISTS = 20,
  INVALID_ATTRIBUTE_SYNTAX = 21,
  NO_SUCH_OBJECT = 32,
  ALIAS_PROBLEM = 33,
  INVALID_DN_SYNTAX = 34,
  ALIAS_DEREFERENCING_PROBLEM = 36,
  INAPPROPRIATE_AUTH = 48,
  INVALID_SEARCH_FILTER_ERROR = 87,
  UNDEFINED_ATTRIBUTE_TYPE_ERROR = 17,
}

// Map LDAP error codes to HTTP status codes
const LDAP_TO_HTTP_STATUS: Record<number | string, number> = {
  [LdapErrorCode.INVALID_CREDENTIALS]: 401,
  [LdapErrorCode.INSUFFICIENT_ACCESS_RIGHTS]: 403,
  [LdapErrorCode.UNWILLING_TO_PERFORM]: 403,
  [LdapErrorCode.NO_SUCH_OBJECT]: 404,
  [LdapErrorCode.ENTRY_ALREADY_EXISTS]: 409,
  [LdapErrorCode.OBJECT_CLASS_VIOLATION]: 400,
  [LdapErrorCode.INVALID_ATTRIBUTE_SYNTAX]: 400,
  [LdapErrorCode.INVALID_DN_SYNTAX]: 400,
  [LdapErrorCode.CONSTRAINT_VIOLATION]: 400,
  [LdapErrorCode.UNAVAILABLE]: 503,
  'UNAVAILABLE': 503,
  'INVALID_CREDENTIALS': 401,
  'NO_SUCH_OBJECT': 404,
  'ENTRY_ALREADY_EXISTS': 409,
  'INSUFFICIENT_ACCESS_RIGHTS': 403,
  'UNWILLING_TO_PERFORM': 403,
  'default': 500,
};

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public detail?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class LdapError extends AppError {
  ldapCode?: number;

  constructor(code: string, message: string, ldapCode?: number, detail?: string) {
    const statusCode = ldapCode
      ? LDAP_TO_HTTP_STATUS[ldapCode] || LDAP_TO_HTTP_STATUS[code] || 500
      : LDAP_TO_HTTP_STATUS[code] || 500;

    super(code, message, statusCode, detail);
    this.name = 'LdapError';
    this.ldapCode = ldapCode;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('INVALID_CREDENTIALS', message, 401);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super('CONFIG_ERROR', message, 500);
    this.name = 'ConfigError';
  }
}

export function getLdapErrorInfo(error: unknown): LdapErrorInfo {
  if (error instanceof LdapError) {
    return {
      code: error.code,
      message: error.message,
      ldapCode: error.ldapCode,
    };
  }

  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    // Try to extract LDAP error code from message
    const ldapMatch = (error.message || '').match(/\d{1,3}/);
    const ldapCode = ldapMatch ? parseInt(ldapMatch[0], 10) : undefined;
    const code = error.name || 'UNKNOWN_ERROR';

    return {
      code,
      message: error.message,
      ldapCode,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  };
}

export function getHttpStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (error instanceof Error) {
    const errorInfo = getLdapErrorInfo(error);
    return (
      LDAP_TO_HTTP_STATUS[errorInfo.code] ||
      LDAP_TO_HTTP_STATUS[errorInfo.ldapCode || 'default'] ||
      500
    );
  }

  return 500;
}
