import { request } from './client'
import type {
  ResumeListResponse,
  ResumeResponse,
  ResumeUploadResponse,
  SemanticSearchResponse,
} from './types'

export const resumeApi = {
  async upload(file: File, token: string): Promise<ResumeUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    return request<ResumeUploadResponse>('/resume/upload', {
      method: 'POST',
      token,
      body: formData,
    })
  },

  async list(token: string): Promise<ResumeListResponse> {
    return request<ResumeListResponse>('/resume', {
      method: 'GET',
      token,
    })
  },

  async getById(resumeId: number, token: string): Promise<ResumeResponse> {
    return request<ResumeResponse>(`/resume/${resumeId}`, {
      method: 'GET',
      token,
    })
  },

  async matchInternships(resumeId: number, token: string, topK = 10): Promise<SemanticSearchResponse> {
    return request<SemanticSearchResponse>(`/resume/${resumeId}/match-internships`, {
      method: 'POST',
      token,
      body: JSON.stringify({ resume_id: resumeId, top_k: topK }),
    })
  },
}
