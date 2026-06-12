<template>
  <input
    ref="inputEl"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    :class="[
      'w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-500 transition-colors duration-150',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
      error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
      disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
    ]"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface Props {
  type?: string;
  placeholder?: string;
  modelValue?: string | number;
  disabled?: boolean;
  error?: boolean;
}

const inputEl = ref<HTMLInputElement>();

withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
  disabled: false,
  error: false,
});

defineEmits<{
  'update:modelValue': [value: string];
}>();

defineExpose({
  focus: () => inputEl.value?.focus(),
});
</script>
