import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LdapClient } from '../../ldap/client.js';
import { ValidationError } from '../../utils/errors.js';
import { getLogger } from '../../utils/logger.js';
import type { SearchParams } from '../../types/index.js';

const logger = getLogger();

// Default attributes to search when simple query is used
const DEFAULT_SEARCH_ATTRIBUTES = ['cn', 'gn', 'sn', 'uid', 'ou', 'dc'];

export async function registerSearchRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/search
   * Search LDAP directory
   *
   * Query parameters:
   *   baseDn: search base DN
   *   q: simple search string (searches default attributes)
   *   filter: LDAP filter (alternative to q)
   *   scope: search scope (base, one, sub) [default: sub]
   *   sizeLimit: max results [default: 1000]
   */
  app.get<{
    Querystring: {
      baseDn?: string;
      q?: string;
      filter?: string;
      scope?: 'base' | 'one' | 'sub';
      sizeLimit?: string;
    };
  }>(
    '/api/search',
    { onRequest: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { baseDn, q, filter, scope, sizeLimit } = request.query;

      if (!baseDn) {
        throw new ValidationError('baseDn is required');
      }

      if (!q && !filter) {
        throw new ValidationError('Either q or filter is required');
      }

      const decodedBaseDn = decodeURIComponent(baseDn);
      let searchFilter = filter;

      // If simple query provided, build filter from default attributes
      if (q && !filter) {
        searchFilter = buildSimpleFilter(q);
      }

      if (!searchFilter) {
        throw new ValidationError('No valid search filter');
      }

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        const params: SearchParams = {
          baseDn: decodedBaseDn,
          filter: searchFilter,
          scope: scope || 'sub',
          sizeLimit: sizeLimit ? parseInt(sizeLimit, 10) : 1000,
          attributes: DEFAULT_SEARCH_ATTRIBUTES,
        };

        const entries = await client.search(params);

        logger.info(
          `Search executed: filter="${searchFilter}", found ${entries.length} results`
        );

        reply.code(200).send({
          success: true,
          data: {
            entries,
            count: entries.length,
            filter: searchFilter,
          },
        });
      } finally {
        await client.destroy();
      }
    }
  );

  /**
   * POST /api/search/advanced
   * Advanced search with custom LDAP filter
   */
  app.post<{
    Body: {
      baseDn: string;
      filter: string;
      attributes?: string[];
      scope?: 'base' | 'one' | 'sub';
      sizeLimit?: number;
    };
  }>(
    '/api/search/advanced',
    { onRequest: app.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { baseDn, filter, attributes, scope, sizeLimit } = request.body;

      if (!baseDn || !filter) {
        throw new ValidationError('baseDn and filter are required');
      }

      const client = new LdapClient(request.ldapCreds!.ldapUrl);
      await client.bind(request.ldapCreds!.bindDn, request.ldapCreds!.password);

      try {
        const params: SearchParams = {
          baseDn: decodeURIComponent(baseDn),
          filter,
          scope: scope || 'sub',
          attributes: attributes || DEFAULT_SEARCH_ATTRIBUTES,
          sizeLimit: sizeLimit || 1000,
        };

        const entries = await client.search(params);

        logger.info(`Advanced search: filter="${filter}", found ${entries.length} results`);

        reply.code(200).send({
          success: true,
          data: {
            entries,
            count: entries.length,
          },
        });
      } finally {
        await client.destroy();
      }
    }
  );
}

/**
 * Build LDAP filter from simple search query
 * e.g., "john" -> "|(cn=*john*)(gn=*john*)(sn=*john*)(uid=*john*)"
 * e.g., "cn=john" -> "(cn=*john*)"
 */
function buildSimpleFilter(query: string): string {
  // If query contains '=', assume it's already a filter specification
  if (query.includes('=')) {
    const [attr, value] = query.split('=');
    return buildFilterForAttribute(attr.trim(), value.trim());
  }

  // Otherwise, search across default attributes
  const filters = DEFAULT_SEARCH_ATTRIBUTES.map((attr) =>
    buildFilterForAttribute(attr, query)
  );

  return filters.length === 1 ? filters[0] : `(|${filters.join('')})`;
}

/**
 * Build filter for a single attribute
 * Handles wildcards: * matches any string, ? matches single char
 */
function buildFilterForAttribute(attribute: string, value: string): string {
  // Escape special LDAP characters except * and ?
  let escapedValue = value
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\x00/g, '\\00');

  // Restore wildcards
  escapedValue = escapedValue
    .replace(/\*|\\\*(\w)/g, (match) => {
      if (match === '*') return '*';
      return '*'; // Convert \\2a back to *
    })
    .replace(/\?/g, '_');

  // If no wildcards, add prefix/suffix
  if (!value.includes('*') && !value.includes('?')) {
    return `(${attribute}=*${escapedValue}*)`;
  }

  return `(${attribute}=${value})`;
}
