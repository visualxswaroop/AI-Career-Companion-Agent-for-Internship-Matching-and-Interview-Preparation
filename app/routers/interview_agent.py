"""
Interview Agent Router — Dedicated AI Interview Preparation Agent endpoints (Phase A + B).

Phase A:
POST /interview-agent/chat
    Chat with interview agent grounded in resume.
GET  /interview-agent/context
    Candidate interview readiness and recommendations.

Phase B (Document-Based Q&A):
POST   /interview-agent/document/upload
    Upload PDF or DOCX document, extract text, chunk and index vectors (isolated to current user).
GET    /interview-agent/document/active
    Get the current active document metadata for the authenticated user.
DELETE /interview-agent/document/active
    Remove the active document and its indexed chunks for the authenticated user.
DELETE /interview-agent/document/{document_id}
    Remove a specific document for the authenticated user.
"""

import os
from uuid import uuid4
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.interview_agent_service import get_agent_context, process_interview_chat
from app.interview_document_service import (
    UPLOAD_DOC_DIR,
    extract_document_text,
    save_and_index_document,
    get_active_document,
    remove_document,
)

ALLOWED_DOC_EXTENSIONS = {".pdf", ".docx"}
MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


router = APIRouter(
    prefix="/interview-agent",
    tags=["Interview Agent"],
)


# ──────────────────────────────────────────────────────────────────
# 1. Document Upload & Lifecycle Endpoints (Phase B)
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/document/upload",
    response_model=schemas.InterviewDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload PDF or DOCX study material for interview preparation",
)
async def upload_interview_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.InterviewDocumentResponse:
    """
    Authenticated endpoint. Accepts a PDF or DOCX file, extracts text,
    indexes semantic chunks with embeddings, and associates it with the authenticated user.
    Strictly isolated: documents are private to current_user.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected.",
        )

    original_filename = file.filename
    extension = os.path.splitext(original_filename)[1].lower()

    if extension not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{extension}'. Only PDF and DOCX files are allowed.",
        )

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}",
        )

    # Validate file size
    if len(contents) > MAX_DOC_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size must not exceed 10 MB.",
        )

    # Validate file magic bytes
    if extension == ".pdf":
        if not contents.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file. The file does not have a valid PDF header.",
            )
    elif extension == ".docx":
        if not contents.startswith(b"PK"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid DOCX file. The file is corrupted or not a valid document.",
            )

    # Save to disk
    unique_filename = f"{uuid4().hex}{extension}"
    file_path = os.path.join(UPLOAD_DOC_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Extract text
    try:
        extracted_text = extract_document_text(file_path, extension)
    except ValueError as val_err:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as err:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting text from document: {str(err)}",
        )

    # Save and index chunks
    try:
        doc = save_and_index_document(
            user_id=current_user.id,
            original_filename=original_filename,
            file_path=file_path,
            extension=extension,
            extracted_text=extracted_text,
            db=db,
        )
    except Exception as err:
        print(f"[interview_agent] Error indexing document: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to index document for interview preparation.",
        )

    return schemas.InterviewDocumentResponse(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        chunk_count=doc.chunk_count,
        text_length=len(doc.extracted_text),
        uploaded_at=doc.uploaded_at,
        is_active=doc.is_active,
    )


@router.get(
    "/document/active",
    response_model=Optional[schemas.InterviewDocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user's current active interview preparation document",
)
def get_user_active_document(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> Optional[schemas.InterviewDocumentResponse]:
    """Retrieve metadata for the current user's active document."""
    doc = get_active_document(current_user.id, db)
    if not doc:
        return None

    return schemas.InterviewDocumentResponse(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        chunk_count=doc.chunk_count,
        text_length=len(doc.extracted_text),
        uploaded_at=doc.uploaded_at,
        is_active=doc.is_active,
    )


@router.delete(
    "/document/active",
    status_code=status.HTTP_200_OK,
    summary="Remove authenticated user's active document",
)
def remove_user_active_document(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> Dict[str, str]:
    """Remove user's active document and all indexed chunks."""
    removed = remove_document(user_id=current_user.id, document_id=None, db=db)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active document found to remove.",
        )
    return {"message": "Active document removed successfully."}


@router.delete(
    "/document/{document_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove a specific document by ID",
)
def remove_user_document_by_id(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> Dict[str, str]:
    """Remove a specific document owned by the authenticated user."""
    removed = remove_document(user_id=current_user.id, document_id=document_id, db=db)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or unauthorized.",
        )
    return {"message": "Document removed successfully."}


# ──────────────────────────────────────────────────────────────────
# 2. Chat & Context Endpoints (Phase A + B)
# ──────────────────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=schemas.InterviewChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with the Interview Preparation Agent",
    description=(
        "Authenticated endpoint. Uses the authenticated user's extracted resume data "
        "and active document context (Phase B) to deliver grounded guidance, interview questions, "
        "document summaries, Q&A, and interactive mock interviews."
    ),
)
def interview_chat(
    request: schemas.InterviewChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.InterviewChatResponse:
    """Chat endpoint for personalized interview preparation."""
    message = request.message.strip()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message cannot be empty.",
        )

    if len(message) > 2000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message is too long (maximum 2000 characters).",
        )

    # Convert conversation history to dictionary format
    history_dicts = []
    if request.conversation_history:
        for msg in request.conversation_history:
            history_dicts.append({
                "role": msg.role,
                "content": msg.content,
            })

    try:
        result = process_interview_chat(
            user_id=current_user.id,
            user_name=current_user.name,
            user_message=message,
            target_role=request.target_role,
            conversation_history=history_dicts,
            db=db,
        )
    except Exception as e:
        print(f"[interview_agent] Unexpected error during chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Interview Preparation Agent encountered an error. Please try again.",
        )

    return schemas.InterviewChatResponse(
        answer=result["answer"],
        target_role=result.get("target_role"),
        has_resume=result.get("has_resume", False),
        has_document=result.get("has_document", False),
        active_document=result.get("active_document"),
        generation_method=result.get("generation_method", "llm"),
        roadmap_data=result.get("roadmap_data"),
    )


@router.get(
    "/context",
    response_model=schemas.InterviewAgentContextResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user interview preparation readiness, recommendations, and active document",
)
def interview_context(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.InterviewAgentContextResponse:
    """Retrieve candidate's interview context, extracted skills/projects, and active document status."""
    data = get_agent_context(
        user_id=current_user.id,
        user_name=current_user.name,
        db=db,
    )
    return schemas.InterviewAgentContextResponse(**data)
