// ─────────────────────────────────────────────────────────────────────────────
// API Service Layer — Knowledge Base, Matching, Skill Gap, Customization
// ─────────────────────────────────────────────────────────────────────────────
import { request } from './client'

const tok = () => localStorage.getItem('token') || ''

// ── Types ────────────────────────────────────────────────────────

export interface KBInternship {
  id: string
  company: string
  role_title: string
  domain: string
  location: string
  mode: string
  duration_weeks: number
  stipend_inr_per_month: number
  min_education: string
  required_skills: string[]
  preferred_skills: string[]
  description: string
}

export interface KBListResponse {
  total: number
  domains: string[]
  internships: KBInternship[]
}

export interface KBQueryResponse {
  answer: string
  sources: { section: string; topic: string; source: string; score: number }[]
  retrieval_used: boolean
  generation_method: string
}

export interface InternshipMatch {
  rank: number
  internship: KBInternship
  similarity_score: number
  adjusted_similarity_score?: number
  skill_analysis?: Record<string, unknown>
  explanation?: Record<string, unknown>
}

export interface SemanticSearchResponse {
  message: string
  total_results: number
  results: InternshipMatch[]
}

export interface ATSScoreResponse {
  ats_score: number
  similarity_score: number
  matched_keywords: string[]
  missing_keywords: string[]
  keyword_coverage: number
  section_feedback: Record<string, { score: number; present: boolean; feedback: string }>
  recommendation: string
}

export interface SkillGapResponse {
  target_role: string
  current_skills: string[]
  required_skills: string[]
  matched_skills: string[]
  missing_skills: string[]
  overall_readiness_pct: number
  readiness_label: string
  roadmap: Array<{ step: number; title: string; description: string; duration_weeks: number; priority: string }>
  courses: Array<{ title: string; platform: string; url: string; estimated_hours: number }>
  project_ideas: Array<{ title: string; description: string; tech_stack: string[] }>
}

export interface TailorResumeResponse {
  tailored_summary: string
  suggested_skills: string[]
  bullet_improvements: Array<{ original: string; improved: string }>
  cover_points: string[]
  keyword_density_tips: string[]
}

// ── Knowledge Base ───────────────────────────────────────────────

export const knowledgeBaseApi = {
  listInternships: (params?: {
    domain?: string
    search?: string
    mode?: string
    limit?: number
    offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.domain) q.set('domain', params.domain)
    if (params?.search) q.set('search', params.search)
    if (params?.mode) q.set('mode', params.mode)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    const qs = q.toString()
    return request<KBListResponse>(`/knowledge-base/internships${qs ? `?${qs}` : ''}`, {
      token: tok(),
    })
  },

  getDomains: () =>
    request<{ domains: string[]; total: number }>('/knowledge-base/domains', { token: tok() }),

  getInternship: (id: string) =>
    request<KBInternship>(`/knowledge-base/internships/${id}`, { token: tok() }),

  query: (question: string, history?: { role: string; content: string }[]) =>
    request<KBQueryResponse>('/knowledge-base/query', {
      method: 'POST',
      token: tok(),
      body: JSON.stringify({ question, conversation_history: history || [] }),
    }),
}

// ── Matching ─────────────────────────────────────────────────────

export const matchingApi = {
  match: (resumeId: number, topK = 10, threshold = 0) =>
    request<SemanticSearchResponse>('/matching/match', {
      method: 'POST',
      token: tok(),
      body: JSON.stringify({ resume_id: resumeId, top_k: topK, threshold }),
    }),

  atsScore: (resumeId: number, jobDescription: string) =>
    request<ATSScoreResponse>('/matching/ats-score', {
      method: 'POST',
      token: tok(),
      body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
    }),
}

// ── Skill Gap ────────────────────────────────────────────────────

export const skillGapApi = {
  analyze: (resumeId: number, targetRole: string) =>
    request<SkillGapResponse>('/skill-gap/analyze', {
      method: 'POST',
      token: tok(),
      body: JSON.stringify({ resume_id: resumeId, target_role: targetRole }),
    }),

  suggestRoles: (resumeId: number) =>
    request<{ roles: string[] }>(`/skill-gap/roles?resume_id=${resumeId}`, { token: tok() }),
}

// ── Customization ────────────────────────────────────────────────

export const customizationApi = {
  getTemplates: () =>
    request<{ templates: Array<{ id: string; name: string; description: string; color: string }> }>(
      '/customization/cv-templates',
      { token: tok() }
    ),

  tailorResume: (resumeId: number, jobDescription: string, targetRole?: string) =>
    request<TailorResumeResponse>('/customization/tailor', {
      method: 'POST',
      token: tok(),
      body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription, target_role: targetRole || '' }),
    }),

  generateCV: async (resumeId: number, template: string, customData?: Record<string, any>): Promise<Blob> => {
    const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const token = localStorage.getItem('token') || ''
    const res = await fetch(`${API_BASE}/customization/generate-cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ resume_id: resumeId, template, custom_data: customData }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'CV generation failed' }))
      throw new Error(err.detail || 'CV generation failed')
    }
    return res.blob()
  },
}
