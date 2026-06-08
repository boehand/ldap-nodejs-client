import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import '../../types/index.js';
import { LdapClient } from '../../ldap/client.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { getLogger } from '../../utils/logger.js';
import type { SearchParams } from '../../types/index.js';

const logger = getLogger();

interface TreeNode {
  dn: string;
  name: string;
  rdn: string;
  hasChildren: boolean;
}

export async function registerTreeRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/tree/:baseDn
   * Get directory tree (immediate children)
   */
  app.get<{
    Params: { baseDn: string };
    Querystring: { scope?: 'one' | 'sub' };
  }>(
    '/api/tree/:baseDn',
    async (request, reply) => {
      const { baseDn } = request.params;
      const scope = request.query.scope || 'one';
      const decodedBaseDn = decodeURIComponent(baseDn);

      // Allow anonymous access for login screen
      const useAuth = !!request.ldapCreds;
      const client = new LdapClient(request.session?.ldapUrl || '');

      if (useAuth) {
        await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);
      }

      try {
        const params: SearchParams = {
          baseDn: decodedBaseDn,
          filter: '(objectClass=*)',
          scope: scope as 'one' | 'sub',
          attributes: ['objectClass', 'cn', 'ou', 'dc'],
        };

        const entries = await client.search(params);

        // Filter out the base DN itself (only keep children)
        const children = entries.filter((e) => e.dn.toLowerCase() !== decodedBaseDn.toLowerCase());

        // Check if each entry has children
        const nodes: TreeNode[] = [];
        for (const entry of children) {
          const dn = entry.dn;
          const rdn = extractRdn(dn);

          // To determine if it has children, do a one-level search
          const hasChildrenParams: SearchParams = {
            baseDn: dn,
            filter: '(objectClass=*)',
            scope: 'one',
            sizeLimit: 1,
          };

          let hasChildren = false;
          try {
            const childEntries = await client.search(hasChildrenParams);
            hasChildren = childEntries.length > 0;
          } catch {
            // Ignore errors when checking for children
          }

          nodes.push({
            dn,
            name: extractName(rdn),
            rdn,
            hasChildren,
          });
        }

        reply.code(200).send({
          success: true,
          data: nodes,
        });
      } finally {
        await client.destroy();
      }
    }
  );

  /**
   * GET /api/tree/root
   * Get root DSE (directory root)
   */
  app.get('/api/tree/root', async (request, reply) => {
    // Allow anonymous access
    const client = new LdapClient(request.session?.ldapUrl || '');

    try {
      // Search root DSE
      const params: SearchParams = {
        baseDn: '',
        filter: '(objectClass=*)',
        scope: 'base',
      };

      const entries = await client.search(params);
      const rootDse = entries[0];

      // Extract naming contexts
      const namingContexts: string[] = (
        rootDse?.attributes?.namingContexts || []
      ).filter((dn: string) => dn && dn.trim());

      reply.code(200).send({
        success: true,
        data: {
          namingContexts,
          rootDse: rootDse?.attributes || {},
        },
      });
    } finally {
      await client.destroy();
    }
  });
}

/**
 * Extract RDN from DN
 * e.g., "uid=admin,dc=example,dc=org" -> "uid=admin"
 */
function extractRdn(dn: string): string {
  return dn.split(',')[0].trim();
}

/**
 * Extract friendly name from RDN
 * e.g., "uid=admin" -> "admin", "ou=people" -> "people"
 */
function extractName(rdn: string): string {
  const parts = rdn.split('=');
  if (parts.length === 2) {
    return parts[1].trim();
  }
  return rdn;
}
