<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  open?: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: '确认对话框',
  description: '您确认需要进行该操作吗',
  confirmText: '确认',
  cancelText: '取消',
  type: 'info'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

// 根据类型设置确认按钮颜色
const confirmColor = computed(() => {
  const colorMap = {
    danger: 'error',
    warning: 'warning',
    info: 'primary'
  } as const
  return colorMap[props.type]
})

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

function handleConfirm() {
  emit('confirm')
  isOpen.value = false
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
    :dismissible="false"
    :ui="{
      content: 'sm:max-w-[500px] rounded-[20px] shadow-xl ring-0',
      header: 'p-6 sm:p-8 pb-0',
      body: 'p-0 sm:p-0',
      footer: 'flex justify-end gap-3',
      title: 'text-[22px] font-bold text-gray-900 leading-tight',
      description: 'text-[15px] text-gray-500 leading-normal mt-3',
    }"
  >
    <template #footer>
      <UButton
        :label="cancelText"
        color="neutral"
        variant="outline"
        size="md"
        @click="handleCancel"
      />
      <UButton
        :label="confirmText"
        :color="confirmColor"
        variant="solid"
        size="md"
        @click="handleConfirm"
      />
    </template>
  </UModal>
</template>
