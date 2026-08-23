import { request } from './client'
import type {
  UserCreate,
  UserLogin,
  UserResponse,
  TokenResponse,
  ChangePassword,
  ForgotPassword,
  ForgotPasswordResponse,
  ResetPassword,
  MessageResponse,
} from './types'

export const authApi = {
  async register(data: UserCreate): Promise<UserResponse> {
    return request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async login(data: UserLogin): Promise<TokenResponse> {
    return request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getMe(token: string): Promise<UserResponse> {
    return request<UserResponse>('/auth/me', {
      method: 'GET',
      token,
    })
  },

  async logout(token: string): Promise<MessageResponse> {
    return request<MessageResponse>('/auth/logout', {
      method: 'POST',
      token,
    })
  },

  async changePassword(data: ChangePassword, token: string): Promise<MessageResponse> {
    return request<MessageResponse>('/auth/change-password', {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    })
  },

  async forgotPassword(data: ForgotPassword): Promise<ForgotPasswordResponse> {
    return request<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async resetPassword(data: ResetPassword): Promise<MessageResponse> {
    return request<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async deleteAccount(token: string): Promise<void> {
    return request<void>('/auth/account', {
      method: 'DELETE',
      token,
    })
  },
}
