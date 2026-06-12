<template>
  <button
    :class="[
      'w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
      active
        ? 'bg-indigo-600 text-white'
        : 'text-slate-300 hover:bg-slate-800 active:bg-slate-700'
    ]"
    v-bind="$attrs"
  >
    <span class="text-lg">{{ icon }}</span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  icon: string;
  active?: boolean;
}>();
</script>
