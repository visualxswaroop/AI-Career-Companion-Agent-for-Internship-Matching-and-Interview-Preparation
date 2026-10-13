"""
Knowledge Base Router — Internship directory + RAG Q&A.

Endpoints:
  GET  /knowledge-base/internships        List all internships with optional domain filter
  GET  /knowledge-base/domains            List unique domains
  POST /knowledge-base/query              RAG Q&A against knowledge base
  GET  /knowledge-base/internships/{id}   Get single internship details
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.rag.generator import generate_response

router = APIRouter(
    prefix="/knowledge-base",
    tags=["Knowledge Base"],
)

INTERNSHIPS_PATH = Path("app") / "internships.json"


@lru_cache(maxsize=1)
def _load_internships() -> list[dict[str, Any]]:
    """Load internship dataset once per process."""
    try:
        with open(INTERNSHIPS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


# ──────────────────────────────────────────────────────────────────
# GET /internships
# ──────────────────────────────────────────────────────────────────

@router.get(
    "/internships",
    response_model=schemas.KBListResponse,
    summary="List internship directory",
)
def list_internships(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    search: Optional[str] = Query(None, description="Full-text search in role/company/description"),
    mode: Optional[str] = Query(None, description="Filter by mode: Remote|Hybrid|On-site"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: models.User = Depends(get_current_user),
):
    """Return paginated internship listings with optional filters."""
    internships = _load_internships()

    # Apply filters
    if domain:
        internships = [i for i in internships if i.get("domain", "").lower() == domain.lower()]

    if mode:
        internships = [i for i in internships if i.get("mode", "").lower() == mode.lower()]

    if search:
        q = search.lower()
        internships = [
            i for i in internships
            if q in i.get("role_title", "").lower()
            or q in i.get("company", "").lower()
            or q in i.get("description", "").lower()
            or any(q in s.lower() for s in i.get("required_skills", []))
        ]

    all_internships = _load_internships()
    all_domains = sorted(set(i.get("domain", "") for i in all_internships if i.get("domain")))
    total = len(internships)

    paginated = internships[offset : offset + limit]

    return {
        "total": total,
        "domains": all_domains,
        "internships": [
            schemas.KBInternship(
                id=str(i.get("id", "")),
                company=i.get("company", ""),
                role_title=i.get("role_title", ""),
                domain=i.get("domain", ""),
                location=i.get("location", ""),
                mode=i.get("mode", ""),
                duration_weeks=int(i.get("duration_weeks", 0)),
                stipend_inr_per_month=int(i.get("stipend_inr_per_month", 0)),
                min_education=i.get("min_education", ""),
                required_skills=i.get("required_skills", []),
                preferred_skills=i.get("preferred_skills", []),
                description=i.get("description", ""),
            )
            for i in paginated
        ],
    }


# ──────────────────────────────────────────────────────────────────
# GET /domains
# ──────────────────────────────────────────────────────────────────

@router.get(
    "/domains",
    summary="List unique internship domains",
)
def list_domains(
    current_user: models.User = Depends(get_current_user),
) -> dict:
    internships = _load_internships()
    domains = sorted(set(i.get("domain", "") for i in internships if i.get("domain")))
    return {"domains": domains, "total": len(domains)}


# ──────────────────────────────────────────────────────────────────
# GET /internships/{internship_id}
# ──────────────────────────────────────────────────────────────────

@router.get(
    "/internships/{internship_id}",
    response_model=schemas.KBInternship,
    summary="Get internship details by ID",
)
def get_internship(
    internship_id: str,
    current_user: models.User = Depends(get_current_user),
):
    internships = _load_internships()
    match = next(
        (i for i in internships if str(i.get("id")) == internship_id),
        None,
    )
    if not match:
        raise HTTPException(status_code=404, detail="Internship not found")
    return schemas.KBInternship(
        id=str(match.get("id", "")),
        company=match.get("company", ""),
        role_title=match.get("role_title", ""),
        domain=match.get("domain", ""),
        location=match.get("location", ""),
        mode=match.get("mode", ""),
        duration_weeks=int(match.get("duration_weeks", 0)),
        stipend_inr_per_month=int(match.get("stipend_inr_per_month", 0)),
        min_education=match.get("min_education", ""),
        required_skills=match.get("required_skills", []),
        preferred_skills=match.get("preferred_skills", []),
        description=match.get("description", ""),
    )


# ──────────────────────────────────────────────────────────────────
# POST /query — RAG Q&A
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/query",
    response_model=schemas.KBQueryResponse,
    summary="Ask the knowledge base a career question",
)
def query_knowledge_base(
    request: schemas.KBQueryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """RAG-powered Q&A endpoint against the career knowledge base."""
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be empty.")
    if len(question) > 2000:
        raise HTTPException(status_code=422, detail="Question too long (max 2000 chars).")

    # Get user context
    user_data: dict[str, Any] = {"name": current_user.name}
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == current_user.id)
        .order_by(models.Resume.uploaded_at.desc())
        .first()
    )
    if resume and resume.extracted_data:
        try:
            rd = json.loads(resume.extracted_data)
            for field in ["skills", "technical_skills", "professional_summary"]:
                v = rd.get(field)
                if v:
                    user_data[field] = v
        except Exception:
            pass

    try:
        result = generate_response(
            question=question,
            conversation_history=request.conversation_history or [],
            user_data=user_data,
        )
    except Exception as e:
        print(f"[knowledge_base] RAG error: {e}")
        raise HTTPException(status_code=503, detail="Knowledge base temporarily unavailable.")

    return schemas.KBQueryResponse(
        answer=result["answer"],
        sources=[schemas.ChatSource(**s) for s in result.get("sources", [])],
        retrieval_used=result.get("retrieval_used", False),
        generation_method=result.get("generation_method", "llm"),
    )
