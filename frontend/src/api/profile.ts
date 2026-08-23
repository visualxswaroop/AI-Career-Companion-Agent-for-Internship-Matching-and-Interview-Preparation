import { request, ApiRequestError } from './client'
import type { ProfileCreate, ProfileResponse, ProfileUpdate } from './types'

export const profileApi = {
  async getProfile(token: string): Promise<ProfileResponse | null> {
    try {
      return await request<ProfileResponse>('/profile', {
        method: 'GET',
        token,
      })
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        return null
      }
      throw err
    }
  },

  async createProfile(data: ProfileCreate, token: string): Promise<ProfileResponse> {
    return request<ProfileResponse>('/profile', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },

  async updateProfile(data: ProfileUpdate, token: string): Promise<ProfileResponse> {
    return request<ProfileResponse>('/profile', {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    })
  },

  async deleteProfile(token: string): Promise<void> {
    return request<void>('/profile', {
      method: 'DELETE',
      token,
    })
  },
}
