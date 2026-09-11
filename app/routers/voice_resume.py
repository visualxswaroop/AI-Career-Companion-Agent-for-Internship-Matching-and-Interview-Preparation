"""
Voice Resume Router — AI-Driven Multilingual Resume Architect endpoints.

POST /voice-resume/extract
    Accept a free-form spoken transcript (already transcribed client-side via Web Speech API).
    Returns structured ResumeData fields, missing-field list, and a follow-up question if needed.

POST /voice-resume/generate
    Accept complete (or near-complete) extracted ResumeData.
    Returns a formatted ATS resume as plain text plus the detected template type.

NOTE — Future work:
    - POST /voice-resume/save: persist the generated resume to the `resumes` DB table so
      internship matching works immediately after the voice flow completes.
    - POST /voice-resume/transcribe: server-side multilingual transcription via Groq Whisper
      for environments where the Web Speech API is unavailable.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.voice_resume_service import extract_resume_fields, generate_resume_document


router = APIRouter(
    prefix="/voice-resume",
    tags=["Voice Resume"],
)


# ──────────────────────────────────────────────────────────────────
# POST /voice-resume/extract
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/extract",
    response_model=schemas.VoiceResumeExtractResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract structured resume fields from a spoken transcript",
)
def extract_voice_resume(
    request: schemas.VoiceResumeExtractRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Accept a transcript (already transcribed by the browser's Web Speech API) and
    any previous conversation turns.  Returns structured ResumeData, a list of missing
    required fields, and — when fields are still missing — a follow-up question to speak
    to the user.  When `is_complete` is True, no follow-up is returned.
    """
    transcript = (request.transcript or "").strip()
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript must not be empty.",
        )

    # Convert Pydantic ChatMessage objects → plain dicts for the service layer
    history = None
    if request.conversation_history:
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]

    result = extract_resume_fields(
        transcript=transcript,
        conversation_history=history,
        language_hint=request.language_hint,
    )

    # result is always a dict (fallback guarantees this) — validate through response model
    return result


# ──────────────────────────────────────────────────────────────────
# POST /voice-resume/generate
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/generate",
    response_model=schemas.VoiceResumeGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate an ATS-optimised resume from extracted voice fields",
)
def generate_voice_resume(
    request: schemas.VoiceResumeGenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Accept structured resume fields (from one or more /extract calls) and produce a
    complete, ATS-optimised resume as a plain-text string.

    `template_hint` may be "auto" (LLM decides based on candidate background),
    "technical", or "blue-collar".  The `template_used` field in the response
    reflects the final template that was applied.
    """
    # Convert Pydantic model → plain dict for the service layer
    extracted_data = request.extracted_data.model_dump(exclude_none=False)

    template_hint = (request.template_hint or "auto").strip().lower()
    if template_hint not in ("auto", "technical", "blue-collar"):
        template_hint = "auto"

    result = generate_resume_document(
        extracted_data=extracted_data,
        template_hint=template_hint,
    )

    return result
