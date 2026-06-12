<template>
  <div v-if="entry" class="rounded border border-front/20 mb-3 mx-4 flex-auto">
    <!-- Modals for navigation menu -->
    <new-entry-dialog v-model:modal="modal" :dn="entry.dn" :return-to="focused" @ok="newEntry" />
    <copy-entry-dialog v-model:modal="modal" :entry="entry" :return-to="focused" @ok="newEntry" />
    <rename-entry-dialog v-model:modal="modal" :entry="entry" :return-to="focused" @ok="renameEntry" />
    <delete-entry-dialog v-model:modal="modal" :dn="entry.dn" :return-to="focused" @ok="deleteEntryByDn" />
    <discard-entry-dialog v-model:modal="modal" :dn="props.activeDn" :return-to="focused" @ok="discardEntry"
      @shown="emit('update:activeDn')" />

    <!-- Modals for main editing area -->
    <password-change-dialog v-model:modal="modal" :entry="entry" :return-to="focused" @ok="changePassword" />
    <add-photo-dialog v-model:modal="modal" attr="jpegPhoto" :dn="entry.dn" :return-to="focused" @ok="load" />
    <add-photo-dialog v-model:modal="modal" attr="thumbnailPhoto" :dn="entry.dn" :return-to="focused" @ok="load" />
    <add-object-class-dialog v-model:modal="modal" :entry="entry" :return-to="focused" @ok="addObjectClass" />

    <!-- Modals for footer -->
    <add-attribute-dialog v-model:modal="modal" :entry="entry" :attributes="attributes('may')" :return-to="focused"
      @ok="addAttribute" @show-modal="modal = $event" />

    <!-- Header with Entry Name and Actions -->
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
      <div class="flex-1">
        <h2 class="text-lg font-semibold text-gray-900">
          <node-label :dn="entry.dn" :oc="structural" />
        </h2>
        <p class="text-sm text-gray-600 mt-1">{{ entry.dn }}</p>
      </div>

      <!-- Action Menu -->
      <div class="flex items-center gap-2">
        <dropdown-menu v-if="!entry.isNew" title="Actions">
          <li @click="modal = 'new-entry'" role="menuitem" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Add child…
          </li>
          <li @click="modal = 'copy-entry'" role="menuitem" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Copy…
          </li>
          <li @click="modal = 'rename-entry'" role="menuitem" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Rename…
          </li>
          <li role="menuitem" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            <a :href="'api/ldif/' + entry.dn">Export</a>
          </li>
          <li @click="modal = 'delete-entry'" role="menuitem" class="px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer border-t border-gray-200">
            Delete…
          </li>
        </dropdown-menu>

        <!-- Close Button -->
        <button
          @click="entry.isNew ? (modal = 'discard-entry') : emit('update:activeDn')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <form id="entry" class="space-y-4 my-4" @submit.prevent="save" @reset="load(entry!.dn, undefined, undefined)"
      @focusin="onFocus">
      <attribute-row v-for="key in keys" :key="key" :base-dn="props.baseDn" :attr="attrForKey(key)"
        :entry="entry" :values="entry.attrs[key]!" :changed="hasChanged(key)" :may="attributes('may').includes(key)"
        :must="attributes('must').includes(key)" @update="updateRow" @reload-form="load" @valid="valid(key, $event)"
        @show-modal="modal = $event" @show-attr="emit('show-attr', $event)" @show-oc="emit('show-oc', $event)" />

      <!-- Footer with buttons -->
      <div class="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
        <button
          type="reset"
          v-if="!entry.isNew"
          accesskey="r"
          tabindex="0"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
        <button
          v-if="!entry.isNew"
          @click.prevent="modal = 'add-attribute'"
          accesskey="a"
          tabindex="0"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Add attribute…
        </button>
        <button
          type="submit"
          tabindex="0"
          accesskey="s"
          :disabled="invalid.length != 0"
          :class="[
            'px-4 py-2 rounded-md font-medium transition-colors',
            invalid.length !== 0
              ? 'bg-indigo-300 text-white cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          ]"
        >
          Save Changes
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import AddAttributeDialog from "./AddAttributeDialog.vue";
import AddObjectClassDialog from "./AddObjectClassDialog.vue";
import AddPhotoDialog from "./AddPhotoDialog.vue";
import AttributeRow from "./AttributeRow.vue";
import CopyEntryDialog from "./CopyEntryDialog.vue";
import DeleteEntryDialog from "./DeleteEntryDialog.vue";
import DiscardEntryDialog from "./DiscardEntryDialog.vue";
import DropdownMenu from "../ui/DropdownMenu.vue";
import type { Entry } from "../../api/ldap-client";
import { fetchEntry, saveEntry, removeEntry, renameEntry as apiRenameEntry, changeEntryPassword } from "../../api/ldap-client";
import NewEntryDialog from "./NewEntryDialog.vue";
import NodeLabel from "../NodeLabel.vue";
import PasswordChangeDialog from "./PasswordChangeDialog.vue";
import RenameEntryDialog from "./RenameEntryDialog.vue";
import { state } from "../../state";
import { Attribute } from "../schema/schema";

function attrForKey(key: string): Attribute {
  if (state.schema) {
    const a = state.schema.attr(key);
    if (a) return a;
  }
  return { name: key } as Attribute;
}

function unique(
  element: unknown,
  index: number,
  array: Array<unknown>,
): boolean {
  return array.indexOf(element) == index;
}

const inputTags = ["BUTTON", "INPUT", "SELECT", "TEXTAREA"],
  props = defineProps<{
    activeDn?: string;
    baseDn?: string;
  }>(),
  entry = ref<Entry>(), // entry in editor
  focused = ref<string>(), // currently focused input
  invalid = ref<string[]>([]), // field IDs with validation errors
  modal = ref<string>(), // pop-up dialog
  keys = computed(() => {
    const keys = Object.keys(entry.value?.attrs || {});
    keys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    return keys;
  }),
  structural = computed(() => {
    const objectClasses = entry.value?.attrs?.objectClass;
    if (!objectClasses || !state.schema) return "";
    const oc = objectClasses
      .map((oc) => state.schema?.oc(oc as string))
      .filter((oc) => oc && oc.structural)[0];
    return oc ? oc.name! : "";
  }),
  emit = defineEmits<{
    "update:activeDn": [dn?: string];
    "show-attr": [name?: string];
    "show-oc": [name: string];
  }>();

watch(
  () => props.activeDn,
  (dn) => {
    if (!entry.value || dn != entry.value!.dn) focused.value = undefined;

    if (dn && entry.value && entry.value!.isNew) {
      modal.value = "discard-entry";
    } else if (dn) load(dn, undefined, undefined);
    else if (entry.value && !entry.value!.isNew) entry.value = undefined;
  },
);

function focus(focused?: string): void {
  nextTick(() => {
    const input = focused
      ? document.getElementById(focused)
      : (document.querySelector(
        'form#entry input:not([disabled]), form#entry button[type="button"]',
      ) as HTMLElement);

    if (input) {
      // work around annoying focus jump in OS X Safari
      window.setTimeout(() => input.focus(), 50);
    }
  });
}

// Track focus changes
function onFocus(evt: FocusEvent): void {
  const el = evt.target as HTMLElement;
  if (el.id && inputTags.includes(el.tagName)) focused.value = el.id;
}

function newEntry(newEntry: Entry): void {
  entry.value = newEntry;
  emit("update:activeDn");
  focus(addMandatoryRows());
}

function discardEntry(dn?: string): void {
  entry.value = undefined;
  emit("update:activeDn", dn);
}

function addAttribute(attr: string): void {
  entry.value!.attrs[attr] = [""];
  focus(attr + "-0");
}

function addObjectClass(oc: string): void {
  entry.value!.attrs.objectClass!.push(oc);
  focus(addMandatoryRows() || focused.value);
}

function updateRow(attr: string, values: string[], index?: number): void {
  entry.value!.attrs[attr] = values;
  if (index !== undefined) focus(attr + "-" + index);
}

function addMandatoryRows(): string | undefined {
  const must = attributes("must").filter((attr) => !entry.value!.attrs[attr]);
  must.forEach((attr) => (entry.value!.attrs[attr] = [""]));
  return must.length ? must[0] + "-0" : undefined;
}
function showError(error: any): void {
  if (typeof error === 'string') {
    state.showError(error);
  } else if (error?.detail) {
    state.showError(Array.isArray(error.detail) ? error.detail.join("\n") : String(error.detail));
  } else {
    state.showError(error?.message || "Operation failed");
  }
}

// Load an entry into the editing form
async function load(dn?: string, changed?: string[], focused?: string) {
  invalid.value = [];

  if (!dn || dn.startsWith("-")) {
    entry.value = undefined;
    return;
  }
  let loadedEntry: Entry;
  try {
    loadedEntry = await fetchEntry(dn);
  } catch (e: any) {
    showError(e?.message ?? String(e));
    return;
  }
  entry.value = loadedEntry;
  entry.value!.changed = changed || [];
  entry.value!.isNew = false;

  document.title = dn.split(",")[0]!;
  focus(focused);
}

function hasChanged(key: string): boolean {
  return (entry.value?.changed && entry.value.changed.includes(key)) || false;
}

// Submit the entry form via AJAX
async function save() {
  if (invalid.value.length > 0) {
    focus(focused.value);
    return;
  }

  entry.value!.changed = [];
  let changed: string[] = [];
  try {
    changed = await saveEntry(entry.value!.dn, entry.value!.attrs);
  } catch (e: any) {
    showError(e?.message ?? String(e));
    return;
  }

  if (entry.value!.isNew) {
    entry.value!.isNew = false;
    emit("update:activeDn", entry.value!.dn);
  } else load(entry.value!.dn, changed, focused.value);
}

async function renameEntry(rdn: string) {
  try {
    const newDn = await apiRenameEntry(entry.value!.dn, rdn);
    emit("update:activeDn", newDn);
  } catch (e: any) {
    showError(e?.message ?? String(e));
  }
}

async function deleteEntryByDn(dn: string) {
  try {
    await removeEntry(dn);
  } catch (e: any) {
    showError(e?.message ?? String(e));
    return;
  }
  document.title = "Directory";
  state.showInfo("👍 Deleted: " + dn);
  emit("update:activeDn", "-" + dn);
}

async function changePassword(_oldPass: string, newPass: string) {
  try {
    await changeEntryPassword(entry.value!.dn, newPass);
    entry.value!.attrs.userPassword = [newPass];
    entry.value!.changed = ["userPassword"];
  } catch (e: any) {
    showError(e?.message ?? String(e));
  }
}

function attributes(kind: "must" | "may"): string[] {
  const objectClasses = entry.value?.attrs?.objectClass;
  if (!objectClasses || !state.schema) return [];
  const attrs = objectClasses
    .filter((oc) => oc && oc != "top")
    .map((oc) => state.schema?.oc(oc))
    .flatMap((oc) => (oc ? oc.$collect(kind) : []))
    .filter(unique);
  attrs.sort();
  return attrs;
}

function valid(key: string, valid: boolean): void {
  if (valid) {
    const pos = invalid.value.indexOf(key);
    if (pos >= 0) invalid.value.splice(pos, 1);
  } else if (!invalid.value.includes(key)) {
    invalid.value.push(key);
  }
}
</script>
