<template>
  <Modal
    :open="modal == 'change-password'"
    :return-to="returnTo"
    title="Change Password"
    cancel-title="Cancel"
    ok-title="Update Password"
    @show="init"
    @shown="focus"
    @ok="onOk"
    @cancel="emit('update:modal')"
    @hidden="emit('update-form')"
  >
    <!-- Old Password (if exists) -->
    <div v-if="oldExists" class="space-y-2">
      <FormGroup
        label="Current Password"
        :required="currentUser"
        :hint="currentUser ? 'Required to change your own password' : 'Optional for administrative changes'"
      >
        <div class="flex gap-2">
          <Input
            ref="old"
            v-model="oldPassword"
            type="password"
            placeholder="Enter current password"
            class="flex-1"
            @change="check"
          />
          <div v-if="passwordOk !== undefined" class="flex items-center">
            <svg
              v-if="passwordOk"
              class="w-5 h-5 text-emerald-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
      </FormGroup>
    </div>

    <!-- New Password -->
    <FormGroup label="New Password" :required="true">
      <Input
        ref="changed"
        v-model="newPassword"
        type="password"
        placeholder="Enter new password"
      />
    </FormGroup>

    <!-- Confirm Password -->
    <FormGroup
      label="Confirm Password"
      :required="true"
      :error="repeated && !passwordsMatch ? 'Passwords do not match' : ''"
    >
      <Input
        v-model="repeated"
        type="password"
        placeholder="Repeat new password"
        @keyup.enter="onOk"
      />
    </FormGroup>

    <!-- Password Requirements -->
    <Alert variant="info" class="mt-4">
      <small class="text-xs">
        Passwords should be at least 8 characters long and contain a mix of uppercase, lowercase, and numbers for security.
      </small>
    </Alert>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import Modal from "../ui/Modal.vue";
import Input from "../ui/Input.vue";
import FormGroup from "../ui/FormGroup.vue";
import Alert from "../ui/Alert.vue";
import { fetchWhoAmI, ldapApi } from "../../api/ldap-client";
import type { Entry } from "../../api/ldap-client";

const props = defineProps<{
    entry: Entry;
    modal?: string;
    returnTo?: string;
  }>(),
  oldPassword = ref(""),
  newPassword = ref(""),
  repeated = ref(""),
  passwordOk = ref<boolean>(),
  user = ref<string | null>(null),
  old = useTemplateRef("old"),
  changed = useTemplateRef("changed"),
  currentUser = computed(() => user.value == props.entry.dn),
  passwordsMatch = computed(
    () => newPassword.value && newPassword.value == repeated.value,
  ),
  oldExists = computed(
    () =>
      !!props.entry.attrs.userPassword &&
      props.entry.attrs.userPassword[0] != "",
  ),
  emit = defineEmits<{
    ok: [oldPw: string, newPw: string];
    "update-form": [];
    "update:modal": [];
  }>();

async function init() {
  oldPassword.value = newPassword.value = repeated.value = "";
  passwordOk.value = undefined;

  try {
    user.value = await fetchWhoAmI();
  } catch {
    // ignore
  }
}

function focus() {
  if (oldExists.value) {
    const el = old.value as any;
    el?.focus?.();
  } else {
    const el = changed.value as any;
    el?.focus?.();
  }
}

// Verify an existing password
// This is optional for administrative changes
// but required to change the current user's password
async function check() {
  if (!oldPassword.value || oldPassword.value.length == 0) {
    passwordOk.value = undefined;
    return;
  }
  try {
    const resp = await ldapApi.post<{ valid: boolean }>(`/entry/${encodeURIComponent(props.entry.dn)}/check-password`, {
      password: oldPassword.value,
    });
    passwordOk.value = resp.success && resp.data?.valid === true;
  } catch {
    passwordOk.value = false;
  }
}

async function onOk() {
  // old and new passwords are required for current user
  // new passwords must match
  if (
    (currentUser.value && !newPassword.value) ||
    newPassword.value != repeated.value ||
    (currentUser.value && oldExists.value && !passwordOk.value)
  )
    return;

  emit("update:modal");
  emit("ok", oldPassword.value, newPassword.value);
}
</script>
