<template>
  <Modal
    :open="modal == 'delete-entry'"
    :return-to="returnTo"
    title="Delete Entry"
    cancel-title="Cancel"
    ok-title="Delete"
    @show="init"
    @shown="onShown"
    @ok="onOk"
    @cancel="emit('update:modal')"
  >
    <!-- Warning Alert -->
    <Alert variant="error" class="mb-4">
      <strong>This action is irreversible.</strong> The entry and all child nodes will be permanently deleted.
    </Alert>

    <!-- Subtree Warning -->
    <div v-if="subtree.length" class="space-y-3">
      <p class="text-sm font-medium text-gray-900">
        The following child nodes will also be deleted:
      </p>
      <div class="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-1">
        <div
          v-for="node in subtree"
          :key="node.dn"
          class="text-sm text-gray-700 flex items-center"
          :style="{ paddingLeft: `${level(node) * 16}px` }"
        >
          <span class="text-gray-500 mr-2">•</span>
          <NodeLabel :dn="node.dn" :oc="node.structuralObjectClass" />
        </div>
      </div>
    </div>

    <!-- Confirmation -->
    <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <p class="text-xs text-amber-800">
        This action cannot be undone. Please ensure you have a backup before proceeding.
      </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { DN } from "../schema/schema";
import Modal from "../ui/Modal.vue";
import Alert from "../ui/Alert.vue";
import NodeLabel from "../NodeLabel.vue";
import { ldapApi, type TreeItem } from "../../api/ldap-client";

const props = defineProps<{
  dn: string;
  modal?: string;
  returnTo?: string;
}>(),
  subtree = ref<any[]>([]),
  emit = defineEmits<{
    ok: [dn: string];
    "update:modal": [];
  }>(),
  rootDn = computed(() => new DN(props.dn));

// List subordinate elements to be deleted
async function init() {
  try {
    const resp = await ldapApi.get<any[]>(`/subtree/${encodeURIComponent(props.dn)}`);
    if (resp.success && resp.data) subtree.value = resp.data;
  } catch (e) {
    // ignore
  }
}

function level(item: TreeItem): number {
  return new DN(item.dn).level - rootDn.value.level - 1;
}

function onShown() {
  document.getElementById("ui-modal-ok")?.focus();
}

function onOk() {
  emit("update:modal");
  emit("ok", props.dn);
}
</script>
