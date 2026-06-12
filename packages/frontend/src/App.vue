<template>
  <div v-if="!authStore.isAuthenticated" class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <LoginView />
  </div>

  <div v-else class="flex h-screen bg-gray-50">
    <!-- Sidebar Navigation -->
    <Sidebar
      :is-open="sidebarOpen"
      :active-item="activeNavItem"
      @toggle="sidebarOpen = !sidebarOpen"
      @navigate="activeNavItem = $event"
      @logout="authStore.logout()"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col md:ml-64">
      <!-- Header -->
      <Header
        :show-menu-toggle="true"
        :user-name="currentUser"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
        @logout="authStore.logout()"
      />

      <!-- Main Area -->
      <main class="flex-1 overflow-hidden flex">
        <!-- Tree Explorer Sidebar -->
        <div class="hidden lg:block w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <div class="p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Directory Tree</h3>
            <TreeExplorer @select-dn="activeDn = $event" />
          </div>
        </div>

        <!-- Entry Editor -->
        <div class="flex-1 overflow-y-auto">
          <EntryEditor :active-dn="activeDn" @update:active-dn="activeDn = $event" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { getWhoAmI } from './generated/sdk.gen';
import LoginView from './views/LoginView.vue';
import Sidebar from './components/layout/Sidebar.vue';
import Header from './components/layout/Header.vue';
import TreeExplorer from './components/TreeExplorer.vue';
import EntryEditor from './components/editor/EntryEditor.vue';

const authStore = useAuthStore();
const activeDn = ref<string>();
const sidebarOpen = ref(false);
const activeNavItem = ref('directory');
const currentUser = ref<string | null>(null);

onMounted(async () => {
  try {
    currentUser.value = await getWhoAmI();
  } catch (e) {
    currentUser.value = 'User';
  }
});
</script>

