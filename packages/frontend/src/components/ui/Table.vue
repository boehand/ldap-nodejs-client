<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-50 border-b border-gray-200">
          <th
            v-for="column in columns"
            :key="column.key"
            class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <slot />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
export interface Column {
  key: string;
  label: string;
}

defineProps<{
  columns: Column[];
}>();
</script>
