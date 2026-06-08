/**
 * LDAP API Client
 * Wrapper around fetch for communicating with Node.js backend
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    detail?: string;
  };
}

export interface LdapEntry {
  dn: string;
  attributes: Record<string, string[]>;
}

export interface TreeNode {
  dn: string;
  name: string;
  rdn: string;
  hasChildren: boolean;
}

const API_BASE = '/api';

class LdapApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok && response.status !== 401) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request('GET', endpoint);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request('POST', endpoint, body);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request('PUT', endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request('DELETE', endpoint);
  }

  // Convenience methods
  async login(
    ldapUrl: string,
    username: string,
    password: string
  ): Promise<ApiResponse<{ bindDn: string; ldapUrl: string }>> {
    return this.post('/auth/login', {
      ldapUrl,
      username,
      password,
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.post('/auth/logout');
  }

  async getWhoami(): Promise<ApiResponse<{ bindDn: string; ldapUrl: string; savedUrls: string[] }>> {
    return this.get('/auth/whoami');
  }

  async getSavedUrls(): Promise<ApiResponse<{ savedUrls: string[] }>> {
    return this.get('/auth/urls');
  }

  async getEntry(dn: string): Promise<ApiResponse<LdapEntry>> {
    return this.get(`/entry/${encodeURIComponent(dn)}`);
  }

  async getTree(
    baseDn: string,
    scope: 'one' | 'sub' = 'one'
  ): Promise<ApiResponse<TreeNode[]>> {
    const url = `/tree/${encodeURIComponent(baseDn)}?scope=${scope}`;
    return this.get(url);
  }

  async search(
    baseDn: string,
    query: string
  ): Promise<ApiResponse<{ entries: LdapEntry[]; count: number; filter: string }>> {
    const url = `/search?baseDn=${encodeURIComponent(baseDn)}&q=${encodeURIComponent(query)}`;
    return this.get(url);
  }

  async createEntry(
    parentDn: string,
    rdn: string,
    objectClass: string[],
    attributes: Record<string, string | string[]>
  ): Promise<ApiResponse<{ dn: string }>> {
    return this.post(`/entry/${encodeURIComponent(parentDn)}`, {
      rdn,
      objectClass,
      attributes,
    });
  }

  async modifyEntry(
    dn: string,
    attributes: Record<string, string | string[] | null>
  ): Promise<ApiResponse<{ message: string }>> {
    return this.put(`/entry/${encodeURIComponent(dn)}`, { attributes });
  }

  async deleteEntry(dn: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/entry/${encodeURIComponent(dn)}`);
  }

  async renameEntry(dn: string, newRdn: string): Promise<ApiResponse<{ newDn: string }>> {
    return this.post(`/entry/${encodeURIComponent(dn)}/rename`, { newRdn });
  }

  async changePassword(dn: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/entry/${encodeURIComponent(dn)}/change-password`, {
      newPassword,
    });
  }

  async getSchema(): Promise<
    ApiResponse<{
      objectClasses: any[];
      attributeTypes: any[];
      matchingRules: any[];
    }>
  > {
    return this.get('/schema');
  }
}

export const ldapApi = new LdapApiClient();

// Entry type matching the frontend's expected format
export interface Entry {
  dn: string;
  attrs: Record<string, string[]>;
  autoFilled: string[];
  binary: string[];
  changed: string[];
  isNew?: boolean;
}

// Wrapper functions matching the signatures used by editor components.
// These replace the generated SDK functions and use session-cookie auth.

export async function fetchEntry(dn: string): Promise<Entry> {
  const resp = await ldapApi.getEntry(dn);
  if (!resp.success || !resp.data) {
    throw new Error(resp.error?.message || 'Failed to load entry');
  }
  return {
    dn: resp.data.dn,
    attrs: resp.data.attributes,
    autoFilled: [],
    binary: [],
    changed: [],
    isNew: false,
  };
}

export async function saveEntry(
  dn: string,
  attributes: Record<string, string | string[] | null>
): Promise<string[]> {
  const resp = await ldapApi.modifyEntry(dn, attributes);
  if (!resp.success) {
    throw new Error(resp.error?.message || 'Failed to save entry');
  }
  return Object.keys(attributes);
}

export async function createEntry(
  parentDn: string,
  rdn: string,
  objectClass: string[],
  attributes: Record<string, string | string[]>
): Promise<string> {
  const resp = await ldapApi.createEntry(parentDn, rdn, objectClass, attributes);
  if (!resp.success || !resp.data) {
    throw new Error(resp.error?.message || 'Failed to create entry');
  }
  return resp.data.dn;
}

export async function removeEntry(dn: string): Promise<void> {
  const resp = await ldapApi.deleteEntry(dn);
  if (!resp.success) {
    throw new Error(resp.error?.message || 'Failed to delete entry');
  }
}

export async function renameEntry(dn: string, newRdn: string): Promise<string> {
  const resp = await ldapApi.renameEntry(dn, newRdn);
  if (!resp.success || !resp.data) {
    throw new Error(resp.error?.message || 'Failed to rename entry');
  }
  return resp.data.newDn;
}

export async function changeEntryPassword(
  dn: string,
  newPassword: string
): Promise<void> {
  const resp = await ldapApi.changePassword(dn, newPassword);
  if (!resp.success) {
    throw new Error(resp.error?.message || 'Failed to change password');
  }
}

export async function fetchSchema(): Promise<any> {
  const resp = await ldapApi.getSchema();
  if (!resp.success || !resp.data) {
    throw new Error(resp.error?.message || 'Failed to load schema');
  }
  return resp.data;
}

export async function fetchWhoAmI(): Promise<string> {
  const resp = await ldapApi.get<{ bindDn: string }>('/auth/whoami');
  if (!resp.success || !resp.data) {
    throw new Error(resp.error?.message || 'Failed to get user info');
  }
  return resp.data.bindDn;
}
