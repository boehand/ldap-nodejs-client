<template>
  <Transition name="fade-popover">
    <div
      v-if="open"
      class="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-max"
    >
      <ul class="py-1">
        <slot></slot>
      </ul>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  open?: boolean;
}>();

defineEmits<{
  opened: [];
  closed: [];
  'update:open': [];
}>();
</script>

<style scoped>
.fade-popover-enter-active,
.fade-popover-leave-active {
  transition: opacity 0.15s ease;
}

.fade-popover-enter-from,
.fade-popover-leave-to {
  opacity: 0;
}
</style>
