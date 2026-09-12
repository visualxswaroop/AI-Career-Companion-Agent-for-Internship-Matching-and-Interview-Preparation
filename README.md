# 🎓 AI-Career Companion Agent for Internship Matching & Interview Preparation

An AI-powered career assistance platform for students, fresh graduates, and early-career professionals. The AI-Career Companion Agent combines resume parsing, intelligent internship matching, cover letter generation, a **RAG-based Career Assistant chatbot**, and an **interactive multi-turn Interview Preparation Agent** into a single integrated system.

---

## ✨ Features

- **🔐 User Authentication & Security**
  - JWT-based authentication (Register, Login, Password Reset token flow)
  - Password hashing using `passlib` / `bcrypt`
  - Protected API routes requiring Bearer Token verification

- **📄 Resume Upload & Parsing**
  - Multi-format support: **PDF** (`pdfplumber`) and **DOCX** (`python-docx`)
  - AI-powered structured extraction of skills, education, projects, experience, certifications, and more

- **🔍 Internship Recommendation**
  - Semantic embedding using `sentence-transformers/all-MiniLM-L6-v2`
  - Cosine similarity search via FAISS vector database
  - Skill analysis, education compatibility, and match rating (Excellent/Good/Moderate/Fair)
  - AI-generated match explanations via Groq LLM

- **✉️ Personalized Cover Letter Generation**
  - Tailored cover letters using resume data + internship details
  - Groq `llama-3.3-70b-versatile` LLM with heuristic fallback

- **💬 Career Assistant (RAG-based Chatbot)**
  - Retrieval-Augmented Generation (RAG) pipeline
  - FAISS vector search over career knowledge base
  - Personalized responses using authenticated user's resume/profile
  - Conversation memory within session
  - Grounded answers: platform-specific queries use knowledge base, not hallucination

- **🎤 Interview Preparation & Mock Interview Agent**
  - Role recommendation based on parsed resume skills
  - Technical & HR question generation with STAR method guidance
  - Multi-turn mock interview with rubric scoring (Clarity, Technical Depth, STAR Structure)
  - Personalized 2–4 week preparation roadmaps

- **🗣️ Voice Resume Architect (Multilingual)**
  - Speak your resume in Telugu, Hindi, Tamil, English, and more
  - LLM translates, de-stutters, and structures spoken input into ATS-ready English
  - One-click executive PDF export via `jsPDF`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.10+ |
| Database | SQLite + SQLAlchemy ORM |
| Auth | JWT (`python-jose`), `passlib`/`bcrypt` |
| AI/Embeddings | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector Store | FAISS (separate indexes: internships + RAG) |
| LLM | Groq `llama-3.3-70b-versatile` |
| Frontend | Vite + React 19 + TypeScript + Tailwind CSS 4 |
| Routing | React Router 7 |

---

## 📁 Directory Structure

```text
AI-Career-Companion-Agent/
├── app/
│   ├── main.py                    # FastAPI entrypoint & router config
│   ├── auth.py                    # JWT token helpers
│   ├── database.py                # SQLAlchemy engine & session
│   ├── dependencies.py            # FastAPI DI: DB session, current user
│   ├── models.py                  # ORM models (User, Resume, Profile, etc.)
│   ├── schemas.py                 # Pydantic schemas (request/response)
│   ├── resume_parser.py           # Regex/heuristic resume field extraction
│   ├── internship_index.py        # FAISS internship similarity search
│   ├── cover_letter_service.py    # Cover letter generation service
│   ├── interview_agent_service.py # Multi-turn interview agent logic
│   ├── voice_resume_service.py    # Multilingual voice resume extraction
│   ├── rag/                       # ← RAG system for Career Assistant
│   │   ├── __init__.py
│   │   ├── ingest.py              # Document ingestion pipeline
│   │   ├── retriever.py           # FAISS retrieval with embedding model
│   │   └── generator.py          # LLM prompt construction & generation
│   └── routers/
│       ├── auth.py
│       ├── profile.py
│       ├── resume.py
│       ├── cover_letter.py
│       ├── career_assistant.py    # ← Career Assistant endpoints
│       ├── interview_agent.py     # ← Interview Agent endpoints
│       └── voice_resume.py        # ← Voice Resume endpoints
│
├── knowledge_base/
│   └── career_companion_knowledge.md   # ← Primary RAG knowledge source
│
├── data/
│   ├── internship_index.faiss     # Internship embedding index
│   ├── internship_metadata.json   # Internship metadata
│   └── rag/
│       ├── index.faiss            # RAG knowledge base index (generated)
│       └── metadata.json         # RAG chunk metadata (generated)
│
├── frontend/                      # Vite + React frontend
│   ├── vercel.json                # Vercel SPA rewrite config
│   └── src/
│       ├── pages/app/
│       │   ├── InterviewAgentPage.tsx
│       │   ├── ResumePage.tsx
│       │   └── CareerAssistantPage.tsx
│       └── api/
│           └── careerAssistant.ts
│
├── uploads/                       # Uploaded resume files
├── railway.json                   # Railway deployment config
├── Procfile                       # Heroku/Railway process definition
├── requirements.txt
├── .env                           # GROQ_API_KEY (not committed)
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+ installed
- Node.js 18+ installed (for frontend)

### 1. Clone the Repository

```bash
git clone https://github.com/visualxswaroop/resume_parser_api.git
cd AI-Career-Companion-Agent
```

### 2. Create and Activate a Virtual Environment

```powershell
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate
```

```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API key:

```bash
cp .env.example .env
```

```env
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secret_key_here
```

Get a free Groq API key at: https://console.groq.com

### 5. Build the RAG Index (Career Assistant)

This step generates embeddings from the knowledge base and creates the FAISS vector index:

```bash
python -m app.rag.ingest
```

Expected output:
```
[ingest] Starting RAG ingestion pipeline...
[ingest] Loaded 1 document(s)
[ingest] 'career_companion_knowledge.md' -> N chunks
[ingest] Loading embedding model...
[ingest] Encoding N chunks...
[ingest] FAISS index built with N vectors
[ingest] ✓ Ingestion complete!
```

The index is saved to `data/rag/index.faiss` and `data/rag/metadata.json`.

### 6. Start the Backend Server

```bash
uvicorn app.main:app --reload
```

The API starts at: `http://127.0.0.1:8000`

### 7. Start the Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at: `http://localhost:5173`

---

## 📌 API Endpoints Overview

### Authentication (`/auth`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/auth/register` | Register a new user account |
| `POST` | `/auth/login` | Authenticate user and receive JWT access token |
| `POST` | `/auth/forgot-password` | Request password reset token |
| `POST` | `/auth/reset-password` | Reset password using reset token |

### Profile (`/profile`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/profile/` | Fetch current authenticated user's profile |
| `PUT` | `/profile/update` | Update user profile information |

### Resume (`/resume`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/resume/upload` | Upload `.pdf` or `.docx` resume; triggers AI parsing |
| `GET` | `/resume/list` | List all parsed resumes for the authenticated user |
| `GET` | `/resume/{resume_id}` | Retrieve specific parsed resume details |
| `GET` | `/resume/{resume_id}/download` | Download original resume file |
| `DELETE` | `/resume/{resume_id}` | Delete a resume record and file |

### Cover Letter (`/cover-letter`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/cover-letter/generate` | Generate personalized cover letter |

### Career Assistant (`/career-assistant`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/career-assistant/chat` | RAG-based chat (authenticated) |
| `GET` | `/career-assistant/status` | Check if RAG index is initialized |

#### Chat Request

```json
POST /career-assistant/chat
Authorization: Bearer <jwt_token>

{
  "message": "How can I improve my resume?",
  "conversation_history": [
    { "role": "user", "content": "What skills should I learn for ML?" },
    { "role": "assistant", "content": "For ML, start with Python, NumPy..." }
  ]
}
```

#### Chat Response

```json
{
  "answer": "To improve your resume, focus on quantifying achievements...",
  "sources": [
    { "section": "Resume Guidance", "topic": "Resume Writing Principles", "source": "career_companion_knowledge.md", "score": 0.87 }
  ],
  "retrieval_used": true,
  "generation_method": "rag_llm"
}
```

---

## 💬 Career Assistant — RAG Architecture

```
User Question
     ↓
Embed with sentence-transformers/all-MiniLM-L6-v2 (384-dim)
     ↓
FAISS cosine similarity search (data/rag/index.faiss)
     ↓
Top-5 relevant knowledge chunks (threshold: 0.25)
     ↓
Prompt construction:
  [SYSTEM PROMPT] + [RETRIEVED KNOWLEDGE] + [USER CONTEXT] + [CONVERSATION HISTORY] + [QUESTION]
     ↓
Groq LLM (llama-3.3-70b-versatile)
     ↓
Grounded answer + source metadata
```

### Knowledge Base

The knowledge base is a single comprehensive Markdown document:

```
knowledge_base/career_companion_knowledge.md
```

It covers:
- Platform overview and workflow
- Authentication, profiles, resume parsing
- Internship recommendation system
- Cover letter generation
- Career Assistant chatbot
- Resume writing guidance and common mistakes
- ATS concepts and optimization
- Internship strategies
- Skill development (technical and soft skills)
- AI/ML career path (Python → ML → Deep Learning → NLP/CV → MLOps)
- Software development career path
- Interview preparation (DSA, behavioral, STAR method)
- Cover letter writing
- Comprehensive FAQ (platform + career)
- Platform limitations

### Updating the Knowledge Base

1. Edit `knowledge_base/career_companion_knowledge.md`
2. Rebuild the RAG index:

```bash
python -m app.rag.ingest
```

3. Restart the backend server (to reload the in-memory index).

---

## 🌐 Frontend Routes

| Route | Component | Auth Required |
|:---|:---|:---|
| `/` | LandingPage | No |
| `/register` | RegisterPage | No |
| `/login` | LoginPage | No |
| `/app` | Overview Dashboard | Yes |
| `/app/resume` | Resume Analysis | Yes |
| `/app/internships` | Internship Recommendations | Yes |
| `/app/cover-letters` | Cover Letter Generator | Yes |
| `/app/career-assistant` | Career Assistant chatbot | Yes |
| `/app/interview-agent` | Interview Preparation & Mock Sessions | Yes |
| `/app/voice-resume` | Voice Resume Architect | Yes |
| `/app/profile` | Profile & Settings | Yes |

---

## 📖 Interactive API Documentation

Once the backend is running:

- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

---

## 🚀 Deployment

### Backend → Railway
- Config: [`railway.json`](railway.json) — Nixpacks builder, `uvicorn app.main:app` start command.
- Set environment variables (`GROQ_API_KEY`, `SECRET_KEY`, `DATABASE_URL`) in Railway dashboard.

### Frontend → Vercel
- Config: [`frontend/vercel.json`](frontend/vercel.json) — SPA rewrites all routes to `/index.html`.
- Set `VITE_API_BASE_URL` to your Railway backend URL in Vercel environment variables.

---

## 🔒 Security Notes

- JWT tokens are blacklisted on logout (stored in DB)
- All career assistant endpoints derive the authenticated user from the JWT — no user-provided IDs are trusted
- Resume data is scoped per user; cross-user access is impossible
- API keys are never exposed in responses or logs

---

## 👤 Author

Developed by **Swaroop** ([@visualxswaroop](https://github.com/visualxswaroop)).
