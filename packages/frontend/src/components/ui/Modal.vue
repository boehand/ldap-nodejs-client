<template>
  <Teleport to="body">
    <Transition name="fade-modal" :appear="true">
      <div v-if="open" class="fixed inset-0 bg-black/60 transition-opacity z-40" />
    </Transition>

    <Transition name="scale-modal" :appear="true">
      <div
        v-if="open"
        class="fixed inset-0 flex items-center justify-center z-50 p-4"
        @click.self="onCancel"
        @keydown.esc="onCancel"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">
              <slot name="header">{{ title }}</slot>
            </h2>
            <button
              type="button"
              @click="onCancel"
              class="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <span class="text-2xl">×</span>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-4 space-y-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="!hideFooter" class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <slot name="footer">
              <button
                type="button"
                @click="onCancel"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <slot name="modal-cancel">{{ cancelTitle }}</slot>
              </button>
              <button
                type="button"
                @click.stop="onOk"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <slot name="modal-ok">{{ okTitle }}</slot>
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps({
  title: { type: String },
  open: { type: Boolean, required: true },
  okTitle: { type: String, default: 'OK' },
  cancelTitle: { type: String, default: 'Cancel' },
  hideFooter: { type: Boolean, default: false },
  returnTo: String,
});

const emit = defineEmits<{
  ok: [];
  cancel: [];
  show: [];
  shown: [];
  hide: [];
  hidden: [];
}>();

function onOk() {
  if (props.open) emit('ok');
}

function onCancel() {
  if (props.open) {
    if (props.returnTo) document.getElementById(props.returnTo)?.focus();
    emit('cancel');
  }
}
</script>

<style scoped>
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.scale-modal-enter-active,
.scale-modal-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.scale-modal-enter-from,
.scale-modal-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
