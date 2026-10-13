"""
Customization Router — Resume tailoring, cover letter generation, CV PDF download.

Endpoints:
  POST /customization/tailor          AI resume tailoring to a JD
  POST /customization/generate-cv     Generate PDF CV with chosen template
  GET  /customization/cv-templates    List available CV templates
"""

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.services.skill_gap_service import tailor_resume
from app.services.cv_generator import generate_cv_pdf

router = APIRouter(
    prefix="/customization",
    tags=["Customization"],
)

CV_TEMPLATES = [
    {
        "id": "professional",
        "name": "Professional",
        "description": "Classic two-column layout with deep indigo header. Ideal for corporate roles.",
        "color": "#1E1B4B",
    },
    {
        "id": "modern",
        "name": "Modern",
        "description": "Dark header with cyan accents and clean typography. Great for tech startups.",
        "color": "#0F172A",
    },
    {
        "id": "academic",
        "name": "Academic",
        "description": "Single-column serif layout with purple accents. Perfect for research and academia.",
        "color": "#1A1A2E",
    },
]


def _get_resume_data(resume_id: int, user_id: int, db: Session) -> tuple[models.Resume, dict[str, Any]]:
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == user_id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.extracted_data:
        raise HTTPException(status_code=400, detail="Resume has no extracted data")
    try:
        return resume, json.loads(resume.extracted_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Resume data is corrupted")


# ──────────────────────────────────────────────────────────────────
# GET /cv-templates
# ──────────────────────────────────────────────────────────────────

@router.get(
    "/cv-templates",
    summary="List available CV templates",
)
def list_templates(
    current_user: models.User = Depends(get_current_user),
) -> dict:
    return {"templates": CV_TEMPLATES}


# ──────────────────────────────────────────────────────────────────
# POST /tailor
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/tailor",
    response_model=schemas.TailorResumeResponse,
    summary="Tailor resume to a specific job description",
)
def tailor(
    request: schemas.TailorResumeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    AI-powered resume tailoring:
    - Rewrite summary to match JD
    - Suggest missing keywords to add
    - Improve experience bullet points
    - Generate cover letter talking points
    """
    if not request.job_description.strip():
        raise HTTPException(status_code=422, detail="Job description is required.")

    _, extracted_data = _get_resume_data(request.resume_id, current_user.id, db)

    try:
        result = tailor_resume(
            extracted_data,
            request.job_description,
            request.target_role or "",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume tailoring failed: {e}")

    return schemas.TailorResumeResponse(**result)


# ──────────────────────────────────────────────────────────────────
# POST /generate-cv
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/generate-cv",
    summary="Generate a PDF CV from parsed resume data",
    response_class=Response,
)
def generate_cv(
    request: schemas.CVGenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Generate a vector-crisp PDF CV using ReportLab.
    Returns the PDF binary directly as an attachment.

    Templates: professional | modern | academic
    """
    valid_templates = {t["id"] for t in CV_TEMPLATES}
    if request.template not in valid_templates:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid template. Choose from: {', '.join(valid_templates)}",
        )

    resume, extracted_data = _get_resume_data(request.resume_id, current_user.id, db)
    if request.custom_data and isinstance(request.custom_data, dict):
        extracted_data = {**extracted_data, **request.custom_data}

    try:
        pdf_bytes = generate_cv_pdf(extracted_data, template=request.template)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV generation failed: {e}")

    name = (extracted_data.get("full_name") or "cv").replace(" ", "_")
    filename = f"{name}_{request.template}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Template": request.template,
        },
    )
