from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.auth import create_access_token
from app.database import SessionLocal
from app.dependencies import get_db,get_current_user
from app import models, schemas
from app.utils import hash_password, verify_password
from datetime import datetime, timedelta, timezone
from app.auth import create_reset_token


security = HTTPBearer()
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=201
)
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_pw = hash_password(user.password)

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pw
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post(
    "/login",
    response_model=schemas.TokenResponse
)
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    # Find user by email
    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    # Check whether user exists
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(
        user.password,
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT
    access_token = create_access_token(
        data={
            "sub": str(db_user.id)
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(
    current_user: models.User = Depends(get_current_user)
):
    return current_user

# =========================
# CHANGE PASSWORD
# =========================

@router.put("/change-password")
def change_password(
    password_data: schemas.ChangePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # Verify current password
    if not verify_password(
        password_data.current_password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # Make sure new password is different
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )

    # Hash the new password
    current_user.hashed_password = hash_password(
        password_data.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }


# =========================
# FORGOT PASSWORD
# =========================

@router.post("/forgot-password")
def forgot_password(
    data: schemas.ForgotPassword,
    db: Session = Depends(get_db)
):

    user = db.query(models.User).filter(
        models.User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    reset_token = create_reset_token()

    user.reset_token = reset_token

    user.reset_token_expires = (
        datetime.now(timezone.utc) + timedelta(minutes=15)
    )

    db.commit()

    return {
        "message": "Password reset token generated",
        "reset_token": reset_token
    }

# =========================
# RESET PASSWORD
# =========================

@router.post("/reset-password")
def reset_password(
    data: schemas.ResetPassword,
    db: Session = Depends(get_db)
):

    user = db.query(models.User).filter(
        models.User.reset_token == data.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid reset token"
        )

    if not user.reset_token_expires:
        raise HTTPException(
            status_code=400,
            detail="Invalid reset token"
        )

    current_time = datetime.now(timezone.utc)

    if current_time > user.reset_token_expires.replace(
        tzinfo=timezone.utc
    ):
        raise HTTPException(
            status_code=400,
            detail="Reset token has expired"
        )

    user.hashed_password = hash_password(
        data.new_password
    )

    # Invalidate the reset token
    user.reset_token = None
    user.reset_token_expires = None

    db.commit()

    return {
        "message": "Password reset successfully"
    }

# =========================
# LOGOUT
# =========================

@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    existing_token = db.query(
        models.BlacklistedToken
    ).filter(
        models.BlacklistedToken.token == token
    ).first()

    if existing_token:
        return {
            "message": "Already logged out"
        }

    blacklisted_token = models.BlacklistedToken(
        token=token
    )

    db.add(blacklisted_token)
    db.commit()

    return {
        "message": "Logged out successfully"
    }

# =========================
# DELETE USER ACCOUNT
# =========================

@router.delete(
    "/account",
    status_code=204
)
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # Delete user's profile first
    profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id
    ).first()

    if profile:
        db.delete(profile)

    # Delete the user
    db.delete(current_user)

    db.commit()

    return None