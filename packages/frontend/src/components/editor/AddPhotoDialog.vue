<template>
  <modal
    title="Upload photo"
    hide-footer
    :return-to="returnTo"
    :open="modal == 'add-' + attr"
    @shown="upload?.focus()"
    @cancel="emit('update:modal')"
  >
    <input
      name="photo"
      type="file"
      ref="upload"
      @change="onOk"
      :accept="attr == 'jpegPhoto' ? 'image/jpeg' : 'image/*'"
    />
  </modal>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import Modal from "../ui/Modal.vue";
import { ldapApi } from "../../api/ldap-client";

const props = defineProps({
    dn: { type: String, required: true },
    attr: {
      type: String,
      validator: (value: string) =>
        ["jpegPhoto", "thumbnailPhoto"].includes(value),
    },
    modal: String,
    returnTo: String,
  }),
  upload = useTemplateRef("upload"),
  emit = defineEmits<{
    ok: [dn: string, attrs: string[]];
    "update:modal": [];
  }>();

// add an image
async function onOk(evt: Event) {
  const target = evt.target as HTMLInputElement;
  if (!target?.files) return;

  try {
    const formData = new FormData();
    formData.append('blob', target.files[0]!);
    await fetch(`/api/blob/${encodeURIComponent(props.attr!)}/${0}/${encodeURIComponent(props.dn)}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    });
    emit("update:modal");
    emit("ok", props.dn, [props.attr!]);
  } catch (e) {
    // ignore
  }
}
</script>
