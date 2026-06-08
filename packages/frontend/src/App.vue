<template>
  <v-app>
    <!-- Login View -->
    <login-view v-if="!authStore.isAuthenticated" />

    <!-- Main App -->
    <template v-else>
      <v-app-bar color="primary" dark>
        <v-app-bar-title>LDAP UI</v-app-bar-title>
        <v-spacer></v-spacer>
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-account</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item title="Logout" @click="authStore.logout"></v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <v-container fluid class="d-flex" style="height: calc(100vh - 64px)">
        <!-- Left sidebar: Tree navigation -->
        <v-navigation-drawer class="mr-4" width="300">
          <v-list>
            <v-list-item title="Directory Tree" prepend-icon="mdi-folder-tree">
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <tree-explorer />
        </v-navigation-drawer>

        <!-- Main content: Entry editor -->
        <v-main>
          <entry-editor />
        </v-main>
      </v-container>
    </template>
  </v-app>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth';
import LoginView from './views/LoginView.vue';
import TreeExplorer from './components/TreeExplorer.vue';
import EntryEditor from './components/EntryEditor.vue';

const authStore = useAuthStore();
</script>

<style scoped>
</style>
