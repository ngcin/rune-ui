<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { api } from '@/services/api'
import type { UserCreateRequest, UserUpdateRequest } from '@/types/api'

interface Props {
  userId?: string
}

const props = withDefaults(defineProps<Props>(), {
  userId: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}>()

const open = defineModel<boolean>('open', { default: false })

const isEdit = computed(() => !!props.userId)
const title = computed(() => isEdit.value ? '编辑用户' : '新增用户')

// Schema for validation
const baseSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(50, '用户名最多50个字符'),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  phone: z.string().max(20, '手机号最多20个字符').optional().or(z.literal('')),
  nickname: z.string().max(50, '昵称最多50个字符').optional().or(z.literal('')),
  status: z.number().int().refine(val => val === 0 || val === 1, '状态必须是0或1'),
  remark: z.string().max(500, '备注最多500个字符').optional().or(z.literal(''))
})

const addSchema = baseSchema.extend({
  password: z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符')
})

const editSchema = baseSchema.extend({
  password: z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符').optional().or(z.literal(''))
})

const schema = computed(() => isEdit.value ? editSchema : addSchema)

type Schema = z.output<typeof schema.value>

const state = reactive<Partial<Schema>>({
  username: undefined,
  password: undefined,
  email: undefined,
  phone: undefined,
  nickname: undefined,
  status: 1,
  remark: undefined
})

const loading = ref(false)
const toast = useToast()

// Fetch user data when editing
watch([() => props.userId, open], async ([newId, isOpen]) => {
  if (newId && isOpen) {
    try {
      loading.value = true
      const user = await api.users.getById(newId)
      Object.assign(state, {
        username: user.username,
        email: user.email || '',
        phone: user.phone || '',
        nickname: user.nickname || '',
        status: user.status,
        remark: user.remark || ''
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
        username: undefined,
        password: undefined,
        email: undefined,
        phone: undefined,
        nickname: undefined,
        status: 1,
        remark: undefined
      })
    }, 200)
  } else if (!isEdit.value) {
    // Reset to defaults for add mode
    Object.assign(state, {
      username: undefined,
      password: undefined,
      email: undefined,
      phone: undefined,
      nickname: undefined,
      status: 1,
      remark: undefined
    })
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    loading.value = true

    if (isEdit.value && props.userId) {
      const updateData: UserUpdateRequest = {
        username: event.data.username,
        email: event.data.email || undefined,
        phone: event.data.phone || undefined,
        nickname: event.data.nickname || undefined,
        status: event.data.status,
        remark: event.data.remark || undefined,
        password: event.data.password || undefined
      }
      await api.users.update(props.userId, updateData)
      toast.add({
        title: '更新成功',
        description: '用户信息已更新',
        color: 'success'
      })
    } else {
      const createData: UserCreateRequest = {
        username: event.data.username,
        password: event.data.password || '', // Will always be string in add mode due to validation
        email: event.data.email || undefined,
        phone: event.data.phone || undefined,
        nickname: event.data.nickname || undefined,
        status: event.data.status,
        remark: event.data.remark || undefined
      }
      await api.users.create(createData)
      toast.add({
        title: '创建成功',
        description: '新用户已创建',
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
    :description="isEdit ? '编辑用户信息' : '创建新用户'">
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
        <UFormField label="用户名" placeholder="请输入用户名" name="username" required>
          <UInput v-model="state.username" :disabled="isEdit" class="w-full" />
        </UFormField>

        <UFormField
          v-if="!isEdit"
          label="密码"
          placeholder="请输入密码"
          name="password"
          required
        >
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>

        <UFormField label="邮箱" placeholder="请输入邮箱" name="email">
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>

        <UFormField label="手机号" placeholder="请输入手机号" name="phone">
          <UInput v-model="state.phone" class="w-full" />
        </UFormField>

        <UFormField label="昵称" placeholder="请输入昵称" name="nickname">
          <UInput v-model="state.nickname" class="w-full" />
        </UFormField>

        <UFormField label="状态" name="status">
          <USelect
            v-model="state.status"
            :items="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 }
            ]"
            placeholder="选择状态"
            class="w-full"
          />
        </UFormField>

        <UFormField label="备注" placeholder="请输入备注" name="remark">
          <UTextarea v-model="state.remark" class="w-full" />
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
