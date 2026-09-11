# CareerForge AI — System Documentation & Technical Blueprint

A comprehensive architectural and implementation reference for the **CareerForge AI** — an end-to-end, AI-powered career development platform featuring automated resume parsing, multi-stage semantic internship matching, AI cover letter generation, a grounded RAG career advisor, an interactive multi-turn interview preparation agent, and a multilingual voice-first resume architect with executive ATS PDF generation.

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [High-Level Architecture & Data Flow](#2-high-level-architecture--data-flow)
3. [Technology Stack](#3-technology-stack)
4. [Backend Service Breakdown](#4-backend-service-breakdown)
   - [4.1 Authentication & User Session Management](#41-authentication--user-session-management)
   - [4.2 Resume Ingestion & Extraction Engine](#42-resume-ingestion--extraction-engine)
   - [4.3 Multi-Stage Semantic Internship Matcher](#43-multi-stage-semantic-internship-matcher)
   - [4.4 AI Cover Letter Generator](#44-ai-cover-letter-generator)
   - [4.5 RAG Career Knowledge Assistant](#45-rag-career-knowledge-assistant)
   - [4.6 Interview Preparation & Mock Interview Agent](#46-interview-preparation--mock-interview-agent)
   - [4.7 Voice Resume Architect & Multilingual Translation](#47-voice-resume-architect--multilingual-translation)
5. [Database Schema & Entity Models](#5-database-schema--entity-models)
6. [Complete REST API Specification](#6-complete-rest-api-specification)
7. [Frontend Architecture & UI Systems](#7-frontend-architecture--ui-systems)
8. [Environment Configuration (`.env`)](#8-environment-configuration-env)
9. [Step-by-Step Setup Guide on a New Machine](#9-step-by-step-setup-guide-on-a-new-machine)
10. [Automated Testing & Verification Playbook](#10-automated-testing--verification-playbook)

---

## 1. Executive Overview

Modern career readiness platforms often suffer from high barriers to entry: complex resume builders, rigid upload requirements, language barriers, and lack of personalized interview guidance. The **CareerForge AI** addresses these challenges through a unified platform with the following core pillars:

1. **Intelligent Resume Ingestion**: Native parsing of `.pdf` and `.docx` files, extracting structured candidate entities (contact info, skills, work experience, education, projects, certifications).
2. **Multi-Stage Semantic Internship Matching**: Dense vector embedding retrieval via FAISS and Sentence-Transformers, followed by structured rule-based feature reranking and LLM match explanations.
3. **Tailored Cover Letter Generation**: LLM synthesis aligning candidate resumes with specific job descriptions and company cultures.
4. **RAG Career Advisor**: Grounded question answering referencing curated career knowledge bases.
5. **Interactive Interview Preparation Agent**: Personalized role recommendations, candidate strength analysis, project-specific questions, structured HR guidance (STAR method), actionable preparation roadmaps, and multi-turn mock interviews with rubric scoring.
6. **Voice-First Multilingual Resume Architect**: Zero-upload resume creation where users speak freely in their native language (Telugu, Hindi, Tamil, English, etc.). The system translates, eliminates stutters/fillers, corrects grammatical errors, structures the data, and renders ATS-compliant resumes with one-click executive PDF export.

---

## 2. High-Level Architecture & Data Flow

```
                                    +-----------------------------------------+
                                    |        React 19 + TypeScript UI         |
                                    |  (Vite, AppShell, Web Speech, jsPDF)    |
                                    +--------------------+--------------------+
                                                         |  HTTP / JWT Bearer
                                                         v
                                    +-----------------------------------------+
                                    |          FastAPI REST API Layer         |
                                    |     (CORS, Auth, Validation, Routers)   |
                                    +----+--------------------+----------+----+
                                         |                    |          |
                   +---------------------+                    |          +---------------------+
                   v                                          v                                v
+--------------------------------------+   +-----------------------------+   +---------------------------------+
|          Core Logic Services         |   |      Storage & Vectors      |   |       External AI Models        |
|--------------------------------------|   |-----------------------------|   |---------------------------------|
| - resume_parser.py (PDF/DOCX Extr.)  |   | - SQLite / PostgreSQL (ORM) |   | - Groq API                      |
| - candidate_preprocessor.py          |   | - FAISS Vector Index        |   |   (openai/gpt-oss-120b &        |
| - internship_index.py (Dense Search) |   |   (all-MiniLM-L6-v2 Embed.) |   |    llama-3.3-70b-versatile)     |
| - llm_ranker.py (Match Reasoning)    |   | - Local Uploads Directory   |   | - Sentence-Transformers         |
| - cover_letter_service.py            |   |                             |   |   (Local Vectorization)         |
| - rag/ (Ingest, Retriever, Gen.)     |   +-----------------------------+   +---------------------------------+
| - interview_agent_service.py         |
| - voice_resume_service.py            |
+--------------------------------------+
```

### Request Flow Examples
- **Resume Upload Flow**: User uploads PDF/DOCX $\rightarrow$ File magic bytes validated $\rightarrow$ Text extracted $\rightarrow$ Regex & taxonomy extract skills/metadata $\rightarrow$ Saved to database $\rightarrow$ Embeddings generated $\rightarrow$ Top internship matches queried from FAISS $\rightarrow$ Returned to client.
- **Voice Resume Flow**: User speaks in Telugu $\rightarrow$ Browser Web Speech API captures speech in continuous mode $\rightarrow$ Spoken transcript sent to `/voice-resume/extract` $\rightarrow$ Groq LLM translates to fluent English, fixes grammar, and extracts structured fields $\rightarrow$ Client displays real-time transcript & extracted profile $\rightarrow$ User clicks "Build Resume Now" $\rightarrow$ `/voice-resume/generate` formats ATS resume in English $\rightarrow$ Client exports formatted PDF via `jsPDF`.

---

## 3. Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | `3.10+` | Core language runtime |
| **FastAPI** | `^0.110.0` | High-performance async web framework |
| **Uvicorn** | `^0.28.0` | ASGI server |
| **SQLAlchemy** | `^2.0.0` | Relational ORM (SQLite / PostgreSQL) |
| **Pydantic** | `^2.6.0` | Data validation and schema serialization |
| **python-jose[cryptography]** | `^3.3.0` | JWT token encoding, decoding, and verification |
| **passlib[bcrypt]** & **bcrypt** | `^1.7.4`, `4.0.1` | Password hashing (Bcrypt algorithm) |
| **Groq SDK** | `^0.9.0` | Ultra-fast LLM inference API (`gpt-oss-120b` & `llama-3.3-70b`) |
| **Sentence-Transformers** | `^2.2.0` | Dense vector embeddings (`all-MiniLM-L6-v2`) |
| **FAISS-CPU** | `^1.7.4` | Efficient vector similarity search |
| **pdfplumber** & **PyPDF2** | `^0.11.0` | PDF text and table extraction |
| **python-docx** | `^1.1.0` | DOCX Word document extraction |
| **python-multipart** | `^0.0.9` | Form data and multi-part file uploads |
| **python-dotenv** | `^1.0.1` | Environment variable management |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | `18+` or `20+` | JavaScript runtime environment |
| **React** | `^19.2.8` | Modern component-based view library |
| **TypeScript** | `~6.0.2` | Static type safety and developer productivity |
| **Vite** | `^8.2.0` | Next-generation frontend build tool and dev server |
| **React Router** | `^7.18.2` | Declarative routing with protected route layout |
| **Tailwind CSS** | `^4.3.3` | Utility styling and responsive design tokens |
| **jsPDF** | `^4.2.1` | Client-side ATS resume PDF generation |
| **Web Speech API** | Native | In-browser speech recognition and text-to-speech |

---

## 4. Backend Service Breakdown

### 4.1 Authentication & User Session Management
- **Files**: [`app/auth.py`](file:///d:/PROJECTS/careerforgeAI/app/auth.py), [`app/dependencies.py`](file:///d:/PROJECTS/careerforgeAI/app/dependencies.py), [`app/routers/auth.py`](file:///d:/PROJECTS/careerforgeAI/app/routers/auth.py)
- **Hashing**: Passwords are saved hashed using `passlib.context.CryptContext(schemes=["bcrypt"], deprecated="auto")`.
- **JWT Tokens**:
  - `create_access_token(data={"sub": str(user.id)})` generates signed JWTs using `SECRET_KEY` and `HS256`.
  - Token validity is 30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 30`).
- **Dependency Guard**:
  - `get_current_user()` extracts Bearer tokens via `HTTPBearer()`.
  - Validates token signature, expiration, and checks the `BlacklistedToken` table to ensure logged-out tokens are immediately invalid.
  - Queries `models.User` by `int(payload["sub"])`.

### 4.2 Resume Ingestion & Extraction Engine
- **Files**: [`app/parser.py`](file:///d:/PROJECTS/careerforgeAI/app/parser.py), [`app/resume_parser.py`](file:///d:/PROJECTS/careerforgeAI/app/resume_parser.py), [`app/routers/resume.py`](file:///d:/PROJECTS/careerforgeAI/app/routers/resume.py)
- **File Validation**: Magic byte check (`%PDF-` for PDF, `PK\x03\x04` for DOCX) preventing spoofed file uploads; max file size capped at 5MB.
- **Extraction Pipeline**:
  - PDF extracted via `pdfplumber.extract_text()`; DOCX extracted via `docx.Document()`.
  - Regex patterns identify:
    - Email addresses (`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
    - Phone numbers (`(\+?\d[\d\s\-]{8,14}\d)`)
    - LinkedIn & GitHub URLs
  - Skill matching evaluates input tokens against comprehensive dictionaries (`TECHNICAL_SKILLS`, `SOFT_SKILLS`).
  - Section segmentation splits text into Work Experience, Projects, Education, and Certifications.

### 4.3 Multi-Stage Semantic Internship Matcher
- **Files**: [`app/candidate_preprocessor.py`](file:///d:/PROJECTS/careerforgeAI/app/candidate_preprocessor.py), [`app/internship_index.py`](file:///d:/PROJECTS/careerforgeAI/app/internship_index.py), [`app/llm_ranker.py`](file:///d:/PROJECTS/careerforgeAI/app/llm_ranker.py)
- **Stage 1 (Dense Vector Retrieval)**:
  - Embeddings created using `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional).
  - Candidate profile text is vectorized and matched against pre-built FAISS index of internships (`internships.json`).
  - Returns top $K$ semantic candidates.
- **Stage 2 (Feature-Based Scoring & Filtering)**:
  - Exact skill overlap score + title relevance + degree alignment.
  - Generates a normalized match percentage (e.g. 85%).
- **Stage 3 (LLM Re-ranking & Match Explanation)**:
  - Groq LLM analyzes top matched candidates against candidate resume.
  - Explains why the candidate fits, highlights missing prerequisites, and provides tailored tips.

### 4.4 AI Cover Letter Generator
- **Files**: [`app/cover_letter_service.py`](file:///d:/PROJECTS/careerforgeAI/app/cover_letter_service.py), [`app/routers/cover_letter.py`](file:///d:/PROJECTS/careerforgeAI/app/routers/cover_letter.py)
- **Prompt Engineering**:
  - Combines parsed candidate resume data with company name, job role, and job description.
  - Produces standard executive or dynamic tone variations.
- **Resilience**: Lazy Groq import; if `GROQ_API_KEY` is missing or fails, a deterministic template fallback populates candidate details into standard paragraphs.

### 4.5 RAG Career Knowledge Assistant
- **Files**: [`app/rag/ingest.py`](file:///d:/PROJECTS/careerforgeAI/app/rag/ingest.py), [`app/rag/retriever.py`](file:///d:/PROJECTS/careerforgeAI/app/rag/retriever.py), [`app/rag/generator.py`](file:///d:/PROJECTS/careerforgeAI/app/rag/generator.py), [`app/routers/career_assistant.py`](file:///d:/PROJECTS/careerforgeAI/app/routers/career_assistant.py)
- **Ingestion**: Markdown & DOCX guides chunked into overlapping segments (500 tokens, 100 overlap).
- **Retrieval**: Dense retrieval via FAISS based on user queries.
- **Synthesis**: Grounded LLM response generation with source citations.

### 4.6 Interview Preparation & Mock Interview Agent
- **Files**: [`app/interview_agent_service.py`](file:///d:/PROJECTS/careerforgeAI/app/interview_agent_service.py), [`app/routers/interview_agent.py`](file:///d:/PROJECTS/careerforgeAI/app/routers/interview_agent.py)
- **Capabilities**:
  1. **Role Recommendation**: Evaluates user's actual parsed skills and projects to recommend 3-5 best-fit job roles.
  2. **Technical & HR Questions**: Generates role-specific questions and behavioral questions mapped to the STAR method (Situation, Task, Action, Result).
  3. **Personalized Roadmaps**: 2 to 4-week step-by-step interview preparation schedules with concrete milestones.
  4. **Project Defense**: Deep-dive questions testing architectural decisions, performance challenges, and trade-offs of the candidate's actual projects.
  5. **Interactive Mock Interview**: Multi-turn interview conversation. The AI acts as an interviewer, asks questions sequentially, evaluates user answers with 1-10 scores on Clarity, Technical Depth, and STAR Structure, and provides constructive feedback before advancing.

### 4.7 Voice Resume Architect & Multilingual Translation
- **Files**: [`app/voice_resume_service.py`](file:///d:/PROJECTS/careerforgeAI/app/voice_resume_service.py), [`app/routers/voice_resume.py`](file:///d:/PROJECTS/careerforgeAI/app/routers/voice_resume.py), [`frontend/src/utils/resumePdf.ts`](file:///d:/PROJECTS/careerforgeAI/frontend/src/utils/resumePdf.ts)
- **Multilingual Input $\rightarrow$ 100% English Output**:
  - Accepts free-form spoken speech in **Telugu, Hindi, Tamil, Spanish, French, English, etc.**
  - LLM instructions enforce strict translation: all skills, project descriptions, summaries, and work experiences are converted to standard professional English.
  - Names in regional scripts (e.g. `వెంకటేష్`) are transliterated into Latin script (`Venkatesh`).
- **Grammar Polish & Stutter Elimination**:
  - Automatically removes verbal fillers (`um`, `uh`, `like`, `you know`) and repetitive phrases.
  - Elevates spoken phrases into ATS-friendly statements using high-impact action verbs (*Orchestrated, Executed, Diagnosed, Engineered*).
- **Template Auto-Classification**:
  - Automatically identifies whether candidate background is **Technical** (Software, IT, Science) or **Blue-Collar / Trades** (Electrician, Driver, Warehouse, Mechanic, Construction, Logistics).
  - Formats headings accordingly (e.g., "Core Competencies", "Work History", "Equipment & Certifications" vs. "Technical Skills", "Projects").
- **Unblocked Workflow**:
  - Users can generate resumes even with sparse or partial information.
  - Live editable transcript display allows manual review or typing before generation.
- **Client-Side PDF Generation (`jsPDF`)**:
  - [resumePdf.ts](file:///d:/PROJECTS/careerforgeAI/frontend/src/utils/resumePdf.ts) renders executive typography with bold section headers, underline rules, bullet indentations, and multi-page pagination.

---

## 5. Database Schema & Entity Models

Defined in [`app/models.py`](file:///d:/PROJECTS/careerforgeAI/app/models.py):

### Table: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Unique user ID |
| `name` | String(100) | Nullable | Full candidate name |
| `email` | String(100) | Unique, Index, Not Null | User login email |
| `hashed_password` | String(255) | Not Null | Bcrypt password hash |
| `created_at` | DateTime | Default `utcnow` | Account creation timestamp |

### Table: `blacklisted_tokens`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Token record ID |
| `token` | String | Index, Not Null | Revoked JWT Bearer string |
| `blacklisted_at` | DateTime | Default `utcnow` | Logout timestamp |

### Table: `resumes`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Resume ID |
| `user_id` | Integer | Foreign Key (`users.id`) | Owner user reference |
| `filename` | String(255) | Not Null | Uploaded file name |
| `file_path` | String(500) | Not Null | Storage path on disk |
| `parsed_data` | JSON | Nullable | Extracted structured resume fields |
| `created_at` | DateTime | Default `utcnow` | Upload timestamp |

### Table: `cover_letters`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto-increment | Cover letter ID |
| `user_id` | Integer | Foreign Key (`users.id`) | Owner user reference |
| `company_name` | String(100) | Not Null | Target company |
| `job_role` | String(100) | Not Null | Target job title |
| `content` | Text | Not Null | Generated letter body |
| `created_at` | DateTime | Default `utcnow` | Generation timestamp |

---

## 6. Complete REST API Specification

### Authentication (`/auth`)
- `POST /auth/register`: Create user (`username`, `password`, `name`).
- `POST /auth/token`: OAuth2 password request $\rightarrow$ `{ "access_token": "...", "token_type": "bearer" }`.
- `POST /auth/logout`: Blacklists current JWT token in DB.
- `GET /auth/me`: Returns current user details.

### Resume & Matching (`/resume`)
- `POST /resume/upload`: Multi-part file upload (`.pdf`, `.docx`). Parses entities and stores resume record.
- `GET /resume/my-resumes`: List all resumes uploaded by the current user.
- `GET /resume/latest`: Retrieve most recent parsed resume data.
- `POST /resume/recommend`: Runs dense FAISS retrieval and reranking for the latest uploaded resume.

### Cover Letter (`/cover-letter`)
- `POST /cover-letter/generate`: Input `{ company_name, job_role, job_description, resume_id? }` $\rightarrow$ `{ cover_letter: "..." }`.
- `GET /cover-letter/history`: Fetch user's previous cover letters.

### Career Assistant RAG (`/career-assistant`)
- `POST /career-assistant/chat`: Input `{ message, conversation_history? }` $\rightarrow$ `{ reply: "...", sources: [...] }`.

### Interview Agent (`/interview-agent`)
- `POST /interview-agent/chat`: Full multi-turn assistant endpoint supporting:
  - Role recommendations
  - Skills analysis
  - Technical & HR question generation
  - Multi-turn mock interview evaluation
- `GET /interview-agent/history`: Fetch saved interview interaction history.

### Voice Resume Architect (`/voice-resume`)
- `POST /voice-resume/extract`:
  - **Body**:
    ```json
    {
      "transcript": "నా పేరు వెంకటేష్... (Spoken text in any language)",
      "conversation_history": [{"role": "user", "content": "..."}],
      "language_hint": "te"
    }
    ```
  - **Response**:
    ```json
    {
      "extracted_data": {
        "full_name": "Venkatesh Raju",
        "skills": ["Wiring", "Motor Repair"],
        "work_experience": ["Electrician in Hyderabad - 4 years"],
        "education": ["ITI Electrical"]
      },
      "missing_fields": ["email", "phone"],
      "follow_up_question": "What phone number can recruiters reach you at?",
      "is_complete": false,
      "detected_language": "Telugu"
    }
    ```
- `POST /voice-resume/generate`:
  - **Body**:
    ```json
    {
      "extracted_data": { ... },
      "template_hint": "auto"
    }
    ```
  - **Response**:
    ```json
    {
      "resume_text": "Venkatesh Raju\n...\nCORE COMPETENCIES\n- Wiring...",
      "template_used": "blue-collar",
      "generation_method": "llm"
    }
    ```

---

## 7. Frontend Architecture & UI Systems

### App Layout & Routing
- [`frontend/src/App.tsx`](file:///d:/PROJECTS/careerforgeAI/frontend/src/App.tsx) uses React Router v7:
  - Public routes: `/` (Landing), `/login`, `/register`.
  - Protected routes wrapped with `<ProtectedRoute>` and `<AppShell>`:
    - `/app`: Overview dashboard
    - `/app/resume`: Traditional Resume Upload & Parsing
    - `/app/voice-resume`: Voice Resume Architect
    - `/app/interview-agent`: Interview Preparation & Mock Sessions
    - `/app/cover-letter`: Cover Letter Generator
    - `/app/internships`: Internship Matching
    - `/app/profile`: Profile Settings

### Client Architecture Patterns
- **API Client**: [`frontend/src/api/client.ts`](file:///d:/PROJECTS/careerforgeAI/frontend/src/api/client.ts) provides a unified `request<T>()` fetch wrapper that automatically appends `Authorization: Bearer <token>` and parses backend errors.
- **Theme System**: Responsive light/dark mode managed via `data-theme="dark|light"` attribute on the root HTML element with CSS variables (`var(--accent)`, `var(--surface)`, `var(--text)`, `var(--border)`).
- **Audio & Speech Engine**:
  - `SpeechRecognitionAPI`: Web Speech API with `continuous: true` and a 3.5s auto-silence timer.
  - `SpeechSynthesis`: Text-to-speech for speaking follow-up questions aloud.
  - `AudioContext` & `OfflineAudioContext`: Decodes video audio tracks client-side.
- **PDF Generation**:
  - [`frontend/src/utils/resumePdf.ts`](file:///d:/PROJECTS/careerforgeAI/frontend/src/utils/resumePdf.ts) creates executive A4 PDFs with 40pt margins, bold headers, divider lines, and text wrapping.

---

## 8. Environment Configuration (`.env`)

Create a `.env` file in the root backend directory:

```ini
# Groq API Key for LLM Inference
GROQ_API_KEY=gsk_your_groq_api_key_here

# JWT Secret Key (generate a random 32-character string)
SECRET_KEY=swaroop-secret-key-change-in-production

# Algorithm for JWT signing
ALGORITHM=HS256

# Token expiration in minutes
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database URL (defaults to SQLite if omitted)
DATABASE_URL=sqlite:///./career_companion.db

# HuggingFace Token (Optional: avoids rate limits on embedding download)
# HF_TOKEN=hf_your_token_here
```

---

## 9. Step-by-Step Setup Guide on a New Machine

Follow these exact steps to set up and run the project on a new computer:

### Step 1: Clone or Copy Repository
```bash
git clone <repository_url>
cd "careerforgeAI"
```

### Step 2: Set Up Backend Environment (Python 3.10+)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Create `.env` in the root folder:
```bash
# Ensure GROQ_API_KEY is populated
echo GROQ_API_KEY=your_key_here > .env
echo SECRET_KEY=swaroop-secret-key >> .env
```

### Step 4: Initialize Frontend Environment (Node.js 18+)
```bash
cd frontend

# Install npm packages
npm install

# Verify build
npm run build
```

### Step 5: Start Servers
Open two terminals:

**Terminal 1 (Backend)**:
```bash
# In project root with venv activated:
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs available at: `http://127.0.0.1:8000/docs`

**Terminal 2 (Frontend)**:
```bash
# In frontend directory:
npm run dev
```
- App available at: `http://localhost:5173`

---

## 10. Automated Testing & Verification Playbook

### 1. Test Backend Pipeline (Telugu Extraction + English ATS Resume)
Run the following script to verify end-to-end translation, LLM extraction, and resume formatting:
```bash
python -c "
from app.voice_resume_service import extract_resume_fields, generate_resume_document
sample = 'నా పేరు వెంకటేష్ రావు. నా ఈమెయిల్ venkat@gmail.com. నేను 4 సంవత్సరాలు ఎలక్ట్రీషియన్‌గా పనిచేశాను. వైరింగ్, మోటార్ రిపేర్ వచ్చు.'
res = extract_resume_fields(sample, language_hint='te')
print('Extracted:', res['extracted_data']['full_name'], res['extracted_data']['skills'])
doc = generate_resume_document(res['extracted_data'])
print('Template:', doc['template_used'])
print('First 200 chars:\n', doc['resume_text'][:200])
"
```

### 2. Test Interview Agent Phase A Suite
```bash
python test_interview_agent.py
```
*Expected: 9/9 tests pass (role recommendation, strengths, HR STAR guidance, roadmap, mock interview multi-turn, and data isolation).*

### 3. Verify Frontend Production Build
```bash
cd frontend
npm run build
```
*Expected: `✓ built in ~3s` with 0 TypeScript compilation errors.*

---

## Summary for LLM Agents & Re-implementers

When implementing or extending services in another instance of this project:
1. **Always inherit from schemas in `app/schemas.py`** to keep request/response serialization consistent across the 7 routers.
2. **Follow lazy-import conventions for external AI clients** (`from groq import Groq` inside functions with `try/except None` fallbacks) so tests and offline flows run smoothly.
3. **Use the `get_current_user` dependency** on all sensitive endpoints to ensure per-user data isolation.
4. **All multilingual user speech must be translated to English** at the extraction and generation stages for uniform ATS formatting and PDF rendering.
