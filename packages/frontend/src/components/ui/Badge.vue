<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusClass]">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface Props {
  status?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
}

const props = withDefaults(defineProps<Props>(), {
  status: 'neutral',
});

const statusClass = computed(() => {
  switch (props.status) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'warning':
      return 'bg-amber-100 text-amber-800';
    case 'info':
      return 'bg-blue-100 text-blue-800';
    case 'neutral':
    default:
      return 'bg-gray-100 text-gray-800';
  }
});
</script>
