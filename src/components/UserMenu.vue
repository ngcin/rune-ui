<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useColorMode } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

defineProps<{
  collapsed?: boolean
}>()

const router = useRouter()
const colorMode = useColorMode()
const appConfig = useAppConfig()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const user = computed(() => ({
  name: authStore.user?.nickname || authStore.user?.username || 'Unknown',
  avatar: authStore.user?.avatar
    ? { src: authStore.user.avatar, alt: authStore.user.username }
    : undefined
}))

function handleLogout() {
  authStore.clearAuth()
  router.push('/login')
}

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar
}], [{
  label: '设置',
  icon: 'i-lucide-settings',
  to: '/settings'
}], [{
  label: '主题',
  icon: 'i-lucide-palette',
  children: [{
    label: '主色',
    slot: 'chip',
    chip: appConfig.ui.colors.primary,
    content: {
      align: 'center',
      collisionPadding: 16
    },
    children: colors.map(color => ({
      label: color,
      chip: color,
      slot: 'chip',
      checked: themeStore.primaryColor === color,
      type: 'checkbox',
      onSelect: (e) => {
        e.preventDefault()
        themeStore.setPrimary(color)
      }
    }))
  }, {
    label: '中性色',
    slot: 'chip',
    chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
    content: {
      align: 'end',
      collisionPadding: 16
    },
    children: neutrals.map(color => ({
      label: color,
      chip: color === 'neutral' ? 'old-neutral' : color,
      slot: 'chip',
      type: 'checkbox',
      checked: themeStore.neutralColor === color,
      onSelect: (e) => {
        e.preventDefault()
        themeStore.setNeutral(color)
      }
    }))
  }]
}, {
  label: '外观',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: '浅色',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.value = 'light'
    }
  }, {
    label: '深色',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onUpdateChecked(checked: boolean) {
      if (checked) {
        colorMode.value = 'dark'
      }
    },
    onSelect(e: Event) {
      e.preventDefault()
    }
  }]
}], [{
  label: '退出登录',
  icon: 'i-lucide-log-out',
  onSelect: handleLogout
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : user.name"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    >
      <template #leading>
        <UAvatar
          v-if="user.avatar?.src"
          :src="user.avatar.src"
          :alt="user.avatar.alt"
          size="sm"
        />
        <UAvatar
          v-else
          size="sm"
          class="bg-primary text-white font-medium"
        >
          {{ (authStore.user?.username || 'U').charAt(0).toUpperCase() }}
        </UAvatar>
      </template>
    </UButton>

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
