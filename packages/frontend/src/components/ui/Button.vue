<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150',
      variantClass,
      sizeClass,
      { 'opacity-50 cursor-not-allowed': disabled || loading }
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <slot v-if="!loading" />
    <span v-else class="inline-block animate-spin">⚙</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
});

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800';
    case 'secondary':
      return 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800';
    case 'ghost':
      return 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200';
    default:
      return '';
  }
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-1 text-xs';
    case 'lg':
      return 'px-6 py-3 text-base';
    case 'md':
    default:
      return 'px-4 py-2 text-sm';
  }
});
</script>
