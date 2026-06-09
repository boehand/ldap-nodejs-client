import ldapjs from 'ldapjs';
const { Change, Attribute: LdapAttribute } = ldapjs;
type Client = ldapjs.Client;
import { EventEmitter } from 'events';
import { getLogger } from '../utils/logger.js';
import { LdapError } from '../utils/errors.js';
import type { LdapEntry, SearchParams } from '../types/index.js';

const logger = getLogger();

interface LdapChange {
  operation: 'add' | 'delete' | 'replace';
  modification: any;
}

interface PooledConnection {
  client: Client;
  bindDn?: string;
  lastUsed: number;
  inUse: boolean;
}

interface ConnectionPoolConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

export class LdapConnectionPool {
  private config: ConnectionPoolConfig;
  private connections: Map<string, PooledConnection> = new Map();
  private pendingRequests: ((conn: Client) => void)[] = [];
  private maxConnections: number;
  private connectionTimeout: number;
  private idleTimeout: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: ConnectionPoolConfig) {
    this.config = config;
    this.maxConnections = config.maxConnections || 10;
    this.connectionTimeout = config.connectionTimeout || 5000;
    this.idleTimeout = config.idleTimeout || 60000;

    // Periodically clean up idle connections
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 30000);
  }

  async getConnection(bindDn?: string, password?: string): Promise<Client> {
    // Try to reuse existing connection
    if (bindDn && password) {
      const existingConn = this.findConnectionForBind(bindDn);
      if (existingConn && !existingConn.inUse) {
        existingConn.inUse = true;
        existingConn.lastUsed = Date.now();
        logger.debug(`Reusing pooled connection for ${bindDn}`);
        return existingConn.client;
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.maxConnections) {
      const client = await this.createAndBindConnection(bindDn, password);
      const pooledConn: PooledConnection = {
        client,
        bindDn,
        lastUsed: Date.now(),
        inUse: true,
      };
      const connId = this.generateConnId();
      this.connections.set(connId, pooledConn);
      logger.debug(`Created new pooled connection (${this.connections.size}/${this.maxConnections})`);
      return client;
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection pool timeout'));
      }, this.connectionTimeout);

      this.pendingRequests.push((client) => {
        clearTimeout(timeout);
        resolve(client);
      });
    });
  }

  releaseConnection(client: Client, bindDn?: string): void {
    const connId = Array.from(this.connections.entries()).find(
      ([, conn]) => conn.client === client
    )?.[0];

    if (connId) {
      const pooledConn = this.connections.get(connId);
      if (pooledConn) {
        pooledConn.inUse = false;
        pooledConn.lastUsed = Date.now();

        // Process pending requests
        if (this.pendingRequests.length > 0) {
          const nextRequest = this.pendingRequests.shift();
          if (nextRequest) {
            pooledConn.inUse = true;
            nextRequest(client);
          }
        }
      }
    }
  }

  private async createAndBindConnection(
    bindDn?: string,
    password?: string
  ): Promise<Client> {
    return new Promise((resolve, reject) => {
      const client = ldapjs.createClient({
        url: this.config.url,
        timeout: this.connectionTimeout,
        connectTimeout: this.connectionTimeout,
        tlsOptions: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });

      const timeout = setTimeout(() => {
        client.unbind();
        reject(new Error(`Connection timeout (${this.connectionTimeout}ms)`));
      }, this.connectionTimeout);

      client.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      if (bindDn && password) {
        client.bind(bindDn, password, (err) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            resolve(client);
          }
        });
      } else {
        // Anonymous bind
        client.bind('', '', (err) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            resolve(client);
          }
        });
      }
    });
  }

  private findConnectionForBind(bindDn: string): PooledConnection | null {
    for (const pooledConn of this.connections.values()) {
      if (pooledConn.bindDn === bindDn && !pooledConn.inUse) {
        return pooledConn;
      }
    }
    return null;
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [connId, pooledConn] of this.connections.entries()) {
      if (!pooledConn.inUse && now - pooledConn.lastUsed > this.idleTimeout) {
        pooledConn.client.unbind();
        toRemove.push(connId);
      }
    }

    if (toRemove.length > 0) {
      toRemove.forEach((connId) => this.connections.delete(connId));
      logger.debug(`Cleaned up ${toRemove.length} idle connections`);
    }
  }

  private generateConnId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    const promises = Array.from(this.connections.values()).map(
      (pooledConn) =>
        new Promise<void>((resolve) => {
          pooledConn.client.unbind(() => resolve());
        })
    );

    await Promise.all(promises);
    this.connections.clear();
    logger.debug('LDAP connection pool destroyed');
  }
}

/**
 * LdapClient: Promise-based wrapper over ldapjs with connection pooling
 */
export class LdapClient {
  private pool: LdapConnectionPool;
  private url: string;
  private bindDn?: string;
  private bindPassword?: string;
  private baseDn?: string;

  constructor(
    url: string,
    options?: {
      baseDn?: string;
      maxConnections?: number;
    }
  ) {
    this.url = url;
    this.baseDn = options?.baseDn;
    this.pool = new LdapConnectionPool({
      url,
      maxConnections: options?.maxConnections || 10,
    });
  }

  /**
   * Bind to LDAP server
   */
  async bind(bindDn: string, password: string): Promise<void> {
    try {
      const client = await this.pool.getConnection(bindDn, password);
      this.bindDn = bindDn;
      this.bindPassword = password;
      this.pool.releaseConnection(client, bindDn);
      logger.debug(`Bound as ${bindDn}`);
    } catch (error) {
      throw this.handleError(error, 'INVALID_CREDENTIALS');
    }
  }

  /**
   * Search LDAP directory
   */
  async search(params: SearchParams): Promise<LdapEntry[]> {
    const client = await this.pool.getConnection(this.bindDn, this.bindPassword);

    try {
      return new Promise((resolve, reject) => {
        const entries: LdapEntry[] = [];
        const searchOptions = {
          filter: params.filter,
          scope: params.scope || 'sub',
          attributes: params.attributes,
          sizeLimit: params.sizeLimit || 1000,
        };

        const timeout = setTimeout(() => {
          reject(new Error('Search timeout'));
        }, 10000);

        client.search(params.baseDn, searchOptions, (err, res) => {
          if (err) {
            clearTimeout(timeout);
            reject(err);
            return;
          }

          res.on('searchEntry', (entry) => {
            entries.push({
              dn: String(entry.dn),
              attributes: this.attributesToObject(entry.attributes),
              rawAttributes: this.rawAttributesToObject(entry.attributes),
            });
          });

          res.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });

          res.on('end', (result) => {
            clearTimeout(timeout);
            if (result?.status !== 0) {
              reject(new Error(`Search failed with status ${result?.status}`));
            } else {
              resolve(entries);
            }
          });
        });
      });
    } catch (error) {
      throw this.handleError(error, 'SEARCH_FAILED');
    } finally {
      this.pool.releaseConnection(client, this.bindDn);
    }
  }

  /**
   * Get a single entry
   */
  async getEntry(dn: string, attributes?: string[]): Promise<LdapEntry> {
    const params: SearchParams = {
      baseDn: dn,
      filter: '(objectClass=*)',
      scope: 'base',
      attributes,
    };

    const entries = await this.search(params);
    if (entries.length === 0) {
      throw new LdapError('NO_SUCH_OBJECT', `Entry not found: ${dn}`, 32);
    }

    return entries[0];
  }

  /**
   * Add a new entry
   */
  async add(dn: string, attributes: Record<string, string | string[]>): Promise<void> {
    const client = await this.pool.getConnection(this.bindDn, this.bindPassword);

    try {
      return new Promise((resolve, reject) => {
        // Normalize attributes to arrays
        const normalizedAttrs = Object.entries(attributes).map(([name, value]) => ({
          [name]: Array.isArray(value) ? value : [value],
        }));

        const timeout = setTimeout(() => {
          reject(new Error('Add operation timeout'));
        }, 5000);

        client.add(dn, normalizedAttrs, (err) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            logger.debug(`Added entry: ${dn}`);
            resolve();
          }
        });
      });
    } catch (error) {
      throw this.handleError(error, 'ADD_FAILED');
    } finally {
      this.pool.releaseConnection(client, this.bindDn);
    }
  }

  /**
   * Modify an entry
   */
  async modify(
    dn: string,
    changes: Record<string, string | string[] | null>
  ): Promise<void> {
    const client = await this.pool.getConnection(this.bindDn, this.bindPassword);

    try {
      return new Promise((resolve, reject) => {
        const modifications: any[] = [];

        for (const [attrName, value] of Object.entries(changes)) {
          if (value === null) {
            modifications.push(new Change({
              operation: 'delete',
              modification: new LdapAttribute({ type: attrName }),
            }));
          } else {
            const attrValues = Array.isArray(value) ? value : [value];
            modifications.push(new Change({
              operation: 'replace',
              modification: new LdapAttribute({ type: attrName, values: attrValues }),
            }));
          }
        }

        const timeout = setTimeout(() => {
          reject(new Error('Modify operation timeout'));
        }, 5000);

        client.modify(dn, modifications, (err) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            logger.debug(`Modified entry: ${dn}`);
            resolve();
          }
        });
      });
    } catch (error) {
      throw this.handleError(error, 'MODIFY_FAILED');
    } finally {
      this.pool.releaseConnection(client, this.bindDn);
    }
  }

  /**
   * Delete an entry
   */
  async delete(dn: string): Promise<void> {
    const client = await this.pool.getConnection(this.bindDn, this.bindPassword);

    try {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Delete operation timeout'));
        }, 5000);

        client.del(dn, (err) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            logger.debug(`Deleted entry: ${dn}`);
            resolve();
          }
        });
      });
    } catch (error) {
      throw this.handleError(error, 'DELETE_FAILED');
    } finally {
      this.pool.releaseConnection(client, this.bindDn);
    }
  }

  /**
   * Rename an entry (modify RDN)
   */
  async rename(dn: string, newRdn: string, deleteOldRdn: boolean = true): Promise<string> {
    const client = await this.pool.getConnection(this.bindDn, this.bindPassword);

    try {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Rename operation timeout'));
        }, 5000);

        client.modifyDN(dn, newRdn, deleteOldRdn, (err) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            // Calculate new DN
            const parentDn = dn.split(',').slice(1).join(',');
            const newDn = `${newRdn},${parentDn}`;
            logger.debug(`Renamed entry: ${dn} → ${newDn}`);
            resolve(newDn);
          }
        });
      });
    } catch (error) {
      throw this.handleError(error, 'RENAME_FAILED');
    } finally {
      this.pool.releaseConnection(client, this.bindDn);
    }
  }

  /**
   * Get schema from server
   */
  async getSchema(): Promise<any> {
    const client = await this.pool.getConnection(this.bindDn, this.bindPassword);

    try {
      const entries = await this.search({
        baseDn: 'cn=subSchema',
        filter: '(objectClass=*)',
        scope: 'base',
      });

      if (entries.length === 0) {
        throw new LdapError('NO_SUCH_OBJECT', 'Schema not found', 32);
      }

      return entries[0].attributes;
    } catch (error) {
      throw this.handleError(error, 'SCHEMA_FAILED');
    } finally {
      this.pool.releaseConnection(client, this.bindDn);
    }
  }

  /**
   * Test connection
   */
  async testConnection(bindDn?: string, password?: string): Promise<boolean> {
    try {
      const client = await this.pool.getConnection(bindDn, password);
      this.pool.releaseConnection(client, bindDn);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Destroy client and close all connections
   */
  async destroy(): Promise<void> {
    try {
      await this.pool.destroy();
    } catch (error) {
      logger.warn({ error }, 'Error during LDAP client cleanup');
    }
  }

  private attributesToObject(
    attributes: any[]
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const attr of attributes) {
      result[attr.type] = attr.vals.map((v: any) =>
        typeof v === 'string' ? v : v.toString('utf8')
      );
    }
    return result;
  }

  private rawAttributesToObject(
    attributes: any[]
  ): Record<string, Buffer[]> {
    const result: Record<string, Buffer[]> = {};
    for (const attr of attributes) {
      result[attr.type] = attr.buffers || [];
    }
    return result;
  }

  private handleError(error: unknown, defaultCode: string): Error {
    if (error instanceof LdapError) {
      return error;
    }

    if (error instanceof Error) {
      const message = error.message || '';

      // Parse LDAP error code from message if present
      const codeMatch = message.match(/\((\d+)\)/);
      const ldapCode = codeMatch ? parseInt(codeMatch[1], 10) : undefined;

      if (message.includes('Invalid credentials')) {
        return new LdapError('INVALID_CREDENTIALS', 'Invalid LDAP credentials', 49);
      }

      if (message.includes('No such object')) {
        return new LdapError('NO_SUCH_OBJECT', 'LDAP object not found', 32);
      }

      if (message.includes('Already exists')) {
        return new LdapError('ENTRY_ALREADY_EXISTS', 'Entry already exists', 68);
      }

      return new LdapError(defaultCode, message, ldapCode);
    }

    return new LdapError(defaultCode, String(error));
  }
}
