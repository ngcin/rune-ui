<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'

export interface Workspace {
  id: number
  name: string
}

defineProps<{
  collapsed?: boolean
  workspaces?: Workspace[]
}>()

const emit = defineEmits<{
  change: [workspace: Workspace]
}>()

// 默认工作空间数据
const workspaces = ref<Workspace[]>([
  { id: 1, name: '默认工作空间' },
  { id: 2, name: '西南视觉项目组觉项目组' }
])
const selectedWorkspace = ref<Workspace>(workspaces.value[0])

const items = computed<DropdownMenuItem[][]>(() => {
  return [workspaces.value.map(workspace => ({
    label: workspace.name,
    class: workspace.id === selectedWorkspace.value.id ? 'bg-muted' : '',
    onSelect() {
      selectedWorkspace.value = workspace
      emit('change', workspace)
    }
  }))]
})
</script>

<template>
  <div
    class="rounded-lg bg-muted/50 py-1"
    :class="[
      collapsed ? 'flex justify-center px-1' : 'mx-2 px-2'
    ]"
  >
    <UDropdownMenu
      :items="items"
      :content="{
        align: 'start',
        collisionPadding: 8
      }"
    >
      <UButton
        :icon="collapsed ? 'i-lucide-users' : undefined"
        :label="collapsed ? undefined : selectedWorkspace?.name"
        :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
        color="neutral"
        variant="ghost"
        block
        :square="collapsed"
        class="data-[state=open]:bg-elevated"
        :ui="{
          trailingIcon: 'text-dimmed'
        }"
      />
    </UDropdownMenu>
  </div>
</template>
