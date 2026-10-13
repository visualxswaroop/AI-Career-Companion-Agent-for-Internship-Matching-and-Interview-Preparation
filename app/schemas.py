from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List, Any
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

class ProfileCreate(BaseModel):
    phone: str | None = None
    address: str | None = None
    linkedin: str | None = None
    github: str | None = None
    summary: str | None = None


class ProfileUpdate(BaseModel):
    phone: str | None = None
    address: str | None = None
    linkedin: str | None = None
    github: str | None = None
    summary: str | None = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    phone: str | None = None
    address: str | None = None
    linkedin: str | None = None
    github: str | None = None
    summary: str | None = None

    class Config:
        from_attributes = True

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

# =========================================================
# RESUME SCHEMAS
# =========================================================

class ResumeData(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    linkedin: str | None = None
    github: str | None = None
    professional_summary: str | None = None

    skills: list[str] = []

    education: list[str] = []
    work_experience: list[str] = []
    projects: list[str] = []
    certifications: list[str] = []
    internships: list[str] = []
    languages: list[str] = []
    achievements: list[str] = []

    technical_skills: list[str] = []
    soft_skills: list[str] = []


class ResumeResponse(BaseModel):
    resume_id: int
    filename: str
    file_path: str
    uploaded_at: datetime | None = None
    extracted_data: ResumeData


class ResumeUploadResponse(BaseModel):
    message: str
    resume_id: int
    filename: str
    extracted_data: ResumeData


class ResumeListResponse(BaseModel):
    count: int
    resumes: list[ResumeResponse]

# =========================================================
# AUTH RESPONSE SCHEMAS
# =========================================================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class MessageResponse(BaseModel):
    message: str


# =========================================================
# PROFILE RESPONSE SCHEMA
# =========================================================

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    phone: str | None = None
    address: str | None = None
    linkedin: str | None = None
    github: str | None = None
    summary: str | None = None

    model_config = {
        "from_attributes": True
    }


# =========================================================
# SEMANTIC SEARCH SCHEMAS
# =========================================================

class InternshipData(BaseModel):
    id: str
    company: str
    role_title: str
    domain: str
    location: str
    mode: str
    duration_weeks: int
    stipend_inr_per_month: int
    min_education: str
    required_skills: list[str]
    preferred_skills: list[str]
    description: str


class InternshipMatch(BaseModel):
    rank: int
    internship: InternshipData
    similarity_score: float
    adjusted_similarity_score: Optional[float] = None
    skill_analysis: Optional[Dict[str, Any]] = None
    explanation: Optional[Dict[str, Any]] = None


class SemanticSearchRequest(BaseModel):
    resume_id: int
    top_k: int = 5


class SemanticSearchResponse(BaseModel):
    message: str
    total_results: int
    results: list[InternshipMatch]


# =========================================================
# COVER LETTER SCHEMAS
# =========================================================

class CoverLetterRequest(BaseModel):
    resume_id: int
    internship_id: str | int


class CoverLetterResponse(BaseModel):
    resume_id: int
    internship_id: str
    company: str
    role_title: str
    cover_letter: str
    generation_method: str


# =========================================================
# CAREER ASSISTANT SCHEMAS
# =========================================================

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = None


class ChatSource(BaseModel):
    section: str
    topic: str
    source: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource] = []
    retrieval_used: bool = False
    generation_method: str = "unknown"


# =========================================================
# INTERVIEW AGENT SCHEMAS (PHASE A & B)
# =========================================================

class InterviewDocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    chunk_count: int = 0
    text_length: Optional[int] = None
    uploaded_at: Optional[datetime] = None
    is_active: bool = True


class InterviewChatRequest(BaseModel):
    message: str
    target_role: Optional[str] = None
    conversation_history: Optional[List[ChatMessage]] = None


class InterviewChatResponse(BaseModel):
    answer: str
    target_role: Optional[str] = None
    has_resume: bool = False
    has_document: bool = False
    active_document: Optional[Dict[str, Any]] = None
    generation_method: str = "llm"
    roadmap_data: Optional[Dict[str, Any]] = None


class InterviewAgentContextResponse(BaseModel):
    has_resume: bool
    candidate_name: Optional[str] = None
    skills_count: int = 0
    skills: List[str] = []
    projects_count: int = 0
    projects: List[str] = []
    recommended_roles: List[str] = []
    target_role: Optional[str] = None
    has_document: bool = False
    active_document: Optional[Dict[str, Any]] = None


# =========================================================
# VOICE RESUME SCHEMAS
# =========================================================

class VoiceResumeExtractRequest(BaseModel):
    transcript: str
    # Reuses ChatMessage (defined above) for conversation history turns
    conversation_history: Optional[List[ChatMessage]] = None
    language_hint: Optional[str] = None


class VoiceResumeExtractResponse(BaseModel):
    extracted_data: ResumeData
    missing_fields: List[str]
    follow_up_question: Optional[str] = None
    is_complete: bool
    detected_language: str


class VoiceResumeGenerateRequest(BaseModel):
    extracted_data: ResumeData
    # "auto" lets the LLM decide; "technical" or "blue-collar" forces a template
    template_hint: Optional[str] = "auto"


class VoiceResumeGenerateResponse(BaseModel):
    resume_text: str
    template_used: str
    generation_method: str


class VoiceResumeTranscribeResponse(BaseModel):
    transcript: str
    language: Optional[str] = "en"


# =========================================================
# ATS SCORER SCHEMAS
# =========================================================

class ATSScoreRequest(BaseModel):
    resume_id: int
    job_description: str


class ATSSectionFeedback(BaseModel):
    score: float
    present: bool
    feedback: str


class ATSScoreResponse(BaseModel):
    ats_score: int
    similarity_score: float
    matched_keywords: List[str]
    missing_keywords: List[str]
    keyword_coverage: float
    section_feedback: Dict[str, Any]
    recommendation: str


# =========================================================
# KNOWLEDGE BASE SCHEMAS
# =========================================================

class KBInternship(BaseModel):
    id: str
    company: str
    role_title: str
    domain: str
    location: str
    mode: str
    duration_weeks: int
    stipend_inr_per_month: int
    min_education: str
    required_skills: List[str]
    preferred_skills: List[str]
    description: str


class KBListResponse(BaseModel):
    total: int
    domains: List[str]
    internships: List[KBInternship]


class KBQueryRequest(BaseModel):
    question: str
    conversation_history: Optional[List[ChatMessage]] = None


class KBQueryResponse(BaseModel):
    answer: str
    sources: List[ChatSource] = []
    retrieval_used: bool = False
    generation_method: str = "llm"


# =========================================================
# JOB MATCHING SCHEMAS
# =========================================================

class JobMatchRequest(BaseModel):
    resume_id: int
    top_k: int = 10
    threshold: float = 0.0   # 0–100 filter slider


class RoadmapStep(BaseModel):
    step: int
    title: str
    description: str
    duration_weeks: int
    priority: str = "medium"


class CourseRecommendation(BaseModel):
    title: str
    platform: str
    url: str
    estimated_hours: int


class ProjectIdea(BaseModel):
    title: str
    description: str
    tech_stack: List[str]


# =========================================================
# SKILL GAP SCHEMAS
# =========================================================

class SkillGapRequest(BaseModel):
    resume_id: int
    target_role: str


class SkillGapResponse(BaseModel):
    target_role: str
    current_skills: List[str]
    required_skills: List[str]
    matched_skills: List[str]
    missing_skills: List[str]
    overall_readiness_pct: int
    readiness_label: str
    roadmap: List[Dict[str, Any]]
    courses: List[Dict[str, Any]]
    project_ideas: List[Dict[str, Any]]


# =========================================================
# CUSTOMIZER / RESUME TAILORING SCHEMAS
# =========================================================

class TailorResumeRequest(BaseModel):
    resume_id: int
    job_description: str
    target_role: Optional[str] = ""


class TailorResumeResponse(BaseModel):
    tailored_summary: str
    suggested_skills: List[str]
    bullet_improvements: List[Dict[str, str]]
    cover_points: List[str]
    keyword_density_tips: List[str]


class CVGenerateRequest(BaseModel):
    resume_id: int
    template: str = "professional"   # "professional" | "modern" | "academic"
    custom_data: Optional[Dict[str, Any]] = None


# =========================================================
# CAREER ASSISTANT EXPORT SCHEMAS
# =========================================================

class ExportChatRequest(BaseModel):
    messages: List[ChatMessage]
    format: str = "md"   # "md" | "txt" | "pdf"
    title: Optional[str] = "Career Assistant Conversation"
