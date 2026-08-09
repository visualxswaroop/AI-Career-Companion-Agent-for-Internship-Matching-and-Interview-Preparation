import os
import json
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from sqlalchemy.orm import Session

from app import models,schemas
from app.dependencies import get_db, get_current_user
from app.parser import extract_resume_text
from app.resume_parser import parse_resume


router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)


UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx"
}

MAX_FILE_SIZE = 5 * 1024 * 1024


# =========================================================
# VALIDATE FILE CONTENT
# =========================================================

def validate_file_content(
    contents: bytes,
    extension: str
):

    if extension == ".pdf":

        if not contents.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file"
            )

    elif extension == ".docx":

        # DOCX files are ZIP-based files
        if not contents.startswith(b"PK"):
            raise HTTPException(
                status_code=400,
                detail="Invalid DOCX file"
            )


# =========================================================
# UPLOAD AND PARSE RESUME
# =========================================================

@router.post(
    "/upload",
    response_model=schemas.ResumeUploadResponse,
    status_code=201
)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # =====================================================
    # VALIDATE FILE
    # =====================================================

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )

    original_filename = file.filename

    extension = os.path.splitext(
        original_filename
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed"
        )

    # =====================================================
    # GENERATE UNIQUE FILE NAME
    # =====================================================

    unique_filename = (
        f"{uuid4().hex}{extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename
    )

    # =====================================================
    # READ AND VALIDATE FILE
    # =====================================================

    try:

        contents = await file.read()

        # Check file size
        if len(contents) > MAX_FILE_SIZE:

            await file.close()

            raise HTTPException(
                status_code=413,
                detail="File size must not exceed 5 MB"
            )

        # Validate actual file content
        validate_file_content(
            contents,
            extension
        )

        # Save file
        with open(
            file_path,
            "wb"
        ) as f:

            f.write(contents)

        await file.close()

    except HTTPException:
        raise

    except Exception:

        await file.close()

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail="Failed to save uploaded file"
        )

    # =====================================================
    # EXTRACT TEXT
    # =====================================================

    try:

        text = extract_resume_text(
            file_path
        )

    except Exception as e:

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract resume text: {str(e)}"
        )

    # =====================================================
    # CHECK WHETHER TEXT WAS EXTRACTED
    # =====================================================

    if not text.strip():

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=400,
            detail="Could not extract text from the resume"
        )

    # =====================================================
    # PARSE RESUME
    # =====================================================

    try:

        extracted_data = parse_resume(
            text
        )

    except Exception as e:

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse resume: {str(e)}"
        )

    # =====================================================
    # CONVERT DICTIONARY TO JSON STRING
    # =====================================================

    extracted_json = json.dumps(
        extracted_data
    )

    # =====================================================
    # SAVE TO DATABASE
    # =====================================================

    try:

        resume = models.Resume(
            user_id=current_user.id,
            filename=original_filename,
            file_path=file_path,
            extracted_data=extracted_json
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

    except Exception:

        db.rollback()

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail="Failed to save resume information"
        )

    # =====================================================
    # RETURN RESPONSE
    # =====================================================

    return {
        "message": "Resume uploaded and parsed successfully",
        "resume_id": resume.id,
        "filename": resume.filename,
        "extracted_data": extracted_data
    }


# =========================================================
# GET ALL USER RESUMES
# =========================================================

@router.get(
        "",
            response_model=schemas.ResumeListResponse
    )
def get_all_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    resumes = db.query(models.Resume).filter(
        models.Resume.user_id == current_user.id
    ).all()

    result = []

    for resume in resumes:

        try:

            extracted_data = json.loads(
                resume.extracted_data
            ) if resume.extracted_data else {}

        except json.JSONDecodeError:

            extracted_data = {}

        result.append({
            "resume_id": resume.id,
            "filename": resume.filename,
            "file_path": resume.file_path,
            "uploaded_at": resume.uploaded_at,
            "extracted_data": extracted_data
        })

    return {
        "count": len(result),
        "resumes": result
    }


# =========================================================
# GET PARSED RESUME
# =========================================================

@router.get("/{resume_id}", response_model=schemas.ResumeResponse)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    try:

        extracted_data = json.loads(
            resume.extracted_data
        ) if resume.extracted_data else {}

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="Stored resume data is invalid"
        )

    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "file_path": resume.file_path,
        "uploaded_at": resume.uploaded_at,
        "extracted_data": extracted_data
    }