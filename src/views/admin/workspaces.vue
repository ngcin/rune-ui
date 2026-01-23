<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import type { Workspace } from '@/types/api'
import { workspacesApi } from '@/services/api'
import WorkspaceList from '@/components/workspace/WorkspaceList.vue'
import WorkspaceMembers from '@/components/workspace/WorkspaceMembers.vue'
import WorkspaceFormDialog from '@/components/workspace/WorkspaceFormDialog.vue'

// Data fetching
const workspaces = ref<Workspace[]>([])
const loading = ref(false)

async function fetchWorkspaces() {
  try {
    loading.value = true
    workspaces.value = await workspacesApi.list()
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '加载失败',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(fetchWorkspaces)

// Selected workspace state
const selectedWorkspace = ref<Workspace | null>(null)

// Auto-reset selection when workspace is deleted/filtered
watch(workspaces, () => {
  if (!workspaces.value) {
    selectedWorkspace.value = null
    return
  }

  // 如果当前选中的工作空间不在列表中（被删除或筛选），选中第一个工作空间
  const exists = workspaces.value.find(w => w.id === selectedWorkspace.value?.id)
  if (!exists) {
    // 默认选中第一个工作空间（如果列表不为空）
    selectedWorkspace.value = workspaces.value[0] || null
  }
}, { deep: true })

// Mobile panel control
const isMembersPanelOpen = computed({
  get: () => !!selectedWorkspace.value,
  set: (value: boolean) => {
    if (!value) selectedWorkspace.value = null
  }
})

// Breakpoints for responsive layout
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg')

// Dialog state
const createDialogOpen = ref(false)

function handleRefresh() {
  fetchWorkspaces()
}
</script>

<template>
  <UDashboardPanel
    id="workspaces-left"
    :default-size="20"
    :min-size="18"
    :max-size="22"
    resizable
  >
    <UDashboardNavbar title="工作空间">
      <template #trailing>
        <UBadge :label="workspaces.length" variant="subtle" />
      </template>

      <template #right>
        <UButton
          icon="i-lucide-plus"
          @click="createDialogOpen = true"
        />
      </template>
    </UDashboardNavbar>

    <WorkspaceList
      v-model="selectedWorkspace"
      :workspaces="workspaces"
      @create="createDialogOpen = true"
      @refresh="handleRefresh"
    />
  </UDashboardPanel>

  <WorkspaceMembers
    v-if="selectedWorkspace"
    :key="selectedWorkspace.id"
    :workspace="selectedWorkspace"
    @close="selectedWorkspace = null"
    @refresh="handleRefresh"
  />

  <!-- Empty state -->
  <div v-else class="hidden lg:flex flex-1 items-center justify-center">
    <UIcon name="i-lucide-users" class="size-32 text-dimmed" />
    <p class="text-muted-foreground ml-4">选择工作空间查看成员</p>
  </div>

  <!-- Mobile slideover -->
  <USlideover v-if="isMobile" v-model:open="isMembersPanelOpen">
    <template #content>
      <WorkspaceMembers
        v-if="selectedWorkspace"
        :key="selectedWorkspace.id"
        :workspace="selectedWorkspace"
        @close="selectedWorkspace = null"
        @refresh="handleRefresh"
      />
    </template>
  </USlideover>

  <!-- Dialogs -->
  <WorkspaceFormDialog
    v-model:open="createDialogOpen"
    @refresh="handleRefresh"
  />
</template>
