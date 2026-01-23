<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Workspace } from '@/types/api'
import { workspacesApi } from '@/services/api'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import WorkspaceFormDialog from '@/components/workspace/WorkspaceFormDialog.vue'

const selectedWorkspace = defineModel<Workspace | null>()

const props = defineProps<{
  workspaces: Workspace[]
}>()

const emit = defineEmits<{
  create: []
  refresh: []
}>()

// Auto-scroll to selected workspace
const workspaceRefs = ref<Record<string, any>>({})

watch(selectedWorkspace, () => {
  if (!selectedWorkspace.value) return
  const ref = workspaceRefs.value[selectedWorkspace.value.id]
  if (ref && typeof ref.scrollIntoView === 'function') ref.scrollIntoView({ block: 'nearest' })
})

// Edit dialog state
const editDialogOpen = ref(false)
const editingWorkspace = ref<Workspace | null>(null)

// Confirm dialog
const { confirm } = useConfirmDialog()
const toast = useToast()

// Open edit dialog
function openEditDialog(workspace: Workspace) {
  editingWorkspace.value = workspace
  editDialogOpen.value = true
}

// Confirm delete workspace
async function confirmDelete(workspace: Workspace) {
  const confirmed = await confirm({
    title: '确认删除',
    description: `确定要删除工作空间"${workspace.name}"吗？删除后无法恢复。`,
    confirmText: '删除',
    cancelText: '取消',
    type: 'danger',
    icon: 'i-lucide-alert-triangle'
  })

  if (!confirmed) return

  try {
    await workspacesApi.delete(String(workspace.id))
    toast.add({
      title: '删除成功',
      description: '工作空间已删除',
      color: 'success'
    })
    // Clear selected state if deleting the current selected workspace
    if (selectedWorkspace.value?.id === workspace.id) {
      selectedWorkspace.value = null
    }
    emit('refresh')
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: (error as Error).message,
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Workspace list -->
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="workspace in workspaces"
        :key="workspace.id"
        :ref="(el) => { if (el) workspaceRefs[workspace.id] = el }"
        class="group p-4 cursor-pointer border-l-2 transition-colors"
        :class="[
          selectedWorkspace?.id === workspace.id
            ? 'border-primary bg-primary/10'
            : 'border-(--ui-bg) hover:border-primary hover:bg-primary/5'
        ]"
        @click="selectedWorkspace = workspace"
      >
        <div class="flex items-center justify-between">
          <span class="font-medium truncate flex-1">{{ workspace.name }}</span>
          <div class="flex items-center gap-2">
            <UBadge :label="workspace.memberCount || 0" size="xs" variant="subtle" color="neutral" />

            <!-- Action buttons shown on hover -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <UButton
                icon="i-lucide-edit-2"
                color="neutral"
                variant="ghost"
                size="xs"
                title="编辑"
                @click.stop="openEditDialog(workspace)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                title="删除"
                @click.stop="confirmDelete(workspace)"
              />
            </div>
          </div>
        </div>
        <div
          v-if="workspace.description"
          class="text-xs text-muted-foreground truncate mt-1"
          :title="workspace.description"
        >
          {{ workspace.description }}
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="workspaces.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <UIcon name="i-lucide-inbox" class="size-12 mb-2" />
        <p>暂无工作空间</p>
      </div>
    </div>

    <!-- Edit dialog -->
    <WorkspaceFormDialog
      v-model:open="editDialogOpen"
      :workspace-id="editingWorkspace?.id"
      @refresh="emit('refresh')"
    />
  </div>
</template>
