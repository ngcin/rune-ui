// API Response Types
export interface Result<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// Auth Types
export interface CaptchaResponse {
  key: string
  image: string // base64 encoded image
}

export interface LoginRequest {
  username: string
  password: string
  captchaKey: string
  captchaAnswer: string
}

export interface UserInfo {
  id: string  // Snowflake ID 超过 JS 安全范围
  username: string
  nickname: string
  avatar: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

// Pagination Types
export interface PageParams {
  current: number
  size: number
}

export interface PageResult<T> {
  records: T[]
  total: string   // 可能为大数值
  current: number // 页码通常较小
  size: number    // 每页大小通常较小
  pages: string   // 总页数可能很大
}

// User Types
export type UserStatus = 0 | 1  // 0=disabled, 1=enabled

export interface SysUser {
  id: string  // Snowflake ID
  username: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
  status: UserStatus
  remark?: string
  createTime: string
  updateTime: string
}

export interface UserCreateRequest {
  username: string
  password: string
  email?: string
  phone?: string
  nickname?: string
  avatar?: string
  status?: UserStatus
  remark?: string
}

export interface UserUpdateRequest {
  username?: string
  password?: string
  email?: string
  phone?: string
  nickname?: string
  avatar?: string
  status?: UserStatus
  remark?: string
}

export interface UserQuery {
  username?: string
  nickname?: string
  email?: string
  phone?: string
  status?: UserStatus
  keyword?: string
}
