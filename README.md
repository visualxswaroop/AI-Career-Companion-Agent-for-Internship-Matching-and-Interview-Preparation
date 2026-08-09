# 📄 Resume Parser API

A robust, high-performance RESTful API built with **FastAPI**, **SQLAlchemy**, and **Python** that automatically parses resumes in **PDF** and **DOCX** formats. It extracts key candidate information—including personal details, contact information, education, work experience, skills, certifications, and portfolio links—and stores them systematically in a database.

---

## ✨ Features

- **🔐 User Authentication & Security**
  - JWT-based authentication (Register, Login, Password Reset token flow).
  - Password hashing using `passlib` / `bcrypt`.
  - Protected API routes requiring Bearer Token verification.

- **📄 Document Text Extraction**
  - Multi-format support: **PDF** (`pdfplumber`) and **DOCX** (`python-docx`).
  - File extension and MIME validation (magic byte checks for PDF and ZIP-based DOCX).
  - Maximum upload size enforcement (5 MB limit).

- **🧠 Intelligent Resume Parsing**
  - Regular expression and heuristic-based entity extraction.
  - **Contact Information**: Full Name, Email Address, Phone Number, LinkedIn, GitHub, Location.
  - **Career & Skills**: Skill categorization, Work Experience, Education history, Certifications, Projects, and Summary.

- **💾 Data Management & Profile Systems**
  - User profiles and account details management.
  - Database persistence with SQLite and SQLAlchemy ORM.
  - Dedicated CRUD endpoints for listing, viewing, downloading, and deleting parsed resumes.

---

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database & ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) (SQLite default)
- **Data Validation & Schemas**: [Pydantic v2](https://docs.pydantic.dev/)
- **Authentication**: JWT (`python-jose`), `passlib`
- **Document Processing**: `pdfplumber`, `python-docx`
- **Server**: [Uvicorn](https://www.uvicorn.org/)

---

## 📁 Directory Structure

```text
Resume_parser_api/
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI entrypoint & router configuration
│   ├── auth.py            # JWT token creation & helper functions
│   ├── database.py        # SQLAlchemy database engine & base session setup
│   ├── dependencies.py    # FastAPI dependency injections (DB session, current user)
│   ├── models.py          # SQLAlchemy ORM models (User, Resume, Profile)
│   ├── schemas.py         # Pydantic data schemas & request/response models
│   ├── parser.py          # PDF & DOCX text extraction engines
│   ├── resume_parser.py   # Regex & heuristic extraction logic for resume fields
│   ├── utils.py           # Password hashing & verification utilities
│   └── routers/
│       ├── auth.py        # Auth endpoints (/auth/register, /auth/login, etc.)
│       ├── profile.py     # Profile endpoints (/profile)
│       └── resume.py      # Resume upload, parse, list, download, & delete endpoints
├── uploads/               # Local storage directory for uploaded resume files
├── requirements.txt       # Python project dependencies
├── .gitignore             # Git ignore configuration
└── README.md              # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+** installed on your system.

### 1. Clone the Repository

```bash
git clone https://github.com/visualxswaroop/resume_parser_api.git
cd resume_parser_api
```

### 2. Create and Activate a Virtual Environment

- **On Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate
  ```

- **On macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the API Server

```bash
uvicorn app.main:app --reload
```

The application will start at `http://127.0.0.1:8000`.

---

## 📌 API Endpoints Overview

### Authentication (`/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user account |
| `POST` | `/auth/login` | Authenticate user and receive JWT access token |
| `POST` | `/auth/forgot-password` | Request password reset token |
| `POST` | `/auth/reset-password` | Reset password using reset token |

### Profile (`/profile`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/profile/` | Fetch current authenticated user's profile |
| `PUT` | `/profile/update` | Update user profile information |

### Resume Operations (`/resume`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/resume/upload` | Upload `.pdf` or `.docx` resume and trigger automatic parsing |
| `GET` | `/resume/list` | List all parsed resumes uploaded by the authenticated user |
| `GET` | `/resume/{resume_id}` | Retrieve specific parsed resume details by ID |
| `GET` | `/resume/{resume_id}/download` | Download original uploaded resume file |
| `DELETE` | `/resume/{resume_id}` | Delete a parsed resume record and associated file |

---

## 📖 Interactive API Documentation

Once the application is running, you can access the interactive Swagger UI and ReDoc documentation:

- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 👤 Author

Developed by **Swaroop** ([@visualxswaroop](https://github.com/visualxswaroop)).
