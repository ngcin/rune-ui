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
  id: number
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
  total: number
  current: number
  size: number
  pages: number
}
