from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, cover_letter, profile, resume, career_assistant, interview_agent, voice_resume
from app.database import Base, engine
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CareerForge AI API",
    description="CareerForge AI — Backend & Career Companion Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(resume.router)
app.include_router(cover_letter.router)
app.include_router(career_assistant.router)
app.include_router(interview_agent.router)
app.include_router(voice_resume.router)

@app.get("/")
def home():
    return {
        "message": "CareerForge AI API is Running 🚀",
        "status": "healthy"
    }
