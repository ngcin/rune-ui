<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { api } from '@/services/api'

interface Props {
  userId?: string
  username?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const open = defineModel<boolean>('open', { default: false })

const schema = z.object({
  password: z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  password: undefined,
  confirmPassword: undefined
})

const loading = ref(false)
const toast = useToast()

// Reset form when dialog closes
watch(open, (isOpen) => {
  if (!isOpen) {
    setTimeout(() => {
      state.password = undefined
      state.confirmPassword = undefined
    }, 200)
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.userId) return

  try {
    loading.value = true
    await api.users.resetPassword(props.userId, event.data.password)
    toast.add({
      title: '重置成功',
      description: '密码已重置',
      color: 'success'
    })
    open.value = false
  } catch (error) {
    toast.add({
      title: '重置失败',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="重置密码"
    :description="username ? `为用户 ${username} 重置密码` : '重置用户密码'"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="新密码"
          placeholder="请输入新密码"
          name="password"
          required
        >
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>

        <UFormField
          label="确认密码"
          placeholder="请再次输入新密码"
          name="confirmPassword"
          required
        >
          <UInput v-model="state.confirmPassword" type="password" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="取消"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="确认重置"
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
