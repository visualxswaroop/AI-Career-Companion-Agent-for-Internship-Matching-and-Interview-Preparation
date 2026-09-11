import { request } from './client'
import type { ChatRequest, ChatResponse } from './types'

export const careerAssistantApi = {
  async chat(data: ChatRequest, token: string): Promise<ChatResponse> {
    return request<ChatResponse>('/career-assistant/chat', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },

  async getStatus(token: string): Promise<{ ready: boolean; message: string }> {
    return request<{ ready: boolean; message: string }>('/career-assistant/status', {
      method: 'GET',
      token,
    })
  },
}
