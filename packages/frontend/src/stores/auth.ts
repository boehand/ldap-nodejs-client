import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ldapApi } from '../api/ldap-client';

interface AuthState {
  bindDn: string | null;
  ldapUrl: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  savedUrls: string[];
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const bindDn = ref<string | null>(null);
  const ldapUrl = ref<string | null>(null);
  const savedUrls = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!bindDn.value && !!ldapUrl.value);

  // Actions
  async function login(url: string, username: string, password: string, baseDn?: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await ldapApi.post<{ bindDn: string; ldapUrl: string }>('/auth/login', {
        ldapUrl: url,
        username,
        password,
        baseDn,
      });

      if (response.success && response.data) {
        bindDn.value = response.data.bindDn;
        ldapUrl.value = response.data.ldapUrl;

        // Fetch saved URLs
        await fetchSavedUrls();
      } else {
        error.value = response.error?.message || 'Login failed';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed';
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    error.value = null;

    try {
      await ldapApi.post('/auth/logout', {});
      bindDn.value = null;
      ldapUrl.value = null;
      savedUrls.value = [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed';
    } finally {
      loading.value = false;
    }
  }

  async function fetchSavedUrls() {
    try {
      const response = await ldapApi.get<{ savedUrls: string[] }>('/auth/urls');
      if (response.success && response.data?.savedUrls) {
        savedUrls.value = response.data.savedUrls;
      }
    } catch (err) {
      // Silent fail, savedUrls can be empty
    }
  }

  async function checkAuth() {
    try {
      const response = await ldapApi.get<{ bindDn: string; ldapUrl: string; savedUrls: string[] }>('/auth/whoami');
      if (response.success && response.data) {
        bindDn.value = response.data.bindDn;
        ldapUrl.value = response.data.ldapUrl;
        savedUrls.value = response.data.savedUrls || [];
      }
    } catch {
      // Not authenticated
      bindDn.value = null;
      ldapUrl.value = null;
    }
  }

  return {
    // State
    bindDn,
    ldapUrl,
    savedUrls,
    loading,
    error,

    // Computed
    isAuthenticated,

    // Actions
    login,
    logout,
    fetchSavedUrls,
    checkAuth,
  };
});
