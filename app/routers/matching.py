"""
Job Matching Router — Compatibility scoring with threshold filtering.

Endpoints:
  POST /matching/match       Full matching with TF-IDF + FAISS + LLM explanation
  POST /matching/ats-score   ATS score resume vs job description
"""

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.candidate_preprocessor import prepare_candidate_data
from app.internship_index import search_internships, apply_second_stage_ranking
from app.llm_ranker import rank_internships_with_explanations
from app.services.nlp_workbench import score_resume_ats

router = APIRouter(
    prefix="/matching",
    tags=["Job Matching"],
)


def _get_resume(resume_id: int, user_id: int, db: Session) -> models.Resume:
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == user_id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


def _parse_resume_data(resume: models.Resume) -> dict[str, Any]:
    if not resume.extracted_data:
        raise HTTPException(status_code=400, detail="Resume has no extracted data.")
    try:
        return json.loads(resume.extracted_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Stored resume data is corrupted.")


# ──────────────────────────────────────────────────────────────────
# POST /match
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/match",
    response_model=schemas.SemanticSearchResponse,
    summary="Find matching internships for a resume",
)
def match_internships(
    request: schemas.JobMatchRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Multi-stage matching:
    1. FAISS semantic search (sentence-transformers)
    2. Second-stage TF-IDF skill re-ranking
    3. Groq LLM explanation for top-K results
    4. Optional threshold filter (0–100)
    """
    resume = _get_resume(request.resume_id, current_user.id, db)
    extracted_data = _parse_resume_data(resume)

    if not extracted_data:
        raise HTTPException(status_code=400, detail="Resume data is empty.")

    try:
        candidate_text = prepare_candidate_data(extracted_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Candidate prep error: {e}")

    if not candidate_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract candidate information.")

    try:
        top_k = max(1, min(request.top_k, 100))
        results = search_internships(candidate_text, top_k=top_k)
        results = apply_second_stage_ranking(results, extracted_data)
        results = rank_internships_with_explanations(results, extracted_data, use_llm=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {e}")

    # Apply threshold filter (similarity_score 0–1, threshold 0–100)
    threshold_fraction = request.threshold / 100.0
    if threshold_fraction > 0:
        results = [
            r for r in results
            if (r.get("adjusted_similarity_score") or r.get("similarity_score", 0)) >= threshold_fraction
        ]

    matches = [
        schemas.InternshipMatch(
            rank=r["rank"],
            internship=schemas.InternshipData(**r["internship"]),
            similarity_score=r["similarity_score"],
            adjusted_similarity_score=r.get("adjusted_similarity_score"),
            skill_analysis=r.get("skill_analysis"),
            explanation=r.get("explanation"),
        )
        for r in results
    ]

    return {
        "message": f"Found {len(matches)} matching internships",
        "total_results": len(matches),
        "results": matches,
    }


# ──────────────────────────────────────────────────────────────────
# POST /ats-score
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/ats-score",
    response_model=schemas.ATSScoreResponse,
    summary="Score a resume's ATS compatibility with a job description",
)
def ats_score(
    request: schemas.ATSScoreRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    TF-IDF + cosine similarity ATS scoring between parsed resume and job description.
    Returns score (0-100), matched/missing keywords, section feedback.
    """
    resume = _get_resume(request.resume_id, current_user.id, db)
    extracted_data = _parse_resume_data(resume)

    if not request.job_description.strip():
        raise HTTPException(status_code=422, detail="Job description cannot be empty.")

    try:
        result = score_resume_ats(extracted_data, request.job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ATS scoring failed: {e}")

    return schemas.ATSScoreResponse(**result)
