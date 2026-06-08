import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { decryptPassword } from '../../utils/crypto.js';
import { getLogger } from '../../utils/logger.js';

const logger = getLogger();

/**
 * Authentication guard middleware
 * Verifies that user has a valid session and decrypts LDAP credentials
 */
export async function registerAuthMiddleware(app: FastifyInstance): Promise<void> {
  // Add a custom decorator for authentication check
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.session?.bindDn) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      try {
        // Decrypt password from session
        const password = decryptPassword(
          request.session.encryptedPassword,
          request.session.id
        );

        // Attach decrypted credentials to request
        request.ldapCreds = {
          bindDn: request.session.bindDn,
          password,
          ldapUrl: request.session.ldapUrl,
        };

        logger.debug(`Authenticated as ${request.session.bindDn}`);
      } catch (error) {
        logger.error(error, 'Failed to decrypt session credentials');
        reply.code(401).send({
          success: false,
          error: {
            code: 'SESSION_ERROR',
            message: 'Invalid session credentials',
          },
        });
      }
    }
  );
}

// Extend Fastify instance type
declare global {
  namespace Fastify {
    interface FastifyInstance {
      authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
  }
}
