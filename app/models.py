from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(String, nullable=False)

    reset_token = Column(String, nullable=True)

    reset_token_expires = Column(DateTime, nullable=True)


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    phone = Column(String, nullable=True)

    address = Column(String, nullable=True)

    linkedin = Column(String, nullable=True)

    github = Column(String, nullable=True)

    summary = Column(String, nullable=True)


class BlacklistedToken(Base):
    __tablename__ = "blacklisted_tokens"

    id = Column(Integer, primary_key=True, index=True)

    token = Column(String, unique=True, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    filename = Column(
        String,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=False
    )

    extracted_data = Column(
        String,
        nullable=True
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )