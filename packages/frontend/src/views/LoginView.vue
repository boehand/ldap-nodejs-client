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
                  :items="savedUrls"
                  clearable
                  class="mb-4"
                ></v-text-field>

                <!-- Or show URL list if exists -->
                <v-select
                  v-if="savedUrls.length > 0"
                  v-model="selectedUrl"
                  :items="savedUrls"
                  label="Recent Servers"
                  clearable
                  class="mb-4"
                ></v-select>

                <!-- Username -->
                <v-text-field
                  v-model="username"
                  label="Username"
                  placeholder="admin or cn=admin,dc=example,dc=org"
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

const selectedUrl = ref('');
const username = ref('');
const password = ref('');

onMounted(async () => {
  // Fetch saved URLs on mount
  await authStore.fetchSavedUrls();
});

async function handleLogin() {
  if (!selectedUrl.value || !username.value || !password.value) {
    return;
  }

  await authStore.login(selectedUrl.value, username.value, password.value);

  // Clear form on successful login
  if (authStore.isAuthenticated) {
    username.value = '';
    password.value = '';
  }
}
</script>

<style scoped>
</style>
