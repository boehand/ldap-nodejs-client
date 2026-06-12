<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div v-if="$slots.header" class="px-4 py-3 border-b border-gray-200">
      <slot name="header" />
    </div>

    <div class="p-4">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-4 py-3 border-t border-gray-200 bg-gray-50">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Pure presentational component with header, body, and footer slots
</script>
