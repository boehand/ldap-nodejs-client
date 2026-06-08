import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LdapClient } from '../../ldap/client.js';
import { getLogger } from '../../utils/logger.js';
import type { SearchParams } from '../../types/index.js';

const logger = getLogger();

export async function registerSchemaRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/schema
   * Get LDAP schema
   */
  app.get('/api/schema', async (request: FastifyRequest, reply: FastifyReply) => {
    // Allow anonymous access for login screen
    const useAuth = !!request.ldapCreds;
    const ldapUrl = request.ldapCreds?.ldapUrl || request.session?.ldapUrl;

    if (!ldapUrl) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'NO_LDAP_URL',
          message: 'No LDAP URL available',
        },
      });
    }

    const client = new LdapClient(ldapUrl);

    if (useAuth) {
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);
    }

    try {
      // Try to fetch schema from subschema subentry
      const schemaParams: SearchParams = {
        baseDn: 'cn=subSchema',
        filter: '(objectClass=subSchema)',
        scope: 'base',
      };

      const entries = await client.search(schemaParams);

      if (entries.length === 0) {
        // Return minimal schema if not found
        return reply.code(200).send({
          success: true,
          data: {
            objectClasses: [],
            attributeTypes: [],
            matchingRules: [],
          },
        });
      }

      const schema = entries[0];
      const attributes = schema.attributes || {};

      // Parse object classes and attributes
      const objectClasses = parseObjectClasses(
        attributes.objectClasses || []
      );
      const attributeTypes = parseAttributeTypes(
        attributes.attributeTypes || []
      );
      const matchingRules = attributes.matchingRules || [];

      logger.debug(
        `Schema loaded: ${objectClasses.length} objectClasses, ${attributeTypes.length} attributeTypes`
      );

      reply.code(200).send({
        success: true,
        data: {
          objectClasses,
          attributeTypes,
          matchingRules,
        },
      });
    } catch (error) {
      logger.warn(`Failed to fetch schema: ${error}`);

      // Return empty schema on error
      reply.code(200).send({
        success: true,
        data: {
          objectClasses: [],
          attributeTypes: [],
          matchingRules: [],
        },
      });
    } finally {
      await client.destroy();
    }
  });

  /**
   * GET /api/schema/objectClass/:name
   * Get details for a specific object class
   */
  app.get<{ Params: { name: string } }>(
    '/api/schema/objectClass/:name',
    { onRequest: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name } = request.params;

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        const schemaParams: SearchParams = {
          baseDn: 'cn=subSchema',
          filter: `(objectClasses=*${name}*)`,
          scope: 'base',
        };

        const entries = await client.search(schemaParams);
        const schema = entries[0];
        const objectClasses = parseObjectClasses(
          schema?.attributes?.objectClasses || []
        );

        const objectClass = objectClasses.find(
          (oc: any) => oc.name?.toLowerCase() === name.toLowerCase()
        );

        if (!objectClass) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Object class not found: ${name}`,
            },
          });
        }

        reply.code(200).send({
          success: true,
          data: objectClass,
        });
      } finally {
        await client.destroy();
      }
    }
  );

  /**
   * GET /api/schema/attributeType/:name
   * Get details for a specific attribute type
   */
  app.get<{ Params: { name: string } }>(
    '/api/schema/attributeType/:name',
    { onRequest: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name } = request.params;

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        const schemaParams: SearchParams = {
          baseDn: 'cn=subSchema',
          filter: `(attributeTypes=*${name}*)`,
          scope: 'base',
        };

        const entries = await client.search(schemaParams);
        const schema = entries[0];
        const attributeTypes = parseAttributeTypes(
          schema?.attributes?.attributeTypes || []
        );

        const attributeType = attributeTypes.find(
          (at: any) => at.name?.toLowerCase() === name.toLowerCase()
        );

        if (!attributeType) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Attribute type not found: ${name}`,
            },
          });
        }

        reply.code(200).send({
          success: true,
          data: attributeType,
        });
      } finally {
        await client.destroy();
      }
    }
  );
}

/**
 * Parse objectClasses from schema
 * Very basic parser - real implementation would parse OID definitions
 */
function parseObjectClasses(classes: string[]): any[] {
  return classes.map((classStr) => {
    const match = classStr.match(/\(\s*(\S+)\s+NAME\s+'([^']+)'/);
    if (match) {
      return {
        oid: match[1],
        name: match[2],
        raw: classStr,
      };
    }
    return { raw: classStr };
  });
}

/**
 * Parse attributeTypes from schema
 * Very basic parser - real implementation would parse OID definitions
 */
function parseAttributeTypes(types: string[]): any[] {
  return types.map((typeStr) => {
    const match = typeStr.match(/\(\s*(\S+)\s+NAME\s+'([^']+)'/);
    const singleValueMatch = typeStr.match(/SINGLE-VALUE/i);

    if (match) {
      return {
        oid: match[1],
        name: match[2],
        singleValue: !!singleValueMatch,
        raw: typeStr,
      };
    }
    return { singleValue: !!singleValueMatch, raw: typeStr };
  });
}
