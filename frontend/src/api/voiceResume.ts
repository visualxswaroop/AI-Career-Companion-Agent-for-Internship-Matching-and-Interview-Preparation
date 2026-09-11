import { request } from './client'
import type {
  VoiceResumeExtractRequest,
  VoiceResumeExtractResponse,
  VoiceResumeGenerateRequest,
  VoiceResumeGenerateResponse,
} from './types'

export const voiceResumeApi = {
  /**
   * POST /voice-resume/extract
   * Send a spoken transcript (already transcribed client-side via Web Speech API)
   * and receive structured ResumeData fields plus a follow-up question if incomplete.
   */
  async extract(data: VoiceResumeExtractRequest, token: string): Promise<VoiceResumeExtractResponse> {
    return request<VoiceResumeExtractResponse>('/voice-resume/extract', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },

  /**
   * POST /voice-resume/generate
   * Send the accumulated extracted fields and receive a formatted ATS resume as plain text.
   */
  async generate(data: VoiceResumeGenerateRequest, token: string): Promise<VoiceResumeGenerateResponse> {
    return request<VoiceResumeGenerateResponse>('/voice-resume/generate', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },
}
