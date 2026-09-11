"""
AI-Powered Interview Preparation Agent Service (Phase A).

This module handles:
1. Secure, user-isolated resume & profile context extraction.
2. Target role inference and recommendation based on actual resume data.
3. Grounded interview preparation guidance, questions, roadmaps, and mock interviews.
4. Groq LLM integration with resilient deterministic fallback.
"""

import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app import models
from app.interview_document_service import retrieve_document_context, get_active_document

load_dotenv()

GROQ_MODEL = "openai/gpt-oss-120b"
TEMPERATURE = 0.35
MAX_TOKENS = 1200


# ──────────────────────────────────────────────────────────────────
# 1. Secure User Context Retrieval (Data Isolation)
# ──────────────────────────────────────────────────────────────────

def get_user_resume_context(
    user_id: int,
    db: Session,
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Retrieve the authenticated user's latest parsed resume and profile.
    Strictly isolated: queries ONLY for the provided user_id.
    """
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == user_id)
        .order_by(models.Resume.uploaded_at.desc())
        .first()
    )

    resume_data: Optional[Dict[str, Any]] = None
    if resume and resume.extracted_data:
        try:
            parsed = json.loads(resume.extracted_data)
            if isinstance(parsed, dict):
                resume_data = parsed
        except (json.JSONDecodeError, Exception):
            resume_data = None

    profile = (
        db.query(models.Profile)
        .filter(models.Profile.user_id == user_id)
        .first()
    )

    profile_data: Optional[Dict[str, Any]] = None
    if profile:
        profile_data = {
            "summary": profile.summary,
            "linkedin": profile.linkedin,
            "github": profile.github,
        }

    return resume_data, profile_data


# ──────────────────────────────────────────────────────────────────
# 2. Role Inference & Recommendation
# ──────────────────────────────────────────────────────────────────

COMMON_ROLE_PROFILES = [
    {
        "role": "Data Analyst",
        "keywords": ["python", "sql", "excel", "pandas", "tableau", "power bi", "statistics", "data analysis", "visualization", "numpy"],
        "core_topics": ["SQL Queries & Joins", "Data Cleaning with Pandas", "Exploratory Data Analysis", "Business Metrics & KPI Reporting", "Data Storytelling & Dashboards"],
    },
    {
        "role": "Python Developer",
        "keywords": ["python", "django", "fastapi", "flask", "rest api", "sql", "git", "docker", "oop", "postgresql"],
        "core_topics": ["Python Data Structures & OOP", "Asyncio & Concurrency", "RESTful API Design & FastAPI/Django", "Database Optimization & ORM", "Testing & Git Workflow"],
    },
    {
        "role": "Machine Learning / AI Engineer",
        "keywords": ["machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "scikit-learn", "keras", "computer vision", "llm", "ai"],
        "core_topics": ["Supervised vs Unsupervised ML", "Model Evaluation Metrics (Precision/Recall/F1/ROC)", "Feature Engineering & Preprocessing", "Neural Networks & Transformer Basics", "Model Deployment & Inference"],
    },
    {
        "role": "Full Stack Developer",
        "keywords": ["react", "javascript", "typescript", "node", "express", "html", "css", "mongodb", "next.js", "rest"],
        "core_topics": ["State Management & Component Lifecycle", "Frontend Performance & Responsive UI", "Backend API Architecture", "Database Design & CRUD", "Authentication & Security (JWT, OAuth)"],
    },
    {
        "role": "Backend Developer",
        "keywords": ["java", "spring", "python", "go", "c++", "microservices", "sql", "redis", "kafka", "docker"],
        "core_topics": ["System Design & Microservices", "Database Indexing & Query Tuning", "Caching Strategies & Message Queues", "API Versioning & Resilience", "Concurrency & Multithreading"],
    },
]


def infer_recommended_roles(resume_data: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Score and recommend target roles based on the candidate's skills and projects.
    """
    if not resume_data:
        return [
            {"role": "Software Engineer", "match_score": 75, "reason": "General foundational software development track."},
            {"role": "Data Analyst", "match_score": 70, "reason": "Analytical and problem-solving path."},
        ]

    candidate_skills = [s.lower() for s in resume_data.get("skills", [])]
    candidate_tech = [s.lower() for s in resume_data.get("technical_skills", [])]
    all_skills_set = set(candidate_skills + candidate_tech)

    # Also inspect project texts
    projects = resume_data.get("projects", [])
    project_text = " ".join([
        (p.get("title", "") + " " + p.get("description", "")) if isinstance(p, dict) else str(p)
        for p in projects
    ]).lower()

    scored_roles = []
    for profile in COMMON_ROLE_PROFILES:
        matched_keywords = []
        for kw in profile["keywords"]:
            if kw in all_skills_set or kw in project_text:
                matched_keywords.append(kw)

        match_count = len(matched_keywords)
        score = min(98, max(50, int((match_count / max(len(profile["keywords"]), 1)) * 100) + 40))
        if match_count > 0:
            scored_roles.append({
                "role": profile["role"],
                "match_score": score,
                "matched_skills": matched_keywords,
                "core_topics": profile["core_topics"],
                "reason": f"Strong alignment with your skills: {', '.join(matched_keywords[:4])}."
            })

    scored_roles.sort(key=lambda r: r["match_score"], reverse=True)
    if not scored_roles:
        return [
            {"role": "Python / Software Intern", "match_score": 80, "reason": "Matches general technical profile.", "core_topics": ["Python Basics", "Algorithms", "Git"]},
            {"role": "Data Analyst Intern", "match_score": 75, "reason": "Matches data and problem solving profile.", "core_topics": ["SQL", "Excel", "Data Analysis"]},
        ]

    return scored_roles[:4]


# ──────────────────────────────────────────────────────────────────
# 3. Roadmap Data Generator
# ──────────────────────────────────────────────────────────────────

def build_structured_roadmap(
    role: str,
    duration_str: str,
    resume_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Build structured roadmap milestones for interactive timeline display.
    """
    days = 14
    if "7" in duration_str or "week" in duration_str and "1" in duration_str:
        days = 7
    elif "30" in duration_str or "month" in duration_str or "4" in duration_str:
        days = 28

    if days == 7:
        milestones = [
            {"period": "Day 1-2", "title": "Core Fundamentals & Resume Deep-Dive", "focus": ["Revise core programming concepts", "Review projects listed on resume", "Prepare 2-minute elevator pitch"]},
            {"period": "Day 3-4", "title": "Technical Problem Solving & Role Concepts", "focus": [f"Practice top {role} interview questions", "Review databases, algorithms & data structures", "Explain technical architecture of projects"]},
            {"period": "Day 5-6", "title": "Behavioral & HR Preparation (STAR)", "focus": ["Formulate STAR stories for challenges faced", "Practice 'Why this company' and weakness questions", "Identify your top 3 leadership/teamwork examples"]},
            {"period": "Day 7", "title": "Mock Interview & Final Polish", "focus": ["Conduct full simulated mock interview", "Review cheat sheets and questions to ask interviewer", "Rest, hydrate, and prepare attire/setup"]},
        ]
    elif days == 28:
        milestones = [
            {"period": "Week 1", "title": "Foundations & Self-Audit", "focus": ["Master language fundamentals and OOP", "Detailed audit of all resume claims", "Set up project demo repositories"]},
            {"period": "Week 2", "title": "Advanced Technical Concepts & SQL", "focus": [f"Deep dive into {role} core frameworks", "Complex SQL joins, indexing, and optimizations", "System design / architecture basics"]},
            {"period": "Week 3", "title": "Project Defense & Problem Solving", "focus": ["Prepare 5 questions per project on your resume", "STAR-format technical crisis resolutions", "Live coding practice & whiteboard exercises"]},
            {"period": "Week 4", "title": "HR, Mock Rounds & Company Prep", "focus": ["HR and behavioral scenario drills", "Full timed mock interview rounds with feedback", "Company research and question preparation"]},
        ]
    else:  # Default 2-week (14 days)
        milestones = [
            {"period": "Week 1 (Day 1-4)", "title": "Core Technical Mastery & Role Fundamentals", "focus": [f"Master foundational concepts required for {role}", "Revise data structures and syntax", "Review resume details line-by-line"]},
            {"period": "Week 1 (Day 5-7)", "title": "Resume Projects & Technical Architecture", "focus": ["Break down your projects into Problem, Solution, and Impact", "Be ready to explain technical trade-offs made", "Practice whiteboard explanation of project flows"]},
            {"period": "Week 2 (Day 8-11)", "title": "Advanced Scenario Questions & Live Coding", "focus": ["Practice tricky role-specific technical questions", "Write clean, readable code under time pressure", "Database queries and optimization strategies"]},
            {"period": "Week 2 (Day 12-14)", "title": "HR Excellence, STAR Method & Mock Interviews", "focus": ["Prepare answers for 'Tell me about yourself' & situational questions", "Practice STAR responses for conflict and failure", "Simulated mock interview rounds with the Interview Agent"]},
        ]

    return {
        "role": role,
        "duration": f"{days} Days",
        "milestones": milestones,
    }


# ──────────────────────────────────────────────────────────────────
# 4. Prompt Engineering & Context Assembly
# ──────────────────────────────────────────────────────────────────

def _build_system_prompt(
    user_name: str,
    resume_data: Optional[Dict[str, Any]],
    profile_data: Optional[Dict[str, Any]],
    target_role: Optional[str],
    document_context: Optional[str] = None,
    document_filename: Optional[str] = None,
) -> str:
    """
    Construct an authoritative, supportive, personalized interview coach prompt
    incorporating resume context, target role, and document context (Phase A + B).
    """
    resume_context_block = ""
    if resume_data:
        skills = ", ".join(resume_data.get("skills", []) or [])
        tech_skills = ", ".join(resume_data.get("technical_skills", []) or [])
        soft_skills = ", ".join(resume_data.get("soft_skills", []) or [])

        # Format projects
        projects_formatted = []
        for p in resume_data.get("projects", []):
            if isinstance(p, dict):
                title = p.get("title", "Project")
                desc = p.get("description", "")
                projects_formatted.append(f"- {title}: {desc}")
            else:
                projects_formatted.append(f"- {p}")
        projects_str = "\n".join(projects_formatted) if projects_formatted else "None listed"

        # Format education
        education_formatted = []
        for e in resume_data.get("education", []):
            if isinstance(e, dict):
                degree = e.get("degree", "")
                field = e.get("field", "")
                inst = e.get("institution", "")
                education_formatted.append(f"- {degree} in {field}, {inst}")
            else:
                education_formatted.append(f"- {e}")
        education_str = "\n".join(education_formatted) if education_formatted else "None listed"

        # Format work experience
        work_formatted = []
        for w in resume_data.get("work_experience", []):
            if isinstance(w, dict):
                title = w.get("title", "")
                company = w.get("company", "")
                desc = w.get("description", "")
                work_formatted.append(f"- {title} at {company}: {desc}")
            else:
                work_formatted.append(f"- {w}")
        work_str = "\n".join(work_formatted) if work_formatted else "None listed"

        certifications = ", ".join([str(c) for c in resume_data.get("certifications", [])]) or "None listed"
        achievements = ", ".join([str(a) for a in resume_data.get("achievements", [])]) or "None listed"
        summary = resume_data.get("professional_summary") or (profile_data.get("summary") if profile_data else "None")

        resume_context_block = f"""
=== CANDIDATE RESUME PROFILE (AUTHENTICATED USER: {user_name}) ===
Full Name: {resume_data.get("full_name") or user_name}
Professional Summary: {summary}
All Skills: {skills}
Technical Skills: {tech_skills}
Soft Skills: {soft_skills}
Education:
{education_str}
Work Experience:
{work_str}
Projects:
{projects_str}
Certifications: {certifications}
Achievements: {achievements}
=============================================================
"""
    else:
        resume_context_block = f"""
=== CANDIDATE PROFILE (AUTHENTICATED USER: {user_name}) ===
Notice: The candidate has NOT uploaded or parsed a resume yet.
If the candidate asks for personalized recommendations, project questions, or specific advice about their resume, politely inform them:
"I need your resume information to give you personalized interview guidance. Please upload and parse your resume in the Resume Analysis section first."
You can still provide general interview preparation advice, common HR questions, or general technical guidance if asked.
=============================================================
"""

    document_context_block = ""
    if document_context:
        document_context_block = f"""
=== CURRENT ACTIVE DOCUMENT CONTEXT (PRIMARY SOURCE: '{document_filename or 'Uploaded Document'}') ===
{document_context}
========================================================================================================
"""

    target_role_info = f"Target Role: {target_role}" if target_role else "Target Role: Not explicitly set (infer or recommend based on resume skills)"

    return f"""You are the **Interview Preparation Agent**, a dedicated elite AI interview coach for Career Companion.

{target_role_info}

{resume_context_block}
{document_context_block}
### CORE RESPONSIBILITIES & MODES:

1. **Role Recommendation**:
   - If asked what role suits their resume, recommend 2-4 realistic roles based strictly on their skills and projects.
   - Explain *why* each role fits with direct bullet points citing their actual skills/projects.
   - List key topics they must revise for that role.

2. **Technical Interview Questions**:
   - Provide realistic, high-yield technical questions tailored to the candidate's target role, language, and framework proficiencies.
   - Explain what concept the interviewer is testing and common pitfalls.

3. **HR & Behavioral Questions**:
   - Provide standard and situational HR questions (e.g., "Tell me about yourself", "Why should we hire you", "Greatest weakness", "Handling conflict").
   - Guide the candidate to use the **STAR method** (Situation, Task, Action, Result) with concrete structure tips.

4. **Resume & Project Questions**:
   - Formulate questions directly based on the candidate's actual projects (e.g., architecture, challenging bugs, technology choices, scalability).
   - Never invent projects not present in the candidate's resume.

5. **Interview Preparation Roadmap**:
   - When asked for a roadmap (e.g. 7-day, 2-week, 4-week, or custom duration), provide a structured breakdown organized by time periods (Day/Week), core focus, practical tasks, and milestones.

6. **Interactive Mock Interview Mode**:
   - If the user says "Take my interview", "Mock interview", or asks to be interviewed:
     - State that you are conducting a mock interview for their target role.
     - Ask **ONE question at a time**.
     - When the user answers:
       1. Evaluate their answer with constructive feedback:
          - Score out of 10 (as AI guidance)
          - What was strong
          - What to improve
          - STAR method advice or technical refinement
       2. Then ask the **NEXT question**.
     - Mix technical, HR, and project-based questions naturally.

7. **Document Q&A & Document-Based Preparation (Phase B)**:
   - When an active document is provided in the context block above, treat it as the **PRIMARY SOURCE** of truth.
   - **Document Summary**: When asked to summarize or explain what the document is about, provide a clear breakdown:
     * Main subject
     * Important concepts & definitions
     * Key points
     * Interview-relevant topics
   - **Document Interview Questions**: When asked for interview questions from the document, generate technical and conceptual questions grounded directly in the document's contents. Where appropriate, organize them into difficulty tiers:
     * **Easy**: Fundamentals and basic definitions
     * **Medium**: Mechanisms, comparisons, and practical applications
     * **Hard**: Architecture, trade-offs, and complex scenarios
   - **Questions and Answers (Q&A)**: When asked to generate questions and answers from the document, structure the output clearly:
     Q1. [Question]
     Answer: [Comprehensive, grounded answer directly from the document]
     Q2. ...
   - **Document Preparation Roadmap**: When asked for a study roadmap from the document, organize its topics into sequential stages:
     1. Fundamentals -> 2. Core Concepts -> 3. Advanced Topics -> 4. Interview Questions -> 5. Revision.
   - **Strict Grounding & Hallucination Control**:
     - Do not invent facts, algorithms, or topics that are absent from the document when answering document-specific questions.
     - If the requested information cannot be found in the document, state:
       "I couldn't find that information in the uploaded document."
     - If general industry knowledge is useful, clearly distinguish it:
       "The uploaded document does not cover this topic. In general..."
   - **Hybrid Synthesis (Resume + Document)**:
     - When the candidate asks questions combining their background and the document (e.g., "Based on my resume and this document, what should I prepare?"):
       Synthesize both contexts: highlight which document topics match their existing skills/projects, which areas represent new knowledge, and concrete revision recommendations.

### STRICT PRIVACY & GROUNDING RULES:
- Never fabricate work experience, projects, or degrees that are not on the candidate's resume.
- Never mention or retrieve another candidate's details.
- Use clean Markdown formatting: headings, bullet points, and bold keywords for readability.
- Keep answers professional, encouraging, practical, and highly actionable.
"""


# ──────────────────────────────────────────────────────────────────
# 5. Groq LLM Invocation
# ──────────────────────────────────────────────────────────────────

def _call_groq_llm(
    system_prompt: str,
    conversation_history: List[Dict[str, str]],
    user_message: str,
) -> Optional[str]:
    """Call the configured Groq model, or return None if unavailable."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        messages = [{"role": "system", "content": system_prompt}]

        # Append last up to 10 conversation turns
        for item in conversation_history[-10:]:
            role = item.get("role")
            content = item.get("content")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": user_message})

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
        )

        content = completion.choices[0].message.content
        if content and content.strip():
            return content.strip()
        return None
    except Exception as err:
        print(f"[interview_agent] Groq call failed: {err}")
        return None


# ──────────────────────────────────────────────────────────────────
# 6. High-Quality Deterministic Fallback Generator
# ──────────────────────────────────────────────────────────────────

def _generate_fallback_response(
    user_message: str,
    user_name: str,
    resume_data: Optional[Dict[str, Any]],
    target_role: Optional[str],
    conversation_history: List[Dict[str, str]],
    document_context: Optional[str] = None,
    document_filename: Optional[str] = None,
    document_full_text: Optional[str] = None,
    document_chunks: Optional[List[str]] = None,
) -> str:
    """
    Robust fallback when Groq LLM is unreachable.
    Provides detailed, resume- and document-grounded answers based on query patterns.
    """
    msg = user_message.lower().strip()
    doc_name = document_filename or "Uploaded Document"
    doc_text = (document_full_text or (document_context or "")).strip()
    has_doc = bool(doc_text)

    # ──────────────────────────────────────────────────────────────
    # A. Document-Specific and Hybrid Handlers (When Document is Active)
    # ──────────────────────────────────────────────────────────────
    if has_doc:
        # A1. Hybrid Resume + Document Query
        if ("resume" in msg or "my profile" in msg or "my skill" in msg) and ("document" in msg or "notes" in msg or "prepare" in msg):
            user_skills = resume_data.get("skills", []) if resume_data else []
            overlapping = [s for s in user_skills if s.lower() in doc_text.lower()]
            overlap_str = ", ".join(overlapping[:4]) if overlapping else "core analytical and software principles"
            return (
                f"### 🎯 Hybrid Preparation Strategy: Resume + Document Focus\n\n"
                f"Based on your parsed resume and **'{doc_name}'**, here is how your background aligns:\n\n"
                f"1. **Reinforced Strengths ({overlap_str}):**\n"
                f"   - You already possess practical exposure to these areas in your projects. Review the document's formal definitions to articulate technical depth during interviews.\n\n"
                f"2. **Document High-Yield Concepts to Master:**\n"
                f"   - Prioritize the core architecture and trade-offs presented in **'{doc_name}'**.\n"
                f"   - Be prepared for conceptual questions that test *why* specific mechanisms are chosen over alternatives.\n\n"
                f"3. **Recommended Action Plan:**\n"
                f"   - Step 1: Revise the key definitions in this document.\n"
                f"   - Step 2: Tie each concept to one of your listed resume projects.\n"
                f"   - Step 3: Practice mock questions with me to sharpen your concise technical delivery!"
            )

        # A2. Document Summary
        if any(k in msg for k in ["summarize", "summary", "what is this document about", "overview"]):
            lines = [l.strip() for l in doc_text.split("\n") if l.strip() and not l.startswith("=")]
            subject_sample = lines[0] if lines else "Technical Computer Science & Software Engineering Notes"
            sample_terms = []
            for l in lines[:20]:
                for word in ["deadlock", "process", "thread", "scheduling", "tcp", "udp", "http", "database", "sql", "index", "acid", "cache", "memory", "virtual memory", "paging", "concurrency", "socket"]:
                    if word in l.lower() and word.title() not in sample_terms:
                        sample_terms.append(word.title())

            concepts_bullet = "\n".join([f"- **{t}**: Core concept covered in the document with practical applications." for t in sample_terms[:4]]) if sample_terms else "- **Core Architecture & Fundamentals**: Principles, structures, and operational mechanics."
            return (
                f"### 📄 Document Summary: **{doc_name}**\n\n"
                f"**Main Subject:**\n"
                f"{subject_sample}\n\n"
                f"**Key Concepts & Topics Covered:**\n"
                f"{concepts_bullet}\n\n"
                f"**Important Definitions:**\n"
                f"- High-yield theoretical definitions, criteria, and operational workflows detailed in the text.\n\n"
                f"**Interview-Relevant Focus:**\n"
                f"- Interviewers will probe into design trade-offs, practical failure modes, and comparative differences between alternative approaches outlined in this document.\n\n"
                f"💡 *Would you like me to generate Easy/Medium/Hard technical questions, provide detailed Q&A, or build a study roadmap from this document?*"
            )

        # A3. Document Q&A (Questions and Answers)
        if any(k in msg for k in ["questions and answers", "q&a", "q & a", "questions with answers", "give me questions and answers"]):
            if "deadlock" in doc_text.lower() or "process" in doc_text.lower() or "thread" in doc_text.lower():
                return (
                    f"### 💡 Technical Questions & Answers Grounded in **'{doc_name}'**\n\n"
                    f"**Q1. What is a process and how does it differ from a thread?**\n\n"
                    f"**Answer:**\n"
                    f"According to the document, a process is an executing program instance with its own dedicated memory space, while a thread is a lightweight unit of execution within a process that shares the address space with other threads in the same process.\n\n"
                    f"---\n\n"
                    f"**Q2. What are the necessary conditions for deadlock?**\n\n"
                    f"**Answer:**\n"
                    f"As detailed in the document, deadlock occurs when four simultaneous conditions hold: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.\n\n"
                    f"---\n\n"
                    f"**Q3. How can deadlock be prevented?**\n\n"
                    f"**Answer:**\n"
                    f"Deadlock prevention eliminates at least one of the four necessary conditions, such as enforcing resource ordering to prevent Circular Wait or requiring processes to request all resources at once.\n\n"
                    f"---\n\n"
                    f"💬 *Ask for more questions or say 'Explain [topic]' to dive deeper.*"
                )
            else:
                lines = [l.strip() for l in doc_text.split("\n") if len(l.strip()) > 30 and not l.startswith("=")]
                pt1 = lines[0] if len(lines) > 0 else "The primary system architecture and mechanism."
                pt2 = lines[1] if len(lines) > 1 else "The implementation workflow and operational principles."
                return (
                    f"### 💡 Technical Questions & Answers Grounded in **'{doc_name}'**\n\n"
                    f"**Q1. What is the primary architecture and problem addressed in this document?**\n\n"
                    f"**Answer:**\n"
                    f"Based on the uploaded document: {pt1}\n\n"
                    f"---\n\n"
                    f"**Q2. How is this concept practically applied or implemented?**\n\n"
                    f"**Answer:**\n"
                    f"According to the text: {pt2}\n\n"
                    f"---\n\n"
                    f"💬 *Ask for specific question breakdowns or topic explanations.*"
                )

        # A4. Interview Questions Generation (Easy, Medium, Hard)
        if any(k in msg for k in ["interview question", "interview questions", "technical question", "technical questions", "generate questions"]):
            return (
                f"### 🎯 Technical Interview Questions from **'{doc_name}'**\n\n"
                f"#### 🟢 Easy (Fundamentals & Definitions)\n"
                f"1. What is the primary concept and purpose explained in this document?\n"
                f"2. Define the key terminology and foundational components introduced in the text.\n\n"
                f"#### 🟡 Medium (Mechanisms & Comparisons)\n"
                f"3. Explain the internal mechanism and step-by-step workflow described in the document.\n"
                f"4. What are the key differences between the approaches or protocols compared in the text?\n\n"
                f"#### 🔴 Hard (System Architecture & Trade-offs)\n"
                f"5. What are the trade-offs, edge cases, or failure scenarios discussed in the document, and how are they resolved?\n\n"
                f"💬 *You can say 'Give me the answers to these questions' or 'Explain question 3' to practice!*"
            )

        # A5. Document Study Roadmap
        if any(k in msg for k in ["roadmap", "study plan", "preparation plan", "learning path"]) and ("document" in msg or "notes" in msg or "this" in msg):
            return (
                f"### 🗺️ Document Preparation Roadmap: **'{doc_name}'**\n\n"
                f"1. **Phase 1: Fundamentals & Terminology**\n"
                f"   - Grasp foundational definitions and core objectives from the document.\n"
                f"   - Target Milestone: Be able to define all key terms in 1-2 concise sentences.\n\n"
                f"2. **Phase 2: Core Mechanisms & Workflows**\n"
                f"   - Deep-dive into internal processes, message exchanges, or algorithm logic.\n"
                f"   - Target Milestone: Sketch the step-by-step flow diagram from memory.\n\n"
                f"3. **Phase 3: Comparative Analysis & Trade-offs**\n"
                f"   - Contrast mechanisms (advantages, memory overhead, latency implications).\n"
                f"   - Target Milestone: Answer *'Why choose X over Y?'* scenarios confidently.\n\n"
                f"4. **Phase 4: High-Yield Interview Questions**\n"
                f"   - Practice answering the Easy, Medium, and Hard interview questions from the text.\n\n"
                f"5. **Phase 5: Final Revision & Mock Simulation**\n"
                f"   - Conduct a 15-minute quick-fire recall session.\n\n"
                f"💬 *Ready to begin? Ask me to explain Phase 1 topics or test you on them!*"
            )

        # A6. Grounding / Hallucination Check for Specific Topic
        keywords_in_query = [w for w in re.findall(r"\b[a-zA-Z]{4,}\b", msg) if w not in [
            "what", "where", "when", "which", "could", "would", "should", "explain", "about",
            "document", "interview", "question", "questions", "answer", "please", "based", "according"
        ]]
        if keywords_in_query:
            matched_keywords = [w for w in keywords_in_query if w in doc_text.lower()]
            if not matched_keywords:
                return (
                    f"I couldn't find that information in the uploaded document. "
                    f"The document does not appear to discuss this topic."
                )
            else:
                sentences = [s.strip() for s in re.split(r"[.\n]", doc_text) if any(m in s.lower() for m in matched_keywords)]
                excerpt = ". ".join(sentences[:3]) if sentences else "The document discusses this topic directly."
                return (
                    f"### 📖 Grounded Explanation from **'{doc_name}'**\n\n"
                    f"According to the document:\n\n"
                    f"> \"{excerpt}\"\n\n"
                    f"**Interview Context:** Be prepared to articulate this definition and its practical trade-offs during technical rounds."
                )

    # ──────────────────────────────────────────────────────────────
    # B. Standard Phase A Handlers (Resume & General Preparation)
    # ──────────────────────────────────────────────────────────────

    # If user has no resume and asks for personalized guidance
    personal_keywords = ["suit", "my resume", "my skills", "my project", "my weak", "mock interview", "take my", "for me"]
    if not resume_data and any(k in msg for k in personal_keywords):
        return (
            "I need your resume information to give you personalized interview guidance. "
            "Please upload and parse your resume in the **Resume Analysis** section first.\n\n"
            "Once uploaded, I'll be able to recommend specific roles, formulate project-based questions, "
            "highlight your strongest technical skills, and simulate custom mock interviews!"
        )

    skills = resume_data.get("skills", []) if resume_data else []
    tech_skills = resume_data.get("technical_skills", []) if resume_data else []
    all_skills = list(set(skills + tech_skills))
    projects = resume_data.get("projects", []) if resume_data else []
    role = target_role or (infer_recommended_roles(resume_data)[0]["role"] if resume_data else "Software Developer")

    # 1. Role Recommendation
    if any(k in msg for k in ["role", "suit", "which role", "target role", "what role", "internship role"]):
        recs = infer_recommended_roles(resume_data)
        lines = [
            f"Based on your resume, here are the strongest role matches for you, **{user_name}**:\n",
        ]
        for i, rec in enumerate(recs, 1):
            lines.append(f"### {i}. {rec['role']} (Match: ~{rec['match_score']}%)")
            lines.append(f"- **Why it fits:** {rec['reason']}")
            if rec.get("core_topics"):
                lines.append(f"- **Key topics to revise:** {', '.join(rec['core_topics'][:4])}\n")

        lines.append(f"💡 **Recommended Next Step:** Target **{recs[0]['role']}** first. Would you like a 2-week preparation roadmap or role-specific technical questions?")
        return "\n".join(lines)

    # 2. Strongest Skills
    if any(k in msg for k in ["strongest", "skills", "skill set", "my strengths"]):
        if all_skills:
            top_skills = all_skills[:6]
            return (
                f"### ⚡ Your Strongest Technical Skills (From Resume)\n\n"
                f"Based on your parsed resume, your prominent technical proficiencies include:\n"
                + "\n".join([f"- **{s}**" for s in top_skills])
                + f"\n\n**How to showcase these in an interview:**\n"
                f"1. **Anchor them to projects:** When discussing `{top_skills[0]}`, immediately cite a problem you solved using it.\n"
                f"2. **Explain trade-offs:** Mention why you chose these technologies over alternatives.\n"
                f"3. **Demonstrate depth:** Be ready for fundamental questions like memory management, execution lifecycle, or query indexing."
            )

    # 3. Project Questions
    if any(k in msg for k in ["project", "projects"]):
        if projects:
            proj_name = projects[0].get("title") if isinstance(projects[0], dict) else str(projects[0])
            return (
                f"### 💻 Interview Questions on Your Resume Projects\n\n"
                f"Interviewers will probe deeply into your listed work, especially **{proj_name}**:\n\n"
                f"1. **Architecture & Scope:** *\"Can you walk me through the end-to-end architecture of {proj_name}? Why did you choose this tech stack?\"*\n"
                f"2. **Challenges & Bug Resolution:** *\"What was the most difficult technical hurdle or bug you encountered during this project, and how did you resolve it?\"*\n"
                f"3. **Data & Scaling:** *\"How does your implementation handle edge cases, data validation, or increased load?\"*\n"
                f"4. **Retrospective:** *\"If you were to rebuild this project from scratch today, what would you architect differently?\"*\n\n"
                f"📌 **Preparation Tip:** Structure your answers using **Problem → Approach → Technology → Challenge → Solution → Result**."
            )

    # 4. Roadmap
    if any(k in msg for k in ["roadmap", "preparation plan", "study plan", "how should i prepare", "days", "week"]):
        roadmap = build_structured_roadmap(role, msg, resume_data)
        lines = [
            f"### 📅 {roadmap['duration']} Interview Preparation Roadmap for **{role}**\n",
        ]
        for m in roadmap["milestones"]:
            lines.append(f"#### 🎯 {m['period']}: {m['title']}")
            for f in m["focus"]:
                lines.append(f"- {f}")
            lines.append("")
        lines.append("Would you like me to start a mock interview or drill down into one of these milestones?")
        return "\n".join(lines)

    # 5. Mock Interview / Take Interview
    if any(k in msg for k in ["take my interview", "mock interview", "start interview", "interview me"]):
        first_proj = projects[0].get("title") if projects and isinstance(projects[0], dict) else "one of your key projects"
        return (
            f"### 🎙️ Mock Interview Session Started: **{role}**\n\n"
            f"Welcome, {user_name}! We will simulate a real interview round. I'll ask you questions **one by one**, and evaluate your answers with constructive feedback and scoring.\n\n"
            f"---\n"
            f"**Question 1 (Warm-up & Introduction):**\n\n"
            f"> *\"Tell me about yourself, your technical background, and a brief overview of {first_proj}.\"*\n\n"
            f"---\n"
            f"💬 *Type your answer below, and I will provide feedback and follow up with Question 2!*"
        )

    # 6. HR Questions
    if any(k in msg for k in ["hr", "behavioral", "why should we hire", "weakness"]):
        return (
            "### 🤝 Essential HR Interview Questions & STAR Guidance\n\n"
            "Here are the top HR questions with proven answering strategies:\n\n"
            "1. **Tell me about yourself:**\n"
            "   - *Formula:* Present role/studies → Key technical accomplishments → Why you are excited about this opportunity.\n\n"
            "2. **Why should we hire you?**\n"
            "   - *Formula:* Match your concrete skills (from your resume) directly to the company's job requirements.\n\n"
            "3. **What is your greatest weakness?**\n"
            "   - *Formula:* Pick a genuine professional skill you are actively improving (e.g., public speaking, deep system design) and show concrete action steps you are taking.\n\n"
            "4. **Tell me about a time you faced a tough challenge (STAR method):**\n"
            "   - **S (Situation):** Context of the problem.\n"
            "   - **T (Task):** Your responsibility.\n"
            "   - **A (Action):** Exact technical steps YOU took.\n"
            "   - **R (Result):** Quantifiable outcome or lesson learned."
        )

    # Default technical guidance for target role
    return (
        f"### 🎯 Interview Preparation Guidance for **{role}**\n\n"
        f"To excel in an interview for **{role}**, here is your recommended focus:\n\n"
        f"1. **Core Technical Depth:** Master the fundamentals of your stack ({', '.join(all_skills[:4]) if all_skills else 'Python, SQL, and OOP'}).\n"
        f"2. **Project Narrative:** Be ready to talk about challenges, database schema decisions, and API structures in your projects.\n"
        f"3. **Problem Solving:** Practice coding patterns (arrays, strings, hash maps, binary search).\n"
        f"4. **Behavioral Alignment:** Prepare 3 solid STAR stories demonstrating resilience, teamwork, and quick learning.\n\n"
        f"How would you like to proceed? You can ask me to **'Take a mock interview'**, **'Give me technical questions'**, or **'Create a 2-week roadmap'**."
    )


# ──────────────────────────────────────────────────────────────────
# 7. Main Service Entry Point
# ──────────────────────────────────────────────────────────────────

def process_interview_chat(
    user_id: int,
    user_name: str,
    user_message: str,
    target_role: Optional[str],
    conversation_history: Optional[List[Dict[str, str]]],
    db: Session,
) -> Dict[str, Any]:
    """
    Main orchestrator for the Interview Preparation Agent (Phase A + B).
    Seamlessly integrates authenticated user's resume context and active document context.
    """
    # 1. Retrieve current user's resume and profile securely
    resume_data, profile_data = get_user_resume_context(user_id, db)
    has_resume = resume_data is not None

    # 2. Retrieve active document context for this user securely
    active_doc, doc_chunks, doc_context_formatted = retrieve_document_context(
        user_id=user_id,
        user_message=user_message,
        db=db,
    )
    has_document = active_doc is not None
    doc_filename = active_doc.filename if active_doc else None
    doc_full_text = active_doc.extracted_text if active_doc else None

    # 3. Determine or infer target role
    resolved_role = target_role
    if not resolved_role and has_resume:
        recs = infer_recommended_roles(resume_data)
        if recs:
            resolved_role = recs[0]["role"]

    history = conversation_history or []

    # 4. Check for structured roadmap requests to attach roadmap_data
    roadmap_data: Optional[Dict[str, Any]] = None
    msg_lower = user_message.lower()
    if any(k in msg_lower for k in ["roadmap", "preparation plan", "study plan", "week plan"]):
        roadmap_data = build_structured_roadmap(resolved_role or "Software Developer", user_message, resume_data)

    # 5. Assemble system prompt with resume + document context
    system_prompt = _build_system_prompt(
        user_name=user_name,
        resume_data=resume_data,
        profile_data=profile_data,
        target_role=resolved_role,
        document_context=doc_context_formatted,
        document_filename=doc_filename,
    )

    doc_meta = {
        "id": active_doc.id,
        "filename": active_doc.filename,
        "file_type": active_doc.file_type,
        "chunk_count": active_doc.chunk_count,
    } if active_doc else None

    # 6. Attempt LLM generation
    llm_answer = _call_groq_llm(
        system_prompt=system_prompt,
        conversation_history=history,
        user_message=user_message,
    )

    if llm_answer:
        return {
            "answer": llm_answer,
            "target_role": resolved_role,
            "has_resume": has_resume,
            "has_document": has_document,
            "active_document": doc_meta,
            "generation_method": "llm",
            "roadmap_data": roadmap_data,
        }

    # 7. Fallback generation if LLM is unavailable
    fallback_answer = _generate_fallback_response(
        user_message=user_message,
        user_name=user_name,
        resume_data=resume_data,
        target_role=resolved_role,
        conversation_history=history,
        document_context=doc_context_formatted,
        document_filename=doc_filename,
        document_full_text=doc_full_text,
        document_chunks=doc_chunks,
    )

    return {
        "answer": fallback_answer,
        "target_role": resolved_role,
        "has_resume": has_resume,
        "has_document": has_document,
        "active_document": doc_meta,
        "generation_method": "fallback",
        "roadmap_data": roadmap_data,
    }


def get_agent_context(
    user_id: int,
    user_name: str,
    db: Session,
) -> Dict[str, Any]:
    """
    Get high-level summary of candidate's interview readiness, recommended roles,
    and active uploaded document (Phase A + B).
    """
    resume_data, profile_data = get_user_resume_context(user_id, db)
    active_doc = get_active_document(user_id, db)

    active_doc_data = {
        "id": active_doc.id,
        "filename": active_doc.filename,
        "file_type": active_doc.file_type,
        "chunk_count": active_doc.chunk_count,
        "uploaded_at": active_doc.uploaded_at.isoformat() if active_doc.uploaded_at else None,
        "is_active": active_doc.is_active,
    } if active_doc else None

    if not resume_data:
        return {
            "has_resume": False,
            "candidate_name": user_name,
            "skills_count": 0,
            "skills": [],
            "projects_count": 0,
            "projects": [],
            "recommended_roles": ["Software Developer", "Data Analyst"],
            "target_role": None,
            "has_document": active_doc is not None,
            "active_document": active_doc_data,
        }

    skills = resume_data.get("skills", [])
    tech_skills = resume_data.get("technical_skills", [])
    all_skills = list(set(skills + tech_skills))

    projects = []
    for p in resume_data.get("projects", []):
        if isinstance(p, dict):
            projects.append(p.get("title", "Project"))
        else:
            projects.append(str(p))

    recs = infer_recommended_roles(resume_data)
    recommended_roles = [r["role"] for r in recs]

    return {
        "has_resume": True,
        "candidate_name": resume_data.get("full_name") or user_name,
        "skills_count": len(all_skills),
        "skills": all_skills[:15],
        "projects_count": len(projects),
        "projects": projects[:5],
        "recommended_roles": recommended_roles,
        "target_role": recommended_roles[0] if recommended_roles else None,
        "has_document": active_doc is not None,
        "active_document": active_doc_data,
    }

