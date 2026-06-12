<template>
  <div
    :class="[
      'fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 z-40',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center justify-between px-6 border-b border-slate-800">
      <h1 class="text-xl font-bold">LDAP UI</h1>
      <button
        v-if="isOpen"
        @click="$emit('toggle')"
        class="md:hidden text-slate-400 hover:text-white"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Navigation Items -->
    <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      <SidebarItem
        v-for="item in navItems"
        :key="item.id"
        :label="item.label"
        :icon="item.icon"
        :active="activeItem === item.id"
        @click="$emit('navigate', item.id)"
      />
    </nav>

    <!-- Footer - User & Logout -->
    <div class="border-t border-slate-800 p-4">
      <button
        @click="$emit('logout')"
        class="w-full flex items-center gap-3 px-4 py-2 rounded-md text-slate-300 hover:bg-slate-800 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </button>
    </div>
  </div>

  <!-- Mobile Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 md:hidden z-30"
    @click="$emit('toggle')"
  />
</template>

<script setup lang="ts">
import SidebarItem from './SidebarItem.vue';

defineProps<{
  isOpen?: boolean;
  activeItem?: string;
}>();

defineEmits<{
  toggle: [];
  navigate: [id: string];
  logout: [];
}>();

const navItems = [
  { id: 'directory', label: 'Directory', icon: '📁' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'schema', label: 'Schema', icon: '⚙️' },
  { id: 'settings', label: 'Settings', icon: '⚡' },
];
</script>
