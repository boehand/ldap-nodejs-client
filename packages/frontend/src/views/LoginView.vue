<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <!-- Main Card -->
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">LDAP UI</h1>
        <p class="text-gray-600">Directory Management Console</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <!-- Card Header -->
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 class="text-lg font-semibold text-gray-900">Sign In</h2>
        </div>

        <!-- Card Body -->
        <form @submit.prevent="handleLogin" class="p-6 space-y-4">
          <!-- Error Alert -->
          <div
            v-if="authStore.error"
            class="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-red-800">{{ authStore.error }}</p>
              </div>
              <button
                type="button"
                @click="authStore.error = null"
                class="text-red-400 hover:text-red-600"
              >
                <span class="text-xl">×</span>
              </button>
            </div>
          </div>

          <!-- LDAP Server URL -->
          <div>
            <label for="url" class="block text-sm font-medium text-gray-900 mb-1">
              LDAP Server URL
            </label>
            <input
              id="url"
              v-model="selectedUrl"
              type="url"
              placeholder="ldap://localhost:389"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p class="mt-1 text-xs text-gray-500">e.g., ldap://ldap.example.com:389</p>
          </div>

          <!-- Recent Servers Dropdown -->
          <div v-if="authStore.savedUrls.length > 0">
            <label for="recent" class="block text-sm font-medium text-gray-900 mb-1">
              Or Select Recent Server
            </label>
            <select
              id="recent"
              v-model="selectedUrl"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Choose from recent --</option>
              <option v-for="url in authStore.savedUrls" :key="url" :value="url">
                {{ url }}
              </option>
            </select>
          </div>

          <!-- Base DN -->
          <div>
            <label for="baseDn" class="block text-sm font-medium text-gray-900 mb-1">
              Base DN <span class="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              id="baseDn"
              v-model="baseDn"
              type="text"
              placeholder="dc=example,dc=org"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p class="mt-1 text-xs text-gray-500">Used to locate users when entering a simple username</p>
          </div>

          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-900 mb-1">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="user or uid=user,ou=people,dc=example,dc=org"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-900 mb-1">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="!selectedUrl || !username || !password || authStore.loading"
            :class="[
              'w-full py-2 px-4 rounded-lg font-medium transition-colors',
              authStore.loading || !selectedUrl || !username || !password
                ? 'bg-indigo-300 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
            ]"
          >
            <span v-if="authStore.loading" class="inline-block">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Card Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p class="text-xs text-gray-600 text-center">
            No credentials? Ask your LDAP administrator
          </p>
        </div>
      </div>

      <!-- Footer Text -->
      <p class="text-center text-sm text-gray-600 mt-6">
        Secure LDAP Directory Management
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const selectedUrl = ref(localStorage.getItem('ldap-url') || '');
const baseDn = ref(localStorage.getItem('ldap-baseDn') || '');
const username = ref('');
const password = ref('');

onMounted(async () => {
  await authStore.fetchSavedUrls();
});

async function handleLogin() {
  if (!selectedUrl.value || !username.value || !password.value) {
    return;
  }

  localStorage.setItem('ldap-url', selectedUrl.value);
  localStorage.setItem('ldap-baseDn', baseDn.value);

  await authStore.login(selectedUrl.value, username.value, password.value, baseDn.value || undefined);

  if (authStore.isAuthenticated) {
    username.value = '';
    password.value = '';
  }
}
</script>

