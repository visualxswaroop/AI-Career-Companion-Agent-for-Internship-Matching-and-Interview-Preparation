from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_db, get_current_user


router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


# =========================
# CREATE PROFILE
# =========================

@router.post(
    "",
    response_model=schemas.ProfileResponse,
    status_code=201
)
def create_profile(
    profile: schemas.ProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    existing_profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Profile already exists"
        )

    new_profile = models.Profile(
        user_id=current_user.id,
        phone=profile.phone,
        address=profile.address,
        linkedin=profile.linkedin,
        github=profile.github,
        summary=profile.summary
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


# =========================
# GET PROFILE
# =========================

@router.get(
    "",
    response_model=schemas.ProfileResponse
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return profile


# =========================
# UPDATE PROFILE
# =========================

@router.put(
    "",
    response_model=schemas.ProfileResponse
)
def update_profile(
    profile_data: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    update_data = profile_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile


# =========================
# DELETE PROFILE
# =========================

@router.delete(
    "",
    status_code=204
)
def delete_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    db.delete(profile)
    db.commit()

    return None