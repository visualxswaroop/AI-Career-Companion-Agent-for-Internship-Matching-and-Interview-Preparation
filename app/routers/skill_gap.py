"""
Skill Gap Router — LLM-powered skill gap analysis and learning roadmap.

Endpoints:
  POST /skill-gap/analyze     Analyze skill gap for a target role
  GET  /skill-gap/roles       Suggest popular target roles based on resume
"""

import json
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from groq import Groq

from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.services.skill_gap_service import analyze_skill_gap

router = APIRouter(
    prefix="/skill-gap",
    tags=["Skill Gap"],
)


def _get_resume_data(resume_id: int, user_id: int, db: Session) -> dict[str, Any]:
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == user_id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.extracted_data:
        raise HTTPException(status_code=400, detail="Resume has no extracted data")
    try:
        return json.loads(resume.extracted_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Resume data is corrupted")


# ──────────────────────────────────────────────────────────────────
# POST /analyze
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=schemas.SkillGapResponse,
    summary="Analyze skill gap for a target role",
)
def analyze(
    request: schemas.SkillGapRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    LLM-powered skill gap analysis:
    - Compare current skills vs role requirements
    - Generate a prioritized learning roadmap
    - Recommend courses and project ideas
    - Return readiness percentage
    """
    if not request.target_role.strip():
        raise HTTPException(status_code=422, detail="Target role cannot be empty.")

    extracted_data = _get_resume_data(request.resume_id, current_user.id, db)

    try:
        result = analyze_skill_gap(extracted_data, request.target_role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill gap analysis failed: {e}")

    return schemas.SkillGapResponse(**result)


# ──────────────────────────────────────────────────────────────────
# GET /roles — Suggest target roles based on resume
# ──────────────────────────────────────────────────────────────────

@router.get(
    "/roles",
    summary="Suggest target roles based on resume skills",
)
def suggest_roles(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> dict:
    """Return AI-suggested target roles based on candidate's skills."""
    extracted_data = _get_resume_data(resume_id, current_user.id, db)

    all_skills = list(dict.fromkeys(
        extracted_data.get("skills", []) +
        extracted_data.get("technical_skills", [])
    ))
    education = extracted_data.get("education", [])
    summary = extracted_data.get("professional_summary", "")

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a career advisor. Respond with valid JSON only.",
                },
                {
                    "role": "user",
                    "content": (
                        f"Given these skills: {json.dumps(all_skills[:20])}, "
                        f"education: {json.dumps(education[:3])}, "
                        f"summary: {summary[:300]}, "
                        "suggest 8 specific, concrete target roles this candidate could pursue. "
                        "Return JSON: {\"roles\": [\"...\", ...]}"
                    ),
                },
            ],
            max_tokens=400,
            temperature=0.3,
        )
        raw = resp.choices[0].message.content or ""
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(clean)
        roles = data.get("roles", [])
    except Exception:
        # Fallback: common roles
        roles = [
            "Software Engineer", "Data Analyst", "Machine Learning Engineer",
            "Full Stack Developer", "Backend Engineer", "Data Scientist",
            "DevOps Engineer", "Product Manager",
        ]

    return {"roles": roles[:10]}
