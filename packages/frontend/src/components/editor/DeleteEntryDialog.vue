<template>
  <modal title="Are you sure?" :open="modal == 'delete-entry'" :return-to="returnTo" cancel-classes="bg-primary/80"
    ok-classes="bg-danger/80" @show="init" @shown="onShown" @ok="onOk" @cancel="emit('update:modal')">
    <p class="strong">This action is irreversible.</p>

    <div v-if="subtree.length">
      <p class="text-danger mb-2">
        The following child nodes will be also deleted:
      </p>
      <div v-for="node in subtree" :key="node.dn">
        <span v-for="i in level(node)" class="ml-6" :key="i"></span>
        <node-label dn="" :oc="node.structuralObjectClass">
          {{ node.dn.split(",")[0] }}
        </node-label>
      </div>
    </div>

    <template #modal-ok> <i class="fa fa-trash-o fa-lg"></i> Delete </template>
  </modal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { DN } from "../schema/schema";
import Modal from "../ui/Modal.vue";
import NodeLabel from "../NodeLabel.vue";
import { ldapApi } from "../../api/ldap-client";

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
