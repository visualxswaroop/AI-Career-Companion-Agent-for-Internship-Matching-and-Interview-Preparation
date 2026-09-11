"""
AI-Driven Multilingual Voice Resume Architect — Service Layer.

Responsibilities:
1. extract_resume_fields()  — LLM extracts structured ResumeData fields from a free-form
                               spoken transcript, detects missing fields, generates a
                               follow-up question when something is absent.
2. generate_resume_document() — LLM produces an ATS-optimised resume in either a
                                 technical/software or blue-collar layout, auto-detected
                                 from the candidate's profile.

Follows the exact same patterns used in:
  - cover_letter_service.py   (lazy Groq import, GROQ_API_KEY env var, try/except None)
  - interview_agent_service.py (_call_groq_llm(), GROQ_MODEL constant, fallback generator)
"""

import json
import os
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

GROQ_MODEL = "openai/gpt-oss-120b"
EXTRACT_TEMPERATURE = 0.1   # low — we want deterministic JSON extraction
GENERATE_TEMPERATURE = 0.4  # slightly higher for natural-sounding prose
EXTRACT_MAX_TOKENS = 800
GENERATE_MAX_TOKENS = 1400


# ──────────────────────────────────────────────────────────────────
# Required fields that must be present for a "complete" profile.
# Anything not in this list is treated as optional.
# ──────────────────────────────────────────────────────────────────

REQUIRED_FIELDS: List[str] = [
    "full_name",
    "email",
    "phone",
    "skills",
    "education",
]

# Human-readable labels for follow-up questions
FIELD_QUESTIONS: Dict[str, str] = {
    "full_name": "Could you please tell me your full name?",
    "email":     "What is your email address?",
    "phone":     "What phone number should I use to contact you?",
    "skills":    "What are your main skills or areas of expertise?",
    "education": "What is your educational background? For example, your degree or institution.",
    "professional_summary": "Can you describe yourself professionally in a sentence or two?",
    "work_experience":      "Do you have any work experience you'd like to include?",
    "projects":             "Have you worked on any notable projects?",
}


# ──────────────────────────────────────────────────────────────────
# 1. Field extraction via Groq LLM
# ──────────────────────────────────────────────────────────────────

def extract_resume_fields(
    transcript: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    language_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Parse a free-form spoken transcript into structured ResumeData fields.

    Returns a dict matching the shape of VoiceResumeExtractResponse:
      {
        "extracted_data": { ...ResumeData fields... },
        "missing_fields": [...],
        "follow_up_question": str | None,
        "is_complete": bool,
        "detected_language": str,
      }
    Falls back to a deterministic regex/keyword extractor if Groq is unavailable.
    """
    llm_result = _extract_with_llm(transcript, conversation_history, language_hint)
    if llm_result:
        return llm_result

    # Deterministic fallback
    return _extract_fallback(transcript, language_hint)


def _extract_with_llm(
    transcript: str,
    conversation_history: Optional[List[Dict[str, str]]],
    language_hint: Optional[str],
) -> Optional[Dict[str, Any]]:
    """Call Groq to extract resume fields. Returns None if unavailable or on error."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from groq import Groq  # lazy import — matches cover_letter_service.py pattern
        client = Groq(api_key=api_key)

        history_block = ""
        if conversation_history:
            for turn in conversation_history[-10:]:
                role = turn.get("role", "")
                content = turn.get("content", "")
                if role in ("user", "assistant") and content:
                    history_block += f"{role.upper()}: {content}\n"

        lang_note = f" The candidate spoke in {language_hint}." if language_hint else ""

        system_prompt = (
            "You are an expert multilingual resume data extractor and professional resume writer.{lang}\n"
            "Extract structured information from the provided spoken transcript.\n\n"
            "CRITICAL LANGUAGE & TRANSLATION REQUIREMENT:\n"
            "- Regardless of the language spoken (e.g. Telugu, Hindi, Tamil, Spanish, German, etc.), "
            "EVERY extracted text field MUST BE TRANSLATED AND OUTPUT IN FLUENT, PROFESSIONAL STANDARD ENGLISH.\n"
            "- Transliterate non-Latin names to the standard English/Latin alphabet (e.g. 'వెంకటేష్' -> 'Venkatesh').\n"
            "- All summaries, skills, work experiences, education, and projects MUST be in clean English.\n"
            "- Do NOT output regional non-English scripts in the extracted fields.\n\n"
            "GRAMMAR & CONTENT REFINEMENT:\n"
            "- Thoroughly clean up and refine the candidate's spoken input.\n"
            "- Fix all grammatical mistakes, broken sentences, verbal slip-ups, repetitive words, and colloquial slang.\n"
            "- Convert informal spoken descriptions into polished, ATS-optimized professional statements.\n"
            "- Strip conversational filler words ('um', 'uh', 'you know', 'basically', 'like').\n\n"
            "Return ONLY a JSON object with exactly these keys "
            "(use null for fields not mentioned, empty list [] for list fields not mentioned):\n\n"
            '{{\n'
            '  "full_name": string | null,\n'
            '  "email": string | null,\n'
            '  "phone": string | null,\n'
            '  "address": string | null,\n'
            '  "linkedin": string | null,\n'
            '  "github": string | null,\n'
            '  "professional_summary": string | null,\n'
            '  "skills": [string],\n'
            '  "education": [string],\n'
            '  "work_experience": [string],\n'
            '  "projects": [string],\n'
            '  "certifications": [string],\n'
            '  "internships": [string],\n'
            '  "languages": [string],\n'
            '  "achievements": [string],\n'
            '  "technical_skills": [string],\n'
            '  "soft_skills": [string],\n'
            '  "detected_language": string\n'
            '}}\n\n'
            "Rules:\n"
            "- Do NOT invent false experiences or credentials. Only extract what is stated or implied.\n"
            "- `detected_language` must be the name or code of the original language spoken by the user (e.g. 'Telugu', 'Hindi', 'en').\n"
            "- Return raw JSON only — no markdown fences, no commentary."
        ).format(lang=lang_note)

        user_message = ""
        if history_block:
            user_message += f"Previous conversation context:\n{history_block}\n\n"
        user_message += f"New transcript to extract from:\n{transcript}"

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=EXTRACT_TEMPERATURE,
            max_tokens=EXTRACT_MAX_TOKENS,
        )

        raw = completion.choices[0].message.content
        if not raw or not raw.strip():
            return None

        extracted = _parse_json_response(raw)
        if not extracted:
            return None

        detected_language = extracted.pop("detected_language", "en") or "en"
        missing = _compute_missing(extracted)
        follow_up = _pick_follow_up(missing)

        return {
            "extracted_data": _sanitise_extracted(extracted),
            "missing_fields": missing,
            "follow_up_question": follow_up,
            "is_complete": len(missing) == 0,
            "detected_language": detected_language,
        }

    except Exception as err:
        print(f"[voice_resume] Groq extraction failed: {err}")
        return None


# ──────────────────────────────────────────────────────────────────
# 2. Resume document generation via Groq LLM
# ──────────────────────────────────────────────────────────────────

def generate_resume_document(
    extracted_data: Dict[str, Any],
    template_hint: str = "auto",
) -> Dict[str, str]:
    """
    Generate a formatted, ATS-optimised resume from the extracted fields.

    template_hint: "auto" | "technical" | "blue-collar"
    Returns a dict matching VoiceResumeGenerateResponse:
      { "resume_text": str, "template_used": str, "generation_method": str }
    Falls back to a deterministic formatter if Groq is unavailable.
    """
    llm_result = _generate_with_llm(extracted_data, template_hint)
    if llm_result:
        return llm_result

    template = _classify_template(extracted_data, template_hint)
    return {
        "resume_text": _generate_fallback_resume(extracted_data, template),
        "template_used": template,
        "generation_method": "fallback",
    }


def _generate_with_llm(
    extracted_data: Dict[str, Any],
    template_hint: str,
) -> Optional[Dict[str, str]]:
    """Call Groq to generate a formatted resume. Returns None if unavailable or on error."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from groq import Groq  # lazy import
        client = Groq(api_key=api_key)

        auto_class_note = (
            "First, classify the candidate as either 'technical' (software/IT/engineering/science) "
            "or 'blue-collar' (trades, logistics, construction, manufacturing, manual labor, driving, "
            "warehouse, retail, healthcare aide, hospitality) based on their skills and experience. "
            "Then generate the resume in the appropriate format for that category.\n\n"
        ) if template_hint == "auto" else (
            f"Generate the resume using the '{template_hint}' format.\n\n"
        )

        system_prompt = (
            "You are an elite professional executive resume writer producing ATS-optimised resumes.\n\n"
            + auto_class_note +
            "CRITICAL LANGUAGE & OUTPUT REQUIREMENT:\n"
            "- The entire resume MUST BE PRODUCED 100% IN FLAWLESS, PROFESSIONAL STANDARD ENGLISH.\n"
            "- Under NO circumstances should any regional non-English script (such as Telugu, Hindi, Tamil, etc.) appear in the output.\n"
            "- All job titles, summaries, skills, work histories, and degrees must be in clear English.\n\n"
            "CONTENT REFINEMENT & GRAMMAR CORRECTION:\n"
            "- Thoroughly review, refine, and polish all content from the candidate.\n"
            "- Correct all grammatical mistakes, typographical errors, punctuation flaws, and awkward phrasings.\n"
            "- Eliminate identical or repetitive grammatical mistakes and redundant phrases.\n"
            "- Elevate bullet points into high-impact ATS bullet points using strong action verbs "
            "(e.g., 'Engineered', 'Orchestrated', 'Spearheaded', 'Optimized', 'Maintained', 'Delivered', 'Coordinated').\n"
            "- Ensure consistent professional tone and past/present verb tense agreement.\n\n"
            "TECHNICAL FORMAT: Use sections — Contact, Professional Summary, Technical Skills, "
            "Work Experience, Projects, Education, Certifications, Languages, Achievements. "
            "Use action verbs and quantify impact. Mention technologies explicitly.\n\n"
            "BLUE-COLLAR FORMAT: Use sections — Contact, Summary, Core Competencies, "
            "Work History, Equipment & Certifications, Education, Achievements. "
            "Emphasise reliability, physical skills, certifications, and on-the-job accomplishments.\n\n"
            "Rules:\n"
            "- Use only facts present in the supplied candidate data. Never invent false companies or qualifications.\n"
            "- Return ONLY the resume as clean formatted text (no markdown fences, no code blocks).\n"
            "- On the FIRST line write exactly: TEMPLATE:<template_used> "
            "  where <template_used> is either 'technical' or 'blue-collar'.\n"
            "- After that first line, write the resume directly.\n"
            "- Omit any section that has no data for it."
        )

        user_message = (
            "Generate a complete, ATS-optimised resume from the following candidate data.\n\n"
            f"Candidate data:\n{json.dumps(extracted_data, ensure_ascii=False, indent=2)}"
        )

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=GENERATE_TEMPERATURE,
            max_tokens=GENERATE_MAX_TOKENS,
        )

        raw = completion.choices[0].message.content
        if not raw or not raw.strip():
            return None

        raw = raw.strip()
        # Strip any accidental markdown fences
        if raw.startswith("```"):
            raw = re.sub(r"^```[^\n]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw.strip())
            raw = raw.strip()

        # Parse the TEMPLATE: header
        template_used = _classify_template(extracted_data, template_hint)
        first_line = raw.split("\n", 1)[0]
        if first_line.startswith("TEMPLATE:"):
            template_used = first_line.replace("TEMPLATE:", "").strip().lower()
            if template_used not in ("technical", "blue-collar"):
                template_used = _classify_template(extracted_data, template_hint)
            raw = raw.split("\n", 1)[1].strip() if "\n" in raw else raw

        return {
            "resume_text": raw,
            "template_used": template_used,
            "generation_method": "llm",
        }

    except Exception as err:
        print(f"[voice_resume] Groq generation failed: {err}")
        return None


# ──────────────────────────────────────────────────────────────────
# 3. Helpers — parsing, classification, fallbacks
# ──────────────────────────────────────────────────────────────────

def _parse_json_response(raw: str) -> Optional[Dict[str, Any]]:
    """Strip markdown fences and parse JSON. Returns None on failure."""
    text = raw.strip()
    # Remove ```json ... ``` or ``` ... ``` fences
    text = re.sub(r"^```[^\n]*\n?", "", text)
    text = re.sub(r"\n?```$", "", text.strip())
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to locate the first { ... } block
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return None


def _sanitise_extracted(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure list fields are lists and string fields are strings or None."""
    list_fields = [
        "skills", "education", "work_experience", "projects",
        "certifications", "internships", "languages", "achievements",
        "technical_skills", "soft_skills",
    ]
    str_fields = [
        "full_name", "email", "phone", "address",
        "linkedin", "github", "professional_summary",
    ]
    for f in list_fields:
        val = data.get(f)
        if val is None or val == "":
            data[f] = []
        elif not isinstance(val, list):
            data[f] = [str(val)]
        else:
            data[f] = [str(x) for x in val if x]
    for f in str_fields:
        val = data.get(f)
        if val == "" or val == [] :
            data[f] = None
    return data


def _compute_missing(extracted: Dict[str, Any]) -> List[str]:
    """Return required fields that are empty/null in the extracted dict."""
    missing = []
    for field in REQUIRED_FIELDS:
        val = extracted.get(field)
        if val is None or val == "" or val == []:
            missing.append(field)
    return missing


def _pick_follow_up(missing: List[str]) -> Optional[str]:
    """Return a follow-up question for the first missing required field."""
    for field in missing:
        if field in FIELD_QUESTIONS:
            return FIELD_QUESTIONS[field]
    return None


_BLUE_COLLAR_SIGNALS = [
    "driver", "driving", "warehouse", "forklift", "mechanic", "electrician",
    "plumber", "carpenter", "welder", "construction", "hvac", "labour", "labor",
    "retail", "cashier", "delivery", "logistics", "chef", "cook", "hospitality",
    "cleaning", "security", "maintenance", "technician", "helper", "operator",
    "nursing aide", "care worker", "factory",
]


def _classify_template(extracted: Dict[str, Any], hint: str) -> str:
    """Classify the resume as 'technical' or 'blue-collar'."""
    if hint in ("technical", "blue-collar"):
        return hint

    all_text = " ".join([
        " ".join(extracted.get("skills", [])),
        " ".join(extracted.get("technical_skills", [])),
        " ".join(extracted.get("work_experience", [])),
        extracted.get("professional_summary", "") or "",
    ]).lower()

    for signal in _BLUE_COLLAR_SIGNALS:
        if signal in all_text:
            return "blue-collar"
    return "technical"


# ──────────────────────────────────────────────────────────────────
# 4. Deterministic fallback extractors (Groq-free path)
# ──────────────────────────────────────────────────────────────────

def _extract_fallback(transcript: str, language_hint: Optional[str]) -> Dict[str, Any]:
    """Minimal regex/keyword extraction when Groq is unavailable."""
    import re as _re

    extracted: Dict[str, Any] = {
        "full_name": None, "email": None, "phone": None, "address": None,
        "linkedin": None, "github": None, "professional_summary": None,
        "skills": [], "education": [], "work_experience": [], "projects": [],
        "certifications": [], "internships": [], "languages": [], "achievements": [],
        "technical_skills": [], "soft_skills": [],
    }

    # Email
    em = _re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", transcript)
    if em:
        extracted["email"] = em.group(0)

    # Phone
    ph = _re.search(r"(\+?\d[\d\s\-]{8,14}\d)", transcript)
    if ph:
        extracted["phone"] = ph.group(0).strip()

    # Simple skill keyword matching
    from app.resume_parser import TECHNICAL_SKILLS, SOFT_SKILLS, extract_skills
    extracted["technical_skills"] = extract_skills(transcript, TECHNICAL_SKILLS)
    extracted["soft_skills"] = extract_skills(transcript, SOFT_SKILLS)
    extracted["skills"] = list(dict.fromkeys(
        extracted["technical_skills"] + extracted["soft_skills"]
    ))

    missing = _compute_missing(extracted)
    follow_up = _pick_follow_up(missing)

    return {
        "extracted_data": extracted,
        "missing_fields": missing,
        "follow_up_question": follow_up,
        "is_complete": len(missing) == 0,
        "detected_language": language_hint or "en",
    }


def _generate_fallback_resume(extracted: Dict[str, Any], template: str) -> str:
    """Build a plain-text ATS resume from extracted fields without LLM."""
    lines: List[str] = []

    name = extracted.get("full_name") or "Candidate"
    email = extracted.get("email") or ""
    phone = extracted.get("phone") or ""
    linkedin = extracted.get("linkedin") or ""
    github = extracted.get("github") or ""

    # ── Header ──────────────────────────────────────────────────
    lines.append(name.upper())
    contact_parts = [x for x in [email, phone, linkedin, github] if x]
    if contact_parts:
        lines.append(" | ".join(contact_parts))
    lines.append("")

    summary = extracted.get("professional_summary")
    if summary:
        lines += ["SUMMARY", "-" * 40, summary, ""]

    if template == "blue-collar":
        # ── Blue-Collar Layout ───────────────────────────────────
        skills = extracted.get("skills", [])
        if skills:
            lines += ["CORE COMPETENCIES", "-" * 40]
            lines.append(", ".join(skills))
            lines.append("")

        work = extracted.get("work_experience", [])
        if work:
            lines += ["WORK HISTORY", "-" * 40]
            for w in work:
                lines.append(f"- {w}")
            lines.append("")

        certs = extracted.get("certifications", [])
        if certs:
            lines += ["EQUIPMENT & CERTIFICATIONS", "-" * 40]
            for c in certs:
                lines.append(f"- {c}")
            lines.append("")

        edu = extracted.get("education", [])
        if edu:
            lines += ["EDUCATION", "-" * 40]
            for e in edu:
                lines.append(f"- {e}")
            lines.append("")

    else:
        # ── Technical Layout ────────────────────────────────────
        tech_skills = extracted.get("technical_skills", []) or extracted.get("skills", [])
        if tech_skills:
            lines += ["TECHNICAL SKILLS", "-" * 40]
            lines.append(", ".join(tech_skills))
            lines.append("")

        work = extracted.get("work_experience", [])
        if work:
            lines += ["WORK EXPERIENCE", "-" * 40]
            for w in work:
                lines.append(f"- {w}")
            lines.append("")

        projects = extracted.get("projects", [])
        if projects:
            lines += ["PROJECTS", "-" * 40]
            for p in projects:
                lines.append(f"- {p}")
            lines.append("")

        edu = extracted.get("education", [])
        if edu:
            lines += ["EDUCATION", "-" * 40]
            for e in edu:
                lines.append(f"- {e}")
            lines.append("")

        certs = extracted.get("certifications", [])
        if certs:
            lines += ["CERTIFICATIONS", "-" * 40]
            for c in certs:
                lines.append(f"- {c}")
            lines.append("")

    achievements = extracted.get("achievements", [])
    if achievements:
        lines += ["ACHIEVEMENTS", "-" * 40]
        for a in achievements:
            lines.append(f"- {a}")
        lines.append("")

    return "\n".join(lines).strip()
