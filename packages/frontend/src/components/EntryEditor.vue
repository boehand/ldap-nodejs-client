<template>
  <div>
    <v-card v-if="entry" class="mt-4">
      <v-toolbar color="secondary">
        <v-toolbar-title>Entry: {{ entry.dn }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="editMode = !editMode">
          <v-icon>{{ editMode ? 'mdi-close' : 'mdi-pencil' }}</v-icon>
        </v-btn>
        <v-btn icon @click="deleteEntry" v-if="editMode" color="error">
          <v-icon>mdi-trash-can</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pt-8">
        <!-- Display attributes -->
        <div v-if="!editMode">
          <div v-for="(values, attr) in entry.attributes" :key="attr" class="mb-6">
            <strong>{{ attr }}</strong>
            <div v-for="(val, i) in values" :key="i" class="ml-4 text-grey">
              {{ val }}
            </div>
          </div>
        </div>

        <!-- Edit attributes -->
        <v-form v-else @submit.prevent="saveEntry">
          <div v-for="(values, attr) in editableAttributes" :key="attr" class="mb-4">
            <v-label>{{ attr }}</v-label>
            <div v-for="(val, i) in values" :key="i" class="mb-2 d-flex gap-2">
              <v-text-field
                v-model="editableAttributes[attr][i]"
                dense
                class="flex-grow-1"
              ></v-text-field>
              <v-btn
                icon
                small
                @click="editableAttributes[attr].splice(i, 1)"
                color="error"
              >
                <v-icon small>mdi-close</v-icon>
              </v-btn>
            </div>
            <v-btn
              small
              variant="outlined"
              @click="editableAttributes[attr].push('')"
              class="mt-2"
            >
              <v-icon small>mdi-plus</v-icon>
              Add Value
            </v-btn>
          </div>

          <v-divider class="my-6"></v-divider>

          <div class="d-flex gap-2">
            <v-btn type="submit" color="success" :loading="saving">
              Save
            </v-btn>
            <v-btn @click="editMode = false" variant="outlined">
              Cancel
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <v-card v-else class="mt-4">
      <v-card-text class="text-center py-12">
        <v-icon size="48" class="mb-4 text-grey">mdi-folder-open</v-icon>
        <p class="text-grey">Select an entry from the tree to view details</p>
      </v-card-text>
    </v-card>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" class="mt-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { ldapApi, type LdapEntry } from '../api/ldap-client';

const authStore = useAuthStore();

const entry = ref<LdapEntry | null>(null);
const editMode = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const selectedDn = ref<string | null>(null);

const editableAttributes = computed(() => {
  if (!entry.value) return {};

  // Create a copy for editing
  const copy: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(entry.value.attributes)) {
    copy[key] = [...values];
  }
  return copy;
});

async function loadEntry(dn: string) {
  try {
    const response = await ldapApi.getEntry(dn);
    if (response.success && response.data) {
      entry.value = response.data;
      editMode.value = false;
      error.value = null;
    } else {
      error.value = response.error?.message || 'Failed to load entry';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load entry';
  }
}

async function saveEntry() {
  if (!entry.value) return;

  saving.value = true;
  error.value = null;

  try {
    // Calculate changes
    const changes: Record<string, string | string[] | null> = {};

    for (const [attr, newValues] of Object.entries(editableAttributes.value)) {
      const oldValues = entry.value.attributes[attr] || [];
      const filtered = newValues.filter((v) => v.trim() !== '');

      // Only include if changed
      if (JSON.stringify(oldValues) !== JSON.stringify(filtered)) {
        changes[attr] = filtered.length > 0 ? filtered : null; // null = delete
      }
    }

    const response = await ldapApi.modifyEntry(entry.value.dn, changes);

    if (response.success) {
      // Reload entry to reflect changes
      await loadEntry(entry.value.dn);
      editMode.value = false;
    } else {
      error.value = response.error?.message || 'Failed to save entry';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save entry';
  } finally {
    saving.value = false;
  }
}

async function deleteEntry() {
  if (!entry.value || !confirm(`Delete ${entry.value.dn}?`)) {
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    const response = await ldapApi.deleteEntry(entry.value.dn);

    if (response.success) {
      entry.value = null;
      editMode.value = false;
    } else {
      error.value = response.error?.message || 'Failed to delete entry';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete entry';
  } finally {
    saving.value = false;
  }
}

// Watch for DN changes (from tree selection)
watch(
  () => selectedDn.value,
  (newDn) => {
    if (newDn) {
      loadEntry(newDn);
    }
  }
);
</script>

<style scoped>
</style>
