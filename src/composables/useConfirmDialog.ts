import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  icon?: string
  type?: 'danger' | 'warning' | 'info'
}

// 当前对话框状态
const isOpen = ref(false)
const options = ref<ConfirmOptions>({})
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirmDialog() {
  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    options.value = { ...opts }
    isOpen.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
    isOpen.value = false
  }

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
    isOpen.value = false
  }

  return {
    confirm,
    open: isOpen,
    options,
    handleConfirm,
    handleCancel
  }
}
