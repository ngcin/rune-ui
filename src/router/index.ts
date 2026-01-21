import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  routes: [
    // 原有路由
    { path: '/', component: () => import('../views/index.vue') },
    { path: '/inbox', component: () => import('../views/inbox.vue') },
    { path: '/customers', component: () => import('../views/customers.vue') },
    {
      path: '/settings',
      component: () => import('../views/settings.vue'),
      children: [
        { path: '', component: () => import('../views/settings/index.vue') },
        { path: 'members', component: () => import('../views/settings/members.vue') },
        { path: 'notifications', component: () => import('../views/settings/notifications.vue') },
        { path: 'security', component: () => import('../views/settings/security.vue') },
      ]
    },
    // 团队成员功能
    { path: '/workspace', component: () => import('../views/workspace/index.vue') },
    { path: '/workspace/apps', component: () => import('../views/workspace/apps.vue') },
    { path: '/workspace/knowledge', component: () => import('../views/workspace/knowledge.vue') },
    { path: '/workspace/prompts', component: () => import('../views/workspace/prompts.vue') },
    { path: '/workspace/chat', component: () => import('../views/workspace/chat.vue') },
    // 超级管理员功能
    { path: '/admin', component: () => import('../views/admin/index.vue') },
    { path: '/admin/users', component: () => import('../views/admin/users.vue') },
    { path: '/admin/models', component: () => import('../views/admin/models.vue') },
    { path: '/admin/workspaces', component: () => import('../views/admin/workspaces.vue') },
    { path: '/admin/embed', component: () => import('../views/admin/embed.vue') },
    { path: '/admin/settings', component: () => import('../views/admin/settings.vue') }
  ],
  history: createWebHistory()
})
