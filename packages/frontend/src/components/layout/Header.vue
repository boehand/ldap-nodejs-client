<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
    <div class="h-16 px-6 flex items-center justify-between">
      <!-- Left: Menu Toggle -->
      <button
        v-if="showMenuToggle"
        @click="$emit('toggle-sidebar')"
        class="md:hidden text-gray-500 hover:text-gray-700 mr-4"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Center: Breadcrumb/Title -->
      <div class="flex-1 min-w-0">
        <div class="text-sm text-gray-500">
          <span v-if="breadcrumbs" class="flex items-center gap-2">
            <span v-for="(crumb, idx) in breadcrumbs" :key="idx" class="flex items-center gap-2">
              <span v-if="idx > 0" class="text-gray-300">/</span>
              <span>{{ crumb }}</span>
            </span>
          </span>
          <span v-else>Directory</span>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-4">
        <!-- User Menu -->
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
              {{ userInitials }}
            </div>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <Transition name="fade-dropdown">
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
            >
              <div class="p-4 border-b border-gray-200">
                <p class="text-sm font-medium text-gray-900">{{ userName || 'User' }}</p>
                <p class="text-xs text-gray-500">{{ userEmail || 'user@example.com' }}</p>
              </div>
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>

  <!-- Menu Backdrop -->
  <div
    v-if="showUserMenu"
    class="fixed inset-0 z-40"
    @click="showUserMenu = false"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  userName?: string;
  userEmail?: string;
  breadcrumbs?: string[];
  showMenuToggle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showMenuToggle: true,
});

const emit = defineEmits<{
  'toggle-sidebar': [];
  logout: [];
}>();

const showUserMenu = ref(false);

const userInitials = computed(() => {
  if (!props.userName) return 'U';
  return props.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

function handleLogout() {
  showUserMenu.value = false;
  emit('logout');
}
</script>

<style scoped>
.fade-dropdown-enter-active,
.fade-dropdown-leave-active {
  transition: opacity 0.15s ease;
}

.fade-dropdown-enter-from,
.fade-dropdown-leave-to {
  opacity: 0;
}
</style>
