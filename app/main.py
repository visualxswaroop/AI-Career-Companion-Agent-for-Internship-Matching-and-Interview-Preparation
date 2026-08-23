from fastapi import FastAPI
from app.routers import auth, cover_letter, profile, resume
from app.database import Base, engine
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Resume Parser API",
    description="Infosys Springboard Assignment",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(resume.router)
app.include_router(cover_letter.router)

@app.get("/")
def home():
    return {
        "message": "Resume Parser API is Running 🚀"
    }
