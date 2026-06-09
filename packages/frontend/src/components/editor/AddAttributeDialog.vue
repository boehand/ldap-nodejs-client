<template>
  <modal
    title="Add attribute"
    :open="modal == 'add-attribute'"
    :return-to="props.returnTo"
    @show="attr = undefined"
    @shown="select?.focus()"
    @ok="onOk"
    @cancel="emit('update:modal')"
  >
    <div v-if="available.length > 0">
      <select v-model="attr" ref="select" @keyup.enter="onOk">
        <option v-for="a in available" :key="a">{{ a }}</option>
      </select>
    </div>
    <div v-else>
      <input v-model="attr" ref="select" type="text" placeholder="Attribute name (e.g. mail, telephoneNumber)"
        class="w-full border border-gray-300 rounded px-2 py-1" @keyup.enter="onOk" />
    </div>
  </modal>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import Modal from "../ui/Modal.vue";
import type { Entry } from "../../api/ldap-client";

const props = defineProps<{
    entry: Entry;
    attributes: string[];
    modal?: string;
    returnTo?: string;
  }>(),
  attr = ref<string>(),
  select = useTemplateRef("select"),
  available = computed(() =>
    // Choice list for new attribute selection popup
    props.attributes.filter(
      (attr) => !Object.keys(props.entry.attrs).includes(attr),
    ),
  ),
  emit = defineEmits<{
    ok: [attr: string];
    "show-modal": [name: string];
    "update:modal": [name?: string];
  }>();

// Add the selected attribute
function onOk() {
  if (!attr.value) return;

  if (attr.value == "jpegPhoto" || attr.value == "thumbnailPhoto") {
    emit("show-modal", "add-" + attr.value);
    return;
  }

  if (attr.value == "userPassword") {
    emit("show-modal", "change-password");
    return;
  }

  emit("update:modal");
  emit("ok", attr.value);
}
</script>
