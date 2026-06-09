<template>
  <v-app>
    <v-container class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="elevation-12">
            <v-toolbar color="primary" dark flat>
              <v-toolbar-title>LDAP Login</v-toolbar-title>
            </v-toolbar>

            <v-card-text class="pt-8">
              <v-form @submit.prevent="handleLogin">
                <!-- LDAP URL Input -->
                <v-text-field
                  v-model="selectedUrl"
                  label="LDAP Server URL"
                  placeholder="ldap://localhost:389"
                  type="url"
                  required
                  clearable
                  class="mb-4"
                ></v-text-field>

                <!-- Or show URL list if exists -->
                <v-select
                  v-if="authStore.savedUrls.length > 0"
                  v-model="selectedUrl"
                  :items="authStore.savedUrls"
                  label="Recent Servers"
                  clearable
                  class="mb-4"
                ></v-select>

                <!-- Base DN -->
                <v-text-field
                  v-model="baseDn"
                  label="Base DN"
                  placeholder="dc=example,dc=org"
                  hint="Used to locate users when entering a simple username"
                  persistent-hint
                  clearable
                  class="mb-4"
                ></v-text-field>

                <!-- Username -->
                <v-text-field
                  v-model="username"
                  label="Username"
                  placeholder="test or uid=test,ou=people,dc=example,dc=org"
                  required
                  class="mb-4"
                ></v-text-field>

                <!-- Password -->
                <v-text-field
                  v-model="password"
                  label="Password"
                  type="password"
                  required
                  class="mb-4"
                ></v-text-field>

                <!-- Error message -->
                <v-alert
                  v-if="authStore.error"
                  type="error"
                  class="mb-4"
                  closable
                  @click:close="authStore.error = null"
                >
                  {{ authStore.error }}
                </v-alert>

                <!-- Submit button -->
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  :loading="authStore.loading"
                  :disabled="!selectedUrl || !username || !password"
                >
                  Login
                </v-btn>
              </v-form>
            </v-card-text>

            <v-card-actions class="pt-0">
              <v-spacer></v-spacer>
              <span class="text-caption text-grey">
                No credentials? Ask your LDAP administrator
              </span>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
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

<style scoped>
</style>
