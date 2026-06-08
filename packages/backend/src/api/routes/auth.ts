import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LdapClient } from '../../ldap/client.js';
import { encryptPassword, decryptPassword } from '../../utils/crypto.js';
import { AuthenticationError, ValidationError } from '../../utils/errors.js';
import { getLogger } from '../../utils/logger.js';
import type { LdapSession } from '../../types/index.js';

const logger = getLogger();

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/auth/login
   * Login with LDAP credentials
   */
  app.post<{
    Body: { ldapUrl: string; username: string; password: string };
  }>('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ldapUrl, username, password } = request.body;

    if (!ldapUrl || !username || !password) {
      throw new ValidationError(
        'Missing required fields: ldapUrl, username, password'
      );
    }

    try {
      // Test LDAP connection and bind
      const client = new LdapClient(ldapUrl);

      // If username looks like a full DN, use it directly
      // Otherwise, construct DN from username
      let bindDn = username;
      if (!username.includes('=')) {
        // Simple username provided, assume uid=username,... format
        // For now, just use the username as DN suffix
        // Real implementation would search for the user first
        bindDn = `uid=${username},dc=example,dc=org`; // TODO: make configurable
      }

      await client.bind(bindDn, password);
      await client.destroy();

      // Store credentials in encrypted session
      const encryptedPassword = encryptPassword(
        password,
        request.session.id as string
      );
      const now = Date.now();

      request.session.bindDn = bindDn;
      request.session.ldapUrl = ldapUrl;
      request.session.encryptedPassword = encryptedPassword;
      request.session.encryptedAt = now;
      request.session.expiresAt = now + (request.session.id ? 86400000 : 0); // 24h

      // Initialize saved URLs if not present
      if (!request.session.savedUrls) {
        request.session.savedUrls = [];
      }

      // Add URL to history if not already there
      if (!request.session.savedUrls.includes(ldapUrl)) {
        request.session.savedUrls.unshift(ldapUrl);
        // Keep only last 5 URLs
        if (request.session.savedUrls.length > 5) {
          request.session.savedUrls = request.session.savedUrls.slice(0, 5);
        }
      }

      logger.info(`User logged in: ${bindDn}`);

      reply.code(200).send({
        success: true,
        data: {
          bindDn,
          ldapUrl,
        },
      });
    } catch (error) {
      logger.warn(`Login failed for ${username}: ${error}`);
      throw new AuthenticationError(
        `Failed to authenticate with LDAP: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  /**
   * POST /api/auth/logout
   * Logout and clear session
   */
  app.post(
    '/api/auth/logout',
    { onRequest: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      request.session.bindDn = '';
      request.session.ldapUrl = '';
      request.session.encryptedPassword = '';

      logger.info('User logged out');

      reply.code(200).send({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    }
  );

  /**
   * GET /api/auth/whoami
   * Get current user info
   */
  app.get(
    '/api/auth/whoami',
    { onRequest: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.code(200).send({
        success: true,
        data: {
          bindDn: request.session.bindDn,
          ldapUrl: request.session.ldapUrl,
          savedUrls: request.session.savedUrls || [],
        },
      });
    }
  );

  /**
   * GET /api/auth/urls
   * Get list of saved LDAP URLs
   */
  app.get<{ Querystring: { anonymous?: boolean } }>(
    '/api/auth/urls',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Allow anonymous access to get saved URLs (for login screen)
      const savedUrls = request.session?.savedUrls || [];

      reply.code(200).send({
        success: true,
        data: { savedUrls },
      });
    }
  );
}
