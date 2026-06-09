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

    <nav class="flex justify-between mb-4 border-b border-front/20 bg-primary/70">
      <div v-if="entry.isNew" class="py-2 ml-3">
        <node-label :dn="entry.dn" :oc="structural" />
      </div>
      <div v-else class="ml-2">
        <dropdown-menu>
          <template #button-content>
            <node-label :dn="entry.dn" :oc="structural" />
          </template>
          <li @click="modal = 'new-entry'" role="menuitem">Add child…</li>
          <li @click="modal = 'copy-entry'" role="menuitem">Copy…</li>
          <li @click="modal = 'rename-entry'" role="menuitem">Rename…</li>
          <li role="menuitem"><a :href="'api/ldif/' + entry.dn">Export</a></li>
          <li @click="modal = 'delete-entry'" class="text-danger" role="menuitem">
            Delete…
          </li>
        </dropdown-menu>
      </div>

      <div v-if="entry.isNew" class="control text-2xl mr-2" @click="modal = 'discard-entry'" title="close">⊗</div>
      <div v-else class="control text-xl mr-2" title="close" @click="emit('update:activeDn')">⊗</div>
    </nav>

    <form id="entry" class="space-y-4 my-4" @submit.prevent="save" @reset="load(entry!.dn, undefined, undefined)"
      @focusin="onFocus">
      <attribute-row v-for="key in keys" :key="key" :base-dn="props.baseDn" :attr="attrForKey(key)"
        :entry="entry" :values="entry.attrs[key]!" :changed="hasChanged(key)" :may="attributes('may').includes(key)"
        :must="attributes('must').includes(key)" @update="updateRow" @reload-form="load" @valid="valid(key, $event)"
        @show-modal="modal = $event" @show-attr="emit('show-attr', $event)" @show-oc="emit('show-oc', $event)" />

      <!-- Footer with buttons -->
      <div class="flex ml-4 mt-2 space-x-4">
        <div class="w-1/4"></div>
        <div class="w-3/4 pl-4">
          <div class="w-[90%] space-x-3">
            <button type="submit" class="btn bg-primary/70" tabindex="0" accesskey="s" :disabled="invalid.length != 0">
              Submit
            </button>
            <button type="reset" v-if="!entry.isNew" accesskey="r" tabindex="0" class="btn bg-secondary">
              Reset
            </button>
            <button class="btn float-right bg-secondary" accesskey="a" tabindex="0" v-if="!entry.isNew"
              @click.prevent="modal = 'add-attribute'">
              Add attribute…
            </button>
          </div>
        </div>
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
