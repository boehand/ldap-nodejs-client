<template>
  <div>
    <v-treeview
      v-if="roots.length > 0"
      :items="items"
      :open="open"
      dense
      activatable
      @update:active="selectedDn = $event[0]"
      @update:open="open = $event"
    >
      <template #prepend="{ item, isOpen }">
        <v-icon v-if="item.children?.length">
          {{ isOpen ? 'mdi-folder-open' : 'mdi-folder' }}
        </v-icon>
        <v-icon v-else>
          mdi-file-document
        </v-icon>
      </template>
    </v-treeview>

    <v-alert v-else type="info" class="mt-4">
      Loading directory structure...
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate class="mt-2"></v-progress-linear>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { ldapApi, type TreeNode, type ApiResponse } from '../api/ldap-client';

const authStore = useAuthStore();

const selectedDn = ref<string | null>(null);
const roots = ref<TreeNode[]>([]);
const loading = ref(false);
const open = ref<string[]>([]);
const treeCache = new Map<string, TreeNode[]>();

// Build tree structure from flat array
const items = computed(() => {
  return roots.value.map((root) => treeNodeToVuetifyItem(root));
});

function treeNodeToVuetifyItem(node: TreeNode): any {
  return {
    id: node.dn,
    title: node.name || node.dn,
    children: node.hasChildren ? [] : undefined, // Lazy load
  };
}

async function loadRoots() {
  if (!authStore.ldapUrl) return;

  loading.value = true;
  try {
    const response = await ldapApi.get('/tree/root') as ApiResponse<{ namingContexts?: string[] }>;
    if (response.success && response.data?.namingContexts) {
      const baseDns = response.data.namingContexts;

      // Load children for each naming context
      for (const baseDn of baseDns) {
        await loadChildren(baseDn);
      }

      roots.value = treeCache.get('_roots') || [];
    }
  } catch (error) {
    console.error('Failed to load tree roots:', error);
  } finally {
    loading.value = false;
  }
}

async function loadChildren(parentDn: string) {
  if (treeCache.has(parentDn)) {
    return treeCache.get(parentDn) || [];
  }

  try {
    const response = await ldapApi.getTree(parentDn, 'one');
    if (response.success && response.data) {
      const children = response.data;
      treeCache.set(parentDn, children);

      if (parentDn === 'root') {
        roots.value = children;
      }
    }
  } catch (error) {
    console.error(`Failed to load children of ${parentDn}:`, error);
  }
}

onMounted(() => {
  loadRoots();
});
</script>

<style scoped>
</style>
