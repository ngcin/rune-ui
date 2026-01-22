import { ofetch } from 'ofetch'
import type { Result, CaptchaResponse, LoginRequest, LoginResponse } from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Create ofetch instance with base URL
const apiInstance = ofetch.create({
  baseURL: API_BASE_URL,
  onRequest({ options }) {
    // Add JWT token from localStorage
    const token = localStorage.getItem('token')
    if (token) {
      options.headers = new Headers(options.headers)
      ;(options.headers as Headers).set('Authorization', `Bearer ${token}`)
    }
  },
  onResponseError({ response }) {
    // Handle 401 unauthorized - clear token and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    // Throw error with message from response
    const error = response._data?.message || '请求失败'
    throw new Error(error)
  },
})

// Helper function to unwrap Result<T> data
async function request<T>(url: string, options?: any): Promise<T> {
  const response = await apiInstance<Result<T>>(url, options)
  return response.data
}

// Auth API
export const authApi = {
  // Get captcha
  getCaptcha: () => request<CaptchaResponse>('/api/auth/captcha'),

  // Login
  login: (data: LoginRequest) => request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: data,
  }),

  // Logout (optional - if backend provides this endpoint)
  logout: () => request<void>('/api/auth/logout', {
    method: 'POST',
  }),
}

// Re-export api instance for custom requests
export { apiInstance as fetch }

// Default export for convenience
export const api = {
  auth: authApi,
}
