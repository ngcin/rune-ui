<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const toast = useToast()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// 初始化主题
onMounted(() => {
  themeStore.initTheme()
})

const open = ref(false)

const links = [[
  // 团队成员功能组
  {
    label: '工作台',
    icon: 'i-lucide-layout-dashboard',
    to: '/workspace',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: '应用管理',
    icon: 'i-lucide-grid',
    to: '/workspace/apps',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: '知识库管理',
    icon: 'i-lucide-book-open',
    to: '/workspace/knowledge',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: '提示词模板',
    icon: 'i-lucide-message-square',
    to: '/workspace/prompts',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: '聊天对话',
    icon: 'i-lucide-message-circle',
    to: '/workspace/chat',
    onSelect: () => {
      open.value = false
    }
  }
], [
  // 超级管理员功能组
  {
    label: '系统管理',
    to: '/admin',
    icon: 'i-lucide-shield',
    defaultOpen: false,
    type: 'trigger',
    children: [{
      label: '用户管理',
      to: '/admin/users',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: '模型配置',
      to: '/admin/models',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: '工作空间',
      to: '/admin/workspaces',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: '嵌入式管理',
      to: '/admin/embed',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: '系统设置',
      to: '/admin/settings',
      onSelect: () => {
        open.value = false
      }
    }]
  }
], [
  // 外部链接组（保留）
  {
    label: 'Feedback',
    icon: 'i-lucide-message-circle',
    to: 'https://github.com/nuxt-ui-templates/dashboard-vue',
    target: '_blank'
  }, {
    label: 'Help & Support',
    icon: 'i-lucide-info',
    to: 'https://github.com/nuxt/ui',
    target: '_blank'
  }
]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'simple-icons:github',
    to: `https://github.com/nuxt-ui-templates/dashboard-vue/blob/main/src/views${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

const navigationUI = {
  wrapper: 'space-y-1',
  link: 'py-2.5',
  label: 'text-lg font-medium',
  icon: 'size-6'
}

const mainLinks = computed(() => [...links[0], ...links[1]])

const cookie = useStorage('cookie-consent', 'pending')
if (cookie.value !== 'accepted') {
  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
}
</script>

<template>
  <Suspense>
    <UApp>
      <!-- 登录页面 - 不显示 Dashboard 布局 -->
      <RouterView v-if="!authStore.isAuthenticated" />

      <!-- 业务页面 - 显示完整 Dashboard 布局 -->
      <UDashboardGroup v-else unit="rem" storage="local">
        <UDashboardSidebar
          id="default"
          v-model:open="open"
          collapsible
          resizable
          class="bg-elevated/25"
          :ui="{ footer: 'lg:border-t lg:border-default' }"
        >
          <template #header="{ collapsed }">
            <div class="flex flex-col gap-2 w-full pt-2">
              <!-- Logo 和系统名称 + 收缩按钮 -->
              <div class="flex items-center w-full px-2" :class="collapsed ? 'justify-center' : 'justify-between'">
                <!-- Logo + 系统名称（展开时显示） -->
                <div v-if="!collapsed" class="flex items-center gap-2">
                  <UIcon name="i-lucide-sparkles" class="text-xl text-primary" />
                  <span class="text-base font-semibold">RuneAI</span>
                </div>

                <!-- 收缩/展开按钮 -->
                <UDashboardSidebarCollapse />
              </div>
            </div>
          </template>

          <template #default="{ collapsed }">
            <!-- 团队切换 -->
            <TeamsMenu :collapsed="collapsed" class="mb-1" />

            <!-- 主导航菜单 -->
            <UNavigationMenu
              :collapsed="collapsed"
              :items="mainLinks"
              :ui="navigationUI"
              orientation="vertical"
              tooltip
              popover
            />

            <!-- 外部链接组 -->
            <UNavigationMenu
              :collapsed="collapsed"
              :items="links[2]"
              :ui="navigationUI"
              orientation="vertical"
              tooltip
              class="mt-auto"
            />
          </template>

          <template #footer="{ collapsed }">
            <UserMenu :collapsed="collapsed" />
          </template>
        </UDashboardSidebar>

        <UDashboardSearch :groups="groups" />

        <RouterView />

        <NotificationsSlideover />
      </UDashboardGroup>
    </UApp>
  </Suspense>
</template>
