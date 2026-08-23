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
from app.candidate_preprocessor import prepare_candidate_data
from app.internship_index import search_internships, apply_second_stage_ranking
from app.llm_ranker import rank_internships_with_explanations


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


# =========================================================
# SEMANTIC SEARCH - FIND MATCHING INTERNSHIPS
# =========================================================

@router.post(
    "/{resume_id}/match-internships",
    response_model=schemas.SemanticSearchResponse,
    status_code=200
)
def match_internships(
    resume_id: int,
    request: schemas.SemanticSearchRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Find internships that match a candidate's profile using semantic similarity.
    
    This endpoint:
    1. Retrieves the candidate's parsed resume
    2. Prepares the resume data for embedding
    3. Searches the FAISS vector index
    4. Returns top-K matching internships with similarity scores
    
    Args:
        resume_id: ID of the candidate's resume
        request: Contains top_k parameter (default: 5)
    
    Returns:
        Ranked list of internships with similarity scores
    """
    
    # Get the resume
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )
    
    # Parse extracted data
    try:
        extracted_data = json.loads(
            resume.extracted_data
        ) if resume.extracted_data else {}
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Resume data is invalid"
        )
    
    if not extracted_data:
        raise HTTPException(
            status_code=400,
            detail="Resume has no extracted data. Please upload a valid resume."
        )
    
    # Prepare candidate data for embedding
    try:
        candidate_text = prepare_candidate_data(extracted_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error preparing candidate data: {str(e)}"
        )
    
    if not candidate_text or not candidate_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract candidate information from resume"
        )
    
    # Search for matching internships
    try:
        top_k = max(1, min(request.top_k, 100))  # Clamp between 1 and 100
        results = search_internships(candidate_text, top_k=top_k)
        
        # Apply second-stage ranking
        results = apply_second_stage_ranking(results, extracted_data)
        
        # Add LLM-based explanations
        results = rank_internships_with_explanations(results, extracted_data, use_llm=True)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching internships: {str(e)}"
        )
    
    # Convert results to response format
    matches = []
    for result in results:
        match = schemas.InternshipMatch(
            rank=result["rank"],
            internship=schemas.InternshipData(**result["internship"]),
            similarity_score=result["similarity_score"],
            adjusted_similarity_score=result.get("adjusted_similarity_score"),
            skill_analysis=result.get("skill_analysis"),
            explanation=result.get("explanation")
        )
        matches.append(match)
    
    return {
        "message": f"Found {len(matches)} matching internships",
        "total_results": len(matches),
        "results": matches
    }