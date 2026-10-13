import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth,
    cover_letter,
    profile,
    resume,
    career_assistant,
    interview_agent,
    voice_resume,
    knowledge_base,
    matching,
    skill_gap,
    customization,
)
from app.database import Base, engine
from app import models

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Career Companion Agent API",
    description=(
        "AI Career Companion Agent for Internship Matching and Interview Preparation — "
        "Backend Platform. Features: Resume parsing, ATS scoring (TF-IDF), "
        "Semantic matching (FAISS), Skill gap analysis (Groq LLM), "
        "CV generation (ReportLab), RAG Knowledge Base, Interview Prep."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ──────────────────────────────────────────────────────────────────
# CORS Configuration
# ──────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "*",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Template"],
)

# ──────────────────────────────────────────────────────────────────
# Mount Routers
# ──────────────────────────────────────────────────────────────────

# Auth & Profile
app.include_router(auth.router)
app.include_router(profile.router)

# Resume Management
app.include_router(resume.router)

# Cover Letter
app.include_router(cover_letter.router)

# Career Assistant (RAG chat)
app.include_router(career_assistant.router)

# Interview Preparation Agent
app.include_router(interview_agent.router)

# Voice Resume
app.include_router(voice_resume.router)

# Knowledge Base (Internship Directory + RAG Q&A)
app.include_router(knowledge_base.router)

# Job Matching (FAISS + TF-IDF + LLM)
app.include_router(matching.router)

# Skill Gap Analysis (LLM-powered)
app.include_router(skill_gap.router)

# Customization (Resume Tailor + CV PDF)
app.include_router(customization.router)


# ──────────────────────────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def home():
    return {
        "message": "AI Career Companion Agent API v2.0 is Running 🚀",
        "status": "healthy",
        "features": [
            "Resume Parsing",
            "ATS Scoring (TF-IDF)",
            "Internship Matching (FAISS + LLM)",
            "Knowledge Base (RAG)",
            "Skill Gap Analysis",
            "CV Generation (ReportLab)",
            "Interview Prep Agent",
            "Voice Resume Builder",
            "Career Assistant (RAG Chat)",
        ],
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "2.0.0"}
