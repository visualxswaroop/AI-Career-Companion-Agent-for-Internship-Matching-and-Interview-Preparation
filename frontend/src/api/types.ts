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

export const RESUME_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const RESUME_ALLOWED_EXTENSIONS = ['.pdf', '.docx'] as const

export interface ResumeData {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  linkedin?: string | null
  github?: string | null
  professional_summary?: string | null
  skills?: string[]
  education?: string[]
  work_experience?: string[]
  projects?: string[]
  certifications?: string[]
  internships?: string[]
  languages?: string[]
  achievements?: string[]
  technical_skills?: string[]
  soft_skills?: string[]
}

export interface ResumeResponse {
  resume_id: number
  filename: string
  file_path: string
  uploaded_at?: string | null
  extracted_data: ResumeData
}

export interface ResumeUploadResponse {
  message: string
  resume_id: number
  filename: string
  extracted_data: ResumeData
}

export interface ResumeListResponse {
  count: number
  resumes: ResumeResponse[]
}

export interface InternshipData {
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

export interface InternshipMatch {
  rank: number
  internship: InternshipData
  similarity_score: number
  adjusted_similarity_score?: number | null
  skill_analysis?: {
    required_skills_matched?: number
    required_skills_total?: number
    preferred_skills_matched?: number
    preferred_skills_total?: number
    required_coverage_percent?: number
    skill_gap?: string[]
  } | null
  explanation?: {
    match_rating?: string
    recommendation_summary?: string
  } | null
}

export interface SemanticSearchResponse {
  message: string
  total_results: number
  results: InternshipMatch[]
}

export interface CoverLetterRequest {
  resume_id: number
  internship_id: string | number
}

export interface CoverLetterResponse {
  resume_id: number
  internship_id: string
  company: string
  role_title: string
  cover_letter: string
  generation_method: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Career Assistant Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  conversation_history?: ChatMessage[]
}

export interface ChatSource {
  section: string
  topic: string
  source: string
  score: number
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
  retrieval_used: boolean
  generation_method: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Interview Agent Types (Phase A & B)
// ─────────────────────────────────────────────────────────────────────────────

export interface InterviewDocumentResponse {
  id: number
  filename: string
  file_type: string
  chunk_count: number
  text_length?: number | null
  uploaded_at?: string | null
  is_active: boolean
}

export interface InterviewChatRequest {
  message: string
  target_role?: string
  conversation_history?: ChatMessage[]
}

export interface InterviewMilestone {
  period: string
  title: string
  focus: string[]
}

export interface InterviewRoadmapData {
  role: string
  duration: string
  milestones: InterviewMilestone[]
}

export interface InterviewChatResponse {
  answer: string
  target_role?: string
  has_resume: boolean
  has_document?: boolean
  active_document?: InterviewDocumentResponse | null
  generation_method: string
  roadmap_data?: InterviewRoadmapData | null
}

export interface InterviewAgentContextResponse {
  has_resume: boolean
  candidate_name?: string
  skills_count: number
  skills: string[]
  projects_count: number
  projects: string[]
  recommended_roles: string[]
  target_role?: string
  has_document?: boolean
  active_document?: InterviewDocumentResponse | null
}


// ─────────────────────────────────────────────────────────────────────────────
// Voice Resume Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VoiceResumeExtractRequest {
  transcript: string
  /** Reuses ChatMessage — same shape as career assistant history */
  conversation_history?: ChatMessage[]
  language_hint?: string
}

export interface VoiceResumeExtractResponse {
  extracted_data: ResumeData
  missing_fields: string[]
  follow_up_question: string | null
  is_complete: boolean
  detected_language: string
}

export interface VoiceResumeGenerateRequest {
  extracted_data: ResumeData
  /** "auto" | "technical" | "blue-collar" */
  template_hint?: string
}

export interface VoiceResumeGenerateResponse {
  resume_text: string
  template_used: string
  generation_method: string
}
