import { FastifyInstance } from 'fastify';
import { LdapClient } from '../../ldap/client.js';
import { decryptPassword } from '../../utils/crypto.js';
import { NotFoundError, ValidationError, LdapError } from '../../utils/errors.js';
import { getLogger } from '../../utils/logger.js';
import '../../types/index.js';

const logger = getLogger();

export async function registerEntryRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/entry/:dn
   * Get a single entry
   */
  app.get<{ Params: { dn: string } }>(
    '/api/entry/:dn',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const { dn } = request.params;
      const decodedDn = decodeURIComponent(dn);

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        const entry = await client.getEntry(decodedDn);
        const { rawAttributes, ...entryData } = entry;
        reply.code(200).send({
          success: true,
          data: entryData,
        });
      } finally {
        await client.destroy();
      }
    }
  );

  /**
   * POST /api/entry/:parentDn
   * Create a new entry
   */
  app.post<{
    Params: { parentDn: string };
    Body: { rdn: string; objectClass: string[]; attributes: Record<string, string | string[]> };
  }>(
    '/api/entry/:parentDn',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const { parentDn } = request.params;
      const { rdn, objectClass, attributes } = request.body;
      const decodedParentDn = decodeURIComponent(parentDn);

      if (!rdn || !objectClass || !attributes) {
        throw new ValidationError('Missing required fields: rdn, objectClass, attributes');
      }

      const newDn = `${rdn},${decodedParentDn}`;

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        const entry = {
          objectClass,
          ...attributes,
        };

        await client.add(newDn, entry);
        logger.info(`Entry created: ${newDn}`);

        reply.code(201).send({
          success: true,
          data: { dn: newDn },
        });
      } finally {
        await client.destroy();
      }
    }
  );

  /**
   * PUT /api/entry/:dn
   * Modify an entry
   */
  app.put<{
    Params: { dn: string };
    Body: { attributes: Record<string, string | string[] | null> };
  }>(
    '/api/entry/:dn',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const { dn } = request.params;
      const { attributes } = request.body;
      const decodedDn = decodeURIComponent(dn);

      if (!attributes || Object.keys(attributes).length === 0) {
        throw new ValidationError('No attributes to modify');
      }

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        await client.modify(decodedDn, attributes);
        logger.info(`Entry modified: ${decodedDn}`);

        reply.code(200).send({
          success: true,
          data: { message: 'Entry modified' },
        });
      } finally {
        await client.destroy();
      }
    }
  );

  /**
   * DELETE /api/entry/:dn
   * Delete an entry
   */
  app.delete<{ Params: { dn: string } }>(
    '/api/entry/:dn',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const { dn } = request.params;
      const decodedDn = decodeURIComponent(dn);

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        await client.delete(decodedDn);
        logger.info(`Entry deleted: ${decodedDn}`);

        reply.code(200).send({
          success: true,
          data: { message: 'Entry deleted' },
        });
      } finally {
        await client.destroy();
      }
    }
  );

  /**
   * POST /api/entry/:dn/rename
   * Rename an entry (modify RDN)
   */
  app.post<{
    Params: { dn: string };
    Body: { newRdn: string };
  }>(
    '/api/entry/:dn/rename',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const { dn } = request.params;
      const { newRdn } = request.body;
      const decodedDn = decodeURIComponent(dn);

      if (!newRdn) {
        throw new ValidationError('newRdn is required');
      }

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        const newDn = await client.rename(decodedDn, newRdn);
        logger.info(`Entry renamed: ${decodedDn} → ${newDn}`);

        reply.code(200).send({
          success: true,
          data: { newDn },
        });
      } finally {
        await client.destroy();
      }
    }
  );

  /**
   * POST /api/entry/:dn/change-password
   * Change user password
   */
  app.post<{
    Params: { dn: string };
    Body: { oldPassword?: string; newPassword: string };
  }>(
    '/api/entry/:dn/change-password',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const { dn } = request.params;
      const { newPassword } = request.body;
      const decodedDn = decodeURIComponent(dn);

      if (!newPassword) {
        throw new ValidationError('newPassword is required');
      }

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        // Set userPassword attribute
        await client.modify(decodedDn, {
          userPassword: newPassword,
        });

        logger.info(`Password changed for: ${decodedDn}`);

        reply.code(200).send({
          success: true,
          data: { message: 'Password changed' },
        });
      } finally {
        await client.destroy();
      }
    }
  );
}
