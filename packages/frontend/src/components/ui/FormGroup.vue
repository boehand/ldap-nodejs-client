<template>
  <div class="space-y-1">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-900">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <slot />

    <p v-if="hint" class="text-xs text-gray-600">{{ hint }}</p>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  id?: string;
}>();
</script>
