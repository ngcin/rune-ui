<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { workspacesApi, api } from '@/services/api'
import type { WorkspaceMemberRequest, WorkspaceMemberRole } from '@/types/api'

interface Props {
  workspaceId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}>()

const open = defineModel<boolean>('open', { default: false })

// Schema for validation
const schema = z.object({
  userId: z.string({ message: '请选择用户' }).min(1, '请选择用户'),
  role: z.string({ message: '请选择角色' }).min(1, '请选择角色')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  userId: undefined,
  role: 'WORKSPACE_USER' as WorkspaceMemberRole
})

const loading = ref(false)
const loadingUsers = ref(false)
const toast = useToast()

// Available users to add (not yet in workspace)
const availableUsers = ref<Array<{ id: string; username: string; nickname?: string }>>([])

// Fetch available users when dialog opens
watch(open, async (isOpen) => {
  if (isOpen) {
    await fetchAvailableUsers()
  } else {
    // Reset form when dialog closes
    setTimeout(() => {
      Object.assign(state, {
        userId: undefined,
        role: 'WORKSPACE_USER' as WorkspaceMemberRole
      })
      availableUsers.value = []
    }, 200)
  }
})

async function fetchAvailableUsers() {
  try {
    loadingUsers.value = true
    // Get all users
    const result = await api.users.page({ current: 1, size: 1000 })

    // Get existing members
    const existingMembers = await workspacesApi.pageMembers(props.workspaceId, { current: 1, size: 1000 })
    const existingUserIds = new Set(existingMembers.records.map(m => m.userId))

    // Filter out users who are already members
    availableUsers.value = result.records
      .filter((user: any) => !existingUserIds.has(user.id))
      .map((user: any) => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname
      }))
  } catch (error) {
    toast.add({
      title: '加载用户列表失败',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    loadingUsers.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    loading.value = true

    const data: WorkspaceMemberRequest = {
      userId: event.data.userId,
      role: event.data.role as WorkspaceMemberRole
    }

    await workspacesApi.addMember(props.workspaceId, data)
    toast.add({
      title: '添加成功',
      description: '成员已添加到工作空间',
      color: 'success'
    })

    open.value = false
    emit('refresh')
  } catch (error) {
    toast.add({
      title: '添加失败',
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
    title="添加成员"
    description="选择用户并设置角色">
    <template #body>
      <div v-if="loadingUsers" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-muted" />
      </div>
      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="用户" placeholder="请选择用户" name="userId" required>
          <USelect
            v-model="state.userId"
            :items="availableUsers.map(u => ({ label: `${u.nickname || u.username} (${u.username})`, value: u.id }))"
            placeholder="选择用户"
            class="w-full"
          />
        </UFormField>

        <UFormField label="角色" placeholder="请选择角色" name="role" required>
          <USelect
            v-model="state.role"
            :items="[
              { label: '普通成员', value: 'WORKSPACE_USER' },
              { label: '管理员', value: 'WORKSPACE_ADMIN' }
            ]"
            placeholder="选择角色"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="取消"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="添加"
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
