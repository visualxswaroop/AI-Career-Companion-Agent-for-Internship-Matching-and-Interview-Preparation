import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.cover_letter_service import generate_cover_letter
from app.dependencies import get_current_user, get_db


router = APIRouter(
    prefix="/cover-letter",
    tags=["Cover Letter"]
)

INTERNSHIPS_PATH = Path("app") / "internships.json"


@lru_cache(maxsize=1)
def load_internships() -> list[Dict[str, Any]]:
    """Load the authoritative internship dataset once per application process."""
    with open(INTERNSHIPS_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def find_internship(internship_id: str | int) -> Optional[Dict[str, Any]]:
    requested_id = str(internship_id)
    return next(
        (
            internship for internship in load_internships()
            if str(internship.get("id")) == requested_id
        ),
        None
    )


@router.post(
    "/generate",
    response_model=schemas.CoverLetterResponse,
    status_code=200
)
def generate_personalized_cover_letter(
    request: schemas.CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate a grounded cover letter for the user's selected internship."""
    resume = db.query(models.Resume).filter(
        models.Resume.id == request.resume_id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this resume"
        )

    internship = find_internship(request.internship_id)
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")

    try:
        resume_data = json.loads(resume.extracted_data) if resume.extracted_data else {}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Resume data is invalid")

    if not isinstance(resume_data, dict) or not resume_data:
        raise HTTPException(
            status_code=400,
            detail="Resume has no extracted data. Please upload a valid resume."
        )

    generated = generate_cover_letter(resume_data, internship)

    return {
        "resume_id": resume.id,
        "internship_id": str(internship["id"]),
        "company": internship["company"],
        "role_title": internship["role_title"],
        "cover_letter": generated["cover_letter"],
        "generation_method": generated["generation_method"]
    }
