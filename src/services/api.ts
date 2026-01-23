import { ofetch } from 'ofetch'
import type { Result, CaptchaResponse, LoginRequest, LoginResponse, SysUser, UserCreateRequest, UserUpdateRequest, UserQuery, PageParams, PageResult, Workspace, WorkspaceRequest, WorkspaceQuery, WorkspaceMember, WorkspaceMemberRequest } from '@/types/api'

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

// User API
export const usersApi = {
  // Get paginated user list
  page: (params: PageParams & UserQuery) =>
    request<PageResult<SysUser>>('/api/sys/users', { params }),

  // Get user by id
  getById: (id: string) =>
    request<SysUser>(`/api/sys/users/${id}`),

  // Create user
  create: (data: UserCreateRequest) =>
    request<void>('/api/sys/users', { method: 'POST', body: data }),

  // Update user
  update: (id: string, data: UserUpdateRequest) =>
    request<void>(`/api/sys/users/${id}`, { method: 'PUT', body: data }),

  // Delete user (soft delete)
  delete: (id: string) =>
    request<void>(`/api/sys/users/${id}`, { method: 'DELETE' }),

  // Update user status
  updateStatus: (id: string, status: number) =>
    request<void>(`/api/sys/users/${id}/status`, { method: 'PUT', params: { status } }),

  // Reset password
  resetPassword: (id: string, password: string) =>
    request<void>(`/api/sys/users/${id}/reset-pwd`, { method: 'PUT', params: { password } }),
}

// Re-export api instance for custom requests
export { apiInstance as fetch }

// Default export for convenience
export const api = {
  auth: authApi,
  users: usersApi,
}

// Workspace API
export const workspacesApi = {
  // List all workspaces (returns list directly, no pagination)
  list: (params?: WorkspaceQuery): Promise<Workspace[]> =>
    request<Workspace[]>('/api/sys/workspaces', { params }),

  getById: (id: string) =>
    request<Workspace>(`/api/sys/workspaces/${id}`),

  create: (data: WorkspaceRequest) =>
    request<Workspace>('/api/sys/workspaces', { method: 'POST', body: data }),

  update: (id: string, data: WorkspaceRequest) =>
    request<Workspace>(`/api/sys/workspaces/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    request<void>(`/api/sys/workspaces/${id}`, { method: 'DELETE' }),

  // Workspace Members
  pageMembers: (workspaceId: string, params: PageParams & Omit<WorkspaceQuery, 'status'>) =>
    request<PageResult<WorkspaceMember>>(`/api/sys/workspaces/${workspaceId}/members`, { params }),

  addMember: (workspaceId: string, data: WorkspaceMemberRequest) =>
    request<void>(`/api/sys/workspaces/${workspaceId}/members`, { method: 'POST', body: data }),

  removeMember: (workspaceId: string, userId: string) =>
    request<void>(`/api/sys/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' }),

  updateMemberRole: (workspaceId: string, userId: string, role: string) =>
    request<void>(`/api/sys/workspaces/${workspaceId}/members/${userId}/role`, { method: 'PUT', body: { role } }),
}
