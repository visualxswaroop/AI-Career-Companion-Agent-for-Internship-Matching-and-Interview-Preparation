// ─────────────────────────────────────────────────────────────────────────────
// API TypeScript Types - Exactly matching FastAPI Pydantic Schemas
// ─────────────────────────────────────────────────────────────────────────────

export interface UserCreate {
  name: string
  email: string
  password: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserResponse {
  id: number
  name: string
  email: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface ProfileCreate {
  phone?: string | null
  address?: string | null
  linkedin?: string | null
  github?: string | null
  summary?: string | null
}

export interface ProfileUpdate {
  phone?: string | null
  address?: string | null
  linkedin?: string | null
  github?: string | null
  summary?: string | null
}

export interface ProfileResponse {
  id: number
  user_id: number
  phone?: string | null
  address?: string | null
  linkedin?: string | null
  github?: string | null
  summary?: string | null
}

export interface ChangePassword {
  current_password: string
  new_password: string
}

export interface ForgotPassword {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  reset_token: string
}

export interface ResetPassword {
  token: string
  new_password: string
}

export interface MessageResponse {
  message: string
}

export interface ApiError {
  detail: string | Array<{ msg?: string; message?: string; loc?: string[] }>
  status?: number
}
