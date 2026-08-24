import { request } from './client'
import type { CoverLetterRequest, CoverLetterResponse } from './types'

export const coverLetterApi = {
  async generate(data: CoverLetterRequest, token: string): Promise<CoverLetterResponse> {
    return request<CoverLetterResponse>('/cover-letter/generate', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },
}
