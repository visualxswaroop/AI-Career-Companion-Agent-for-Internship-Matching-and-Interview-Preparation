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
