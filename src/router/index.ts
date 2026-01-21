import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  routes: [
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
    }
  ],
  history: createWebHistory()
})
