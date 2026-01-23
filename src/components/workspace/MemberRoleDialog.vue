<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { workspacesApi } from '@/services/api'
import type { WorkspaceMember, WorkspaceMemberRole } from '@/types/api'

interface Props {
  workspaceId: string
  member?: WorkspaceMember | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}>()

const open = defineModel<boolean>('open', { default: false })

// Schema for validation
const schema = z.object({
  role: z.string({ message: '请选择角色' }).min(1, '请选择角色')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  role: 'WORKSPACE_USER' as WorkspaceMemberRole
})

const loading = ref(false)
const toast = useToast()

// Set initial role when member changes
watch([() => props.member, open], ([member, isOpen]) => {
  if (member && isOpen) {
    state.role = member.role
  }
})

// Reset form when dialog closes
watch(open, (isOpen) => {
  if (!isOpen) {
    setTimeout(() => {
      state.role = 'WORKSPACE_USER' as WorkspaceMemberRole
    }, 200)
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.member) return

  try {
    loading.value = true

    await workspacesApi.updateMemberRole(
      props.workspaceId,
      props.member.userId,
      event.data.role
    )

    toast.add({
      title: '更新成功',
      description: '成员角色已更新',
      color: 'success'
    })

    open.value = false
    emit('refresh')
  } catch (error) {
    toast.add({
      title: '更新失败',
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
    title="编辑成员角色"
    description="修改成员在工作空间中的角色">
    <template #body>
      <div v-if="member" class="mb-4 p-3 bg-muted/50 rounded-lg">
        <div class="text-sm">
          <span class="text-muted-foreground">用户：</span>
          <span class="font-medium">{{ member.nickname || member.username }}</span>
        </div>
        <div class="text-sm mt-1">
          <span class="text-muted-foreground">账号：</span>
          <span>{{ member.username }}</span>
        </div>
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
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
            label="保存"
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
