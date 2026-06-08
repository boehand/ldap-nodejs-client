// Shared types for LDAP UI Backend

export interface LdapEntry {
  dn: string;
  attributes: Record<string, string[]>;
  rawAttributes?: Record<string, Buffer[]>;
}

export interface LdapAttribute {
  name: string;
  values: string[];
  isMultiValued: boolean;
  syntax?: string;
}

export interface SearchParams {
  baseDn: string;
  filter: string;
  attributes?: string[];
  scope?: 'base' | 'one' | 'sub';
  sizeLimit?: number;
}

export interface LdapSession {
  bindDn: string;
  ldapUrl: string;
  encryptedPassword: string;
  encryptedAt: number;
  expiresAt: number;
  savedUrls?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    detail?: string;
  };
}

export interface LdapConfig {
  host: string;
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: string;
  sessionSecret: string;
  sessionTtl: number;
  defaultLdapUrl?: string;
  defaultBaseDn?: string;
  defaultLoginAttr?: string;
}

export interface LdapErrorInfo {
  code: string;
  message: string;
  ldapCode?: number;
}

// Fastify module augmentation
declare module '@fastify/session' {
  interface FastifySessionObject {
    bindDn: string;
    ldapUrl: string;
    encryptedPassword: string;
    encryptedAt: number;
    expiresAt: number;
    savedUrls?: string[];
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    ldapCreds?: {
      bindDn: string;
      password: string;
      ldapUrl: string;
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
