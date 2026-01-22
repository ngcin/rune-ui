import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  routes: [
    // 登录页面
    { path: '/login', component: () => import('../views/login.vue'), meta: { requiresAuth: false } },
    // 原有路由
    { path: '/', component: () => import('../views/index.vue'), meta: { requiresAuth: true } },
    { path: '/inbox', component: () => import('../views/inbox.vue'), meta: { requiresAuth: true } },
    { path: '/customers', component: () => import('../views/customers.vue'), meta: { requiresAuth: true } },
    {
      path: '/settings',
      component: () => import('../views/settings.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', component: () => import('../views/settings/index.vue') },
        { path: 'members', component: () => import('../views/settings/members.vue') },
        { path: 'notifications', component: () => import('../views/settings/notifications.vue') },
        { path: 'security', component: () => import('../views/settings/security.vue') },
      ]
    },
    // 团队成员功能
    { path: '/workspace', component: () => import('../views/workspace/index.vue'), meta: { requiresAuth: true } },
    { path: '/workspace/apps', component: () => import('../views/workspace/apps.vue'), meta: { requiresAuth: true } },
    { path: '/workspace/knowledge', component: () => import('../views/workspace/knowledge.vue'), meta: { requiresAuth: true } },
    { path: '/workspace/prompts', component: () => import('../views/workspace/prompts.vue'), meta: { requiresAuth: true } },
    { path: '/workspace/chat', component: () => import('../views/workspace/chat.vue'), meta: { requiresAuth: true } },
    // 超级管理员功能
    { path: '/admin', component: () => import('../views/admin/index.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/users', component: () => import('../views/admin/users.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/models', component: () => import('../views/admin/models.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/workspaces', component: () => import('../views/admin/workspaces.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/embed', component: () => import('../views/admin/embed.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/settings', component: () => import('../views/admin/settings.vue'), meta: { requiresAuth: true, requiresAdmin: true } }
  ],
  history: createWebHistory()
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (requiresAdmin && !authStore.isAdmin) {
    // Redirect to home if not admin
    next({ path: '/' })
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // Redirect to home if already logged in
    next({ path: '/' })
  } else {
    next()
  }
})
