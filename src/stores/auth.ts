import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<UserInfo | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  )

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.username === 'admin')
  const userRole = computed(() => {
    if (!user.value) return null
    return user.value.username === 'admin' ? 'SUPER_ADMIN' : 'NORMAL'
  })

  // Actions
  function setAuth(newToken: string, newUser: UserInfo) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function hasRole(role: string): boolean {
    if (!user.value) return false
    if (role === 'SUPER_ADMIN') return user.value.username === 'admin'
    return true // NORMAL users have basic access
  }

  function hasAnyRole(roles: string[]): boolean {
    return roles.some(role => hasRole(role))
  }

  return {
    // State
    token,
    user,
    // Getters
    isAuthenticated,
    isAdmin,
    userRole,
    // Actions
    setAuth,
    clearAuth,
    hasRole,
    hasAnyRole,
  }
})
