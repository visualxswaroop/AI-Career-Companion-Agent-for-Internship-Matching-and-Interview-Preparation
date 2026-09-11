import { request } from './client'
import type {
  InterviewChatRequest,
  InterviewChatResponse,
  InterviewAgentContextResponse,
  InterviewDocumentResponse,
} from './types'

export const interviewAgentApi = {
  async chat(data: InterviewChatRequest, token: string): Promise<InterviewChatResponse> {
    return request<InterviewChatResponse>('/interview-agent/chat', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },

  async getContext(token: string): Promise<InterviewAgentContextResponse> {
    return request<InterviewAgentContextResponse>('/interview-agent/context', {
      method: 'GET',
      token,
    })
  },

  async uploadDocument(file: File, token: string): Promise<InterviewDocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)

    return request<InterviewDocumentResponse>('/interview-agent/document/upload', {
      method: 'POST',
      token,
      body: formData,
    })
  },

  async getActiveDocument(token: string): Promise<InterviewDocumentResponse | null> {
    return request<InterviewDocumentResponse | null>('/interview-agent/document/active', {
      method: 'GET',
      token,
    })
  },

  async removeActiveDocument(token: string): Promise<{ message: string }> {
    return request<{ message: string }>('/interview-agent/document/active', {
      method: 'DELETE',
      token,
    })
  },

  async removeDocument(documentId: number, token: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/interview-agent/document/${documentId}`, {
      method: 'DELETE',
      token,
    })
  },
}
