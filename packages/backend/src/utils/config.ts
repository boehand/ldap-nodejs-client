import dotenv from 'dotenv';
import { ConfigError } from './errors.js';
import type { LdapConfig } from '../types/index.js';

// Load .env file if it exists
dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string | undefined {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  return value;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new ConfigError(`Missing required environment variable: ${key}`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new ConfigError(`Invalid number for ${key}: ${value}`);
  }
  return num;
}

function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

export function loadConfig(): LdapConfig {
  const config: LdapConfig = {
    host: getEnvVar('HOST', '127.0.0.1') || '127.0.0.1',
    port: getEnvNumber('PORT', 5000),
    nodeEnv: (getEnvVar('NODE_ENV', 'development') || 'development') as any,
    logLevel: getEnvVar('LOG_LEVEL', 'info') || 'info',
    sessionSecret: getEnvVar('SESSION_SECRET') || 'change-me-in-production-not-secure!',
    sessionTtl: getEnvNumber('SESSION_TTL', 24 * 60 * 60 * 1000), // 24 hours
    defaultLdapUrl: getEnvVar('LDAP_URL'),
    defaultBaseDn: getEnvVar('BASE_DN'),
    defaultLoginAttr: getEnvVar('LOGIN_ATTR', 'uid'),
  };

  // Warn if using default session secret in production
  if (
    config.nodeEnv === 'production' &&
    config.sessionSecret === 'change-me-in-production'
  ) {
    console.warn(
      '⚠️  WARNING: Using default SESSION_SECRET in production. Set SESSION_SECRET env var!'
    );
  }

  return config;
}

export function validateConfig(config: LdapConfig): void {
  if (config.port < 1 || config.port > 65535) {
    throw new ConfigError(`Invalid port: ${config.port}`);
  }

  if (!config.sessionSecret || config.sessionSecret.length < 8) {
    throw new ConfigError('SESSION_SECRET must be at least 8 characters');
  }
}

let cachedConfig: LdapConfig | null = null;

export function getConfig(): LdapConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
    validateConfig(cachedConfig);
  }
  return cachedConfig;
}

export function setConfig(config: LdapConfig): void {
  validateConfig(config);
  cachedConfig = config;
}
