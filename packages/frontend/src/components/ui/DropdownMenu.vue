<template>
  <div class="relative inline-block text-left">
    <button
      type="button"
      class="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
      :aria-expanded="open"
      aria-haspopup="true"
      @click.stop="open = !open"
    >
      <slot name="button-content">
        {{ title }}
      </slot>
      <svg
        class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': open }"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <Transition name="scale-dropdown">
      <div
        v-if="open"
        class="absolute right-0 mt-2 min-w-max bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        @click.stop="handleMenuClick"
        @keydown.esc="open = false"
      >
        <ul class="py-1">
          <slot></slot>
        </ul>
      </div>
    </Transition>

    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const open = ref(false);
defineProps<{ title?: string }>();

function handleMenuClick(event: Event) {
  if ((event.target as HTMLElement).closest('li, button, a')) {
    open.value = false;
  }
}
</script>

<style scoped>
.scale-dropdown-enter-active,
.scale-dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.scale-dropdown-enter-from,
.scale-dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
