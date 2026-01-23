<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { workspacesApi } from '@/services/api'
import type { WorkspaceRequest, Workspace } from '@/types/api'

interface Props {
  workspaceId?: string
}

const props = withDefaults(defineProps<Props>(), {
  workspaceId: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}>()

const open = defineModel<boolean>('open', { default: false })

const isEdit = computed(() => !!props.workspaceId)
const title = computed(() => isEdit.value ? '编辑工作空间' : '创建工作空间')

// Get all workspaces for uniqueness validation
const allWorkspaces = ref<Workspace[]>([])

async function fetchWorkspaces() {
  try {
    allWorkspaces.value = await workspacesApi.list()
  } catch (error) {
    console.error('Failed to fetch workspaces for validation:', error)
  }
}

// Fetch workspaces when dialog opens
watch(open, async (isOpen) => {
  if (isOpen) {
    await fetchWorkspaces()
  }
})

// Schema for validation with uniqueness check
const schema = z.object({
  name: z.string()
    .min(2, '工作空间名称至少2个字符')
    .max(100, '工作空间名称最多100个字符')
    .refine(async (value) => {
      if (!value) return true
      const existing = allWorkspaces.value.find(w => w.name === value)
      // When editing, allow the current workspace's own name
      if (isEdit.value && props.workspaceId) {
        const currentWorkspace = allWorkspaces.value.find(w => String(w.id) === props.workspaceId)
        if (existing && existing.id === currentWorkspace?.id) {
          return true
        }
      }
      return !existing
    }, '工作空间名称已存在'),
  description: z.string().max(500, '描述最多500个字符').optional().or(z.literal(''))
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  description: undefined
})

const loading = ref(false)
const toast = useToast()

// Fetch workspace data when editing
watch([() => props.workspaceId, open], async ([newId, isOpen]) => {
  if (newId && isOpen) {
    try {
      loading.value = true
      const workspace = await workspacesApi.getById(String(newId))
      Object.assign(state, {
        name: workspace.name,
        description: workspace.description || ''
      })
    } catch (error) {
      toast.add({
        title: '加载失败',
        description: (error as Error).message,
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }
}, { immediate: true })

// Reset form when dialog opens/closes
watch(open, (isOpen) => {
  if (!isOpen) {
    setTimeout(() => {
      Object.assign(state, {
        name: undefined,
        description: undefined
      })
    }, 200)
  } else if (!isEdit.value) {
    // Reset to defaults for add mode
    Object.assign(state, {
      name: undefined,
      description: undefined
    })
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    loading.value = true

    const data: WorkspaceRequest = {
      name: event.data.name,
      description: event.data.description || undefined
    }

    if (isEdit.value && props.workspaceId) {
      await workspacesApi.update(String(props.workspaceId), data)
      toast.add({
        title: '更新成功',
        description: '工作空间已更新',
        color: 'success'
      })
    } else {
      await workspacesApi.create(data)
      toast.add({
        title: '创建成功',
        description: '工作空间已创建',
        color: 'success'
      })
    }

    open.value = false
    emit('refresh')
  } catch (error) {
    toast.add({
      title: isEdit.value ? '更新失败' : '创建失败',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open"
    :dismissible="false"
    :title="title"
    :description="isEdit ? '编辑工作空间信息' : '创建新工作空间'">
    <template #body>
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-muted" />
      </div>
      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="名称" placeholder="请输入工作空间名称" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField label="描述" placeholder="请输入描述" name="description">
          <UTextarea v-model="state.description" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="取消"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            :label="isEdit ? '保存' : '创建'"
            color="primary"
            variant="solid"
            type="submit"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
