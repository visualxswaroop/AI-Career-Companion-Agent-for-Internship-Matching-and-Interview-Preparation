"""
Career Assistant Router — RAG-based chatbot endpoint.

POST /career-assistant/chat
    Authenticated endpoint. Retrieves relevant knowledge chunks,
    constructs a grounded prompt, and returns an LLM response.
"""

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.rag.generator import generate_response


router = APIRouter(
    prefix="/career-assistant",
    tags=["Career Assistant"],
)


# ──────────────────────────────────────────────────────────────────
# Helper: Build user context from DB
# ──────────────────────────────────────────────────────────────────

def _build_user_context(
    user: models.User,
    db: Session,
) -> dict[str, Any]:
    """
    Collect user profile + most recent resume data to pass to the RAG generator.
    This personalizes the LLM response without exposing data to the client.
    """
    context: dict[str, Any] = {
        "name": user.name,
    }

    # Profile information
    profile = db.query(models.Profile).filter(
        models.Profile.user_id == user.id
    ).first()

    if profile:
        if profile.summary:
            context["profile_summary"] = profile.summary

    # Most recently uploaded resume's parsed data
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == user.id)
        .order_by(models.Resume.uploaded_at.desc())
        .first()
    )

    if resume and resume.extracted_data:
        try:
            resume_data = json.loads(resume.extracted_data)
            if isinstance(resume_data, dict):
                # Merge the most useful fields into context
                for field in [
                    "skills",
                    "technical_skills",
                    "soft_skills",
                    "education",
                    "projects",
                    "professional_summary",
                ]:
                    value = resume_data.get(field)
                    if value:
                        context[field] = value
        except (json.JSONDecodeError, Exception):
            pass  # Resume data unreadable; proceed without it

    return context


# ──────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=schemas.ChatResponse,
    status_code=200,
    summary="Send a message to the Career Assistant",
    description=(
        "Authenticated endpoint. Embeds the user's question, retrieves relevant "
        "knowledge chunks via FAISS, constructs a grounded prompt with user context "
        "and conversation history, and returns an LLM-generated response."
    ),
)
def chat(
    request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.ChatResponse:
    """RAG-based chat endpoint for the Career Assistant."""

    message = request.message.strip()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message cannot be empty.",
        )

    if len(message) > 2000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message is too long (max 2000 characters).",
        )

    # Build personalized user context from authenticated user's data
    user_data = _build_user_context(current_user, db)

    # Generate RAG response
    try:
        result = generate_response(
            question=message,
            conversation_history=request.conversation_history or [],
            user_data=user_data,
        )
    except Exception as e:
        print(f"[career_assistant] Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Career Assistant is temporarily unavailable. Please try again.",
        )

    return schemas.ChatResponse(
        answer=result["answer"],
        sources=[schemas.ChatSource(**s) for s in result["sources"]],
        retrieval_used=result["retrieval_used"],
        generation_method=result["generation_method"],
    )


@router.get(
    "/status",
    summary="Check Career Assistant readiness",
)
def get_status(
    current_user: models.User = Depends(get_current_user),
) -> dict[str, Any]:
    """Check whether the RAG index is initialized and the assistant is ready."""
    from app.rag.retriever import is_index_available
    available = is_index_available()
    return {
        "ready": available,
        "message": (
            "Career Assistant is ready."
            if available
            else "RAG index not found. Run: python -m app.rag.ingest"
        ),
    }
