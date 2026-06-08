<template>
  <div>
    <v-list v-if="roots.length > 0" density="compact" nav>
      <tree-node
        v-for="node in roots"
        :key="node.dn"
        :node="node"
        :depth="0"
        :selected-dn="selectedDn"
        @select="selectNode"
        @load-children="loadChildren"
      />
    </v-list>

    <v-alert v-else-if="!loading" type="info" class="mt-4">
      No directory entries found.
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate class="mt-2"></v-progress-linear>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent, h } from 'vue';
import { useAuthStore } from '../stores/auth';
import { ldapApi, type TreeNode, type ApiResponse } from '../api/ldap-client';

const authStore = useAuthStore();
const emit = defineEmits<{ 'select-dn': [dn: string] }>();

const selectedDn = ref<string>();
const roots = ref<TreeNode[]>([]);
const loading = ref(false);
const childrenMap = ref<Record<string, TreeNode[]>>({});
const expandedNodes = ref<Set<string>>(new Set());

function selectNode(dn: string) {
  selectedDn.value = dn;
  emit('select-dn', dn);
}

async function loadRoots() {
  if (!authStore.ldapUrl) return;

  loading.value = true;
  try {
    const response = await ldapApi.get<{ namingContexts?: string[] }>('/tree/root');
    if (response.success && response.data?.namingContexts) {
      const baseDns = response.data.namingContexts;

      for (const baseDn of baseDns) {
        const children = await loadChildren(baseDn);
        if (children.length > 0) {
          roots.value.push({
            dn: baseDn,
            name: baseDn,
            rdn: baseDn,
            hasChildren: true,
          });
          childrenMap.value[baseDn] = children;
          expandedNodes.value.add(baseDn);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load tree roots:', error);
  } finally {
    loading.value = false;
  }
}

async function loadChildren(parentDn: string): Promise<TreeNode[]> {
  if (childrenMap.value[parentDn]) {
    return childrenMap.value[parentDn];
  }

  try {
    const response = await ldapApi.getTree(parentDn, 'one');
    if (response.success && response.data) {
      childrenMap.value[parentDn] = response.data;
      return response.data;
    }
  } catch (error) {
    console.error(`Failed to load children of ${parentDn}:`, error);
  }
  return [];
}

onMounted(() => {
  loadRoots();
});

// Recursive tree node component
const TreeNodeComponent = defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object as () => TreeNode, required: true },
    depth: { type: Number, default: 0 },
    selectedDn: { type: String, default: null },
  },
  emits: ['select', 'load-children'],
  setup(props, { emit: nodeEmit }) {
    const expanded = ref(expandedNodes.value.has(props.node.dn));

    async function toggle() {
      if (!props.node.hasChildren) return;
      expanded.value = !expanded.value;
      if (expanded.value) {
        expandedNodes.value.add(props.node.dn);
        if (!childrenMap.value[props.node.dn]) {
          await loadChildren(props.node.dn);
        }
      } else {
        expandedNodes.value.delete(props.node.dn);
      }
    }

    function select() {
      nodeEmit('select', props.node.dn);
    }

    return () => {
      const children = childrenMap.value[props.node.dn] || [];
      const isSelected = props.selectedDn === props.node.dn;
      const paddingLeft = `${props.depth * 16 + 8}px`;

      const nodeEl = h(
        'div',
        {
          style: {
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            paddingLeft,
            borderRadius: '4px',
            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
          },
          onClick: select,
        },
        [
          props.node.hasChildren
            ? h(
                'span',
                {
                  style: { marginRight: '4px', cursor: 'pointer', userSelect: 'none', fontSize: '12px' },
                  onClick: (e: Event) => { e.stopPropagation(); toggle(); },
                },
                expanded.value ? '▼' : '▶'
              )
            : h('span', { style: { marginRight: '4px', width: '12px', display: 'inline-block' } }),
          h('span', {
            style: { fontWeight: isSelected ? 'bold' : 'normal' },
          }, props.node.name || props.node.rdn),
        ]
      );

      const childEls: ReturnType<typeof h>[] =
        expanded.value && children.length > 0
          ? children.map((child) =>
              h(TreeNodeComponent as any, {
                key: child.dn,
                node: child,
                depth: props.depth + 1,
                selectedDn: props.selectedDn,
                onSelect: (dn: string) => nodeEmit('select', dn),
                onLoadChildren: (dn: string) => nodeEmit('load-children', dn),
              })
            )
          : [];

      return h('div', [nodeEl, ...childEls]);
    };
  },
});

// Register as local component
const TreeNode = TreeNodeComponent;
</script>

<style scoped>
</style>
