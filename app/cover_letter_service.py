"""Grounded cover-letter generation using the configured Groq client."""

import json
import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv


load_dotenv()

MODEL_NAME = "openai/gpt-oss-120b"


def generate_cover_letter(
    resume_data: Dict[str, Any],
    internship_data: Dict[str, Any]
) -> Dict[str, str]:
    """Generate a cover letter, falling back to a deterministic grounded letter."""
    letter = _generate_with_llm(resume_data, internship_data)

    if letter:
        return {
            "cover_letter": letter,
            "generation_method": "llm"
        }

    return {
        "cover_letter": _generate_fallback_cover_letter(
            resume_data,
            internship_data
        ),
        "generation_method": "fallback"
    }


def _generate_with_llm(
    resume_data: Dict[str, Any],
    internship_data: Dict[str, Any]
) -> Optional[str]:
    """Return an LLM-generated letter, or None when generation is unavailable."""
    try:
        from groq import Groq
    except ImportError:
        return None

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You write concise, professional internship cover letters. "
                        "Follow the grounding rules in the user message exactly."
                    )
                },
                {
                    "role": "user",
                    "content": _build_cover_letter_prompt(
                        resume_data,
                        internship_data
                    )
                }
            ],
            temperature=0.3,
            max_tokens=450
        )

        content = response.choices[0].message.content
        if not content or not content.strip():
            return None

        return _clean_cover_letter(content)
    except Exception as error:
        print(f"Groq cover-letter generation failed: {error}")
        return None


def _build_cover_letter_prompt(
    resume_data: Dict[str, Any],
    internship_data: Dict[str, Any]
) -> str:
    """Build a strongly grounded prompt from the selected resume and internship."""
    return f"""
Write a professional, concise, personalized cover letter for the selected internship.

Grounding rules:
- Use only facts present in the supplied resume data and internship data.
- Never invent or imply work experience, internships, projects, achievements, skills,
  education, dates, companies, technologies, or certifications.
- Do not claim experience with a skill unless it appears in the resume data.
- Do not fabricate contact information. If information is missing, omit it.
- Tailor the letter specifically to the selected internship and highlight only genuinely
  relevant skills, projects, education, and experience from the resume.
- Avoid generic exaggerated claims and obvious AI filler.
- Do not mention AI or that this letter was generated.
- Return only the cover letter itself: no analysis, labels, markdown, or code fences.

Resume data:
{json.dumps(resume_data, ensure_ascii=False, indent=2)}

Selected internship data:
{json.dumps(internship_data, ensure_ascii=False, indent=2)}
""".strip()


def _clean_cover_letter(content: str) -> str:
    """Remove accidental Markdown fences while preserving the letter text."""
    letter = content.strip()
    if letter.startswith("```"):
        letter = letter.split("\n", 1)[1] if "\n" in letter else ""
        if letter.endswith("```"):
            letter = letter[:-3]
    return letter.strip() or None


def _generate_fallback_cover_letter(
    resume_data: Dict[str, Any],
    internship_data: Dict[str, Any]
) -> str:
    """Generate a basic letter from explicit resume facts without inference."""
    role = internship_data.get("role_title", "Intern")
    company = internship_data.get("company", "your organization")
    name = resume_data.get("full_name")
    skills = _matching_skills(resume_data, internship_data)

    paragraphs = [
        "Dear Hiring Team,",
        f"I am writing to apply for the {role} position at {company}."
    ]

    if skills:
        paragraphs.append(
            "My resume lists experience with " + ", ".join(skills) + ", "
            "which are relevant to the skills requested for this internship."
        )

    project = _first_item(resume_data.get("projects", []))
    if project:
        paragraphs.append(f"My resume also highlights the following project: {project}")

    education = _first_item(resume_data.get("education", []))
    if education:
        paragraphs.append(f"My education includes: {education}")

    summary = resume_data.get("professional_summary")
    if summary:
        paragraphs.append(str(summary))

    paragraphs.append(
        "Thank you for considering my application. I would welcome the opportunity "
        "to discuss my application further."
    )
    paragraphs.append(f"Sincerely,\n{name}" if name else "Sincerely,")

    return "\n\n".join(paragraphs)


def _matching_skills(
    resume_data: Dict[str, Any],
    internship_data: Dict[str, Any]
) -> list[str]:
    resume_skills = resume_data.get("skills", [])
    resume_by_lower = {
        str(skill).lower(): str(skill)
        for skill in resume_skills
        if skill
    }
    requested_skills = (
        internship_data.get("required_skills", []) +
        internship_data.get("preferred_skills", [])
    )
    return [
        resume_by_lower[str(skill).lower()]
        for skill in requested_skills
        if str(skill).lower() in resume_by_lower
    ]


def _first_item(items: Any) -> Optional[str]:
    if not isinstance(items, list) or not items:
        return None
    item = items[0]
    if isinstance(item, dict):
        return "; ".join(str(value) for value in item.values() if value)
    return str(item) if item else None
