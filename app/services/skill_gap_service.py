"""
Skill Gap Analysis Service.

Uses Groq LLM to:
  1. Identify skill gaps between candidate's current skills and target role.
  2. Generate a step-by-step learning roadmap.
  3. Recommend curated online courses and project ideas.
"""

import os
import json
from typing import Any

from groq import Groq

_groq_client: Groq | None = None

def _get_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


MODEL_PRIMARY = "llama-3.3-70b-versatile"
MODEL_FALLBACK = "llama3-8b-8192"


def _call_groq(system: str, user: str, max_tokens: int = 1800) -> str:
    client = _get_client()
    for model in [MODEL_PRIMARY, MODEL_FALLBACK]:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=max_tokens,
                temperature=0.4,
            )
            return resp.choices[0].message.content or ""
        except Exception as e:
            print(f"[skill_gap] {model} failed: {e}")
            continue
    return ""


# ──────────────────────────────────────────────────────────────────
# Main Skill Gap Analyzer
# ──────────────────────────────────────────────────────────────────

def analyze_skill_gap(
    resume_data: dict[str, Any],
    target_role: str,
) -> dict[str, Any]:
    """
    Analyze the skill gap between the candidate's profile and a target role.

    Args:
        resume_data: Parsed resume dict.
        target_role: Desired job role (e.g., "ML Engineer", "Data Analyst").

    Returns:
        dict with keys: target_role, current_skills, required_skills,
        matched_skills, missing_skills, roadmap, courses, project_ideas,
        overall_readiness_pct
    """
    all_skills = list(dict.fromkeys(
        resume_data.get("skills", []) +
        resume_data.get("technical_skills", []) +
        resume_data.get("soft_skills", [])
    ))
    education = resume_data.get("education", [])
    projects = resume_data.get("projects", [])
    experience = resume_data.get("work_experience", [])
    summary = resume_data.get("professional_summary", "")

    system_prompt = (
        "You are a senior career coach and technical hiring expert. "
        "Respond ONLY with a valid JSON object — no markdown, no code fences, no extra commentary."
    )

    user_prompt = f"""
Analyze the skill gap for this candidate applying for the role: "{target_role}".

CANDIDATE PROFILE:
- Skills: {json.dumps(all_skills)}
- Education: {json.dumps(education)}
- Projects: {json.dumps(projects[:5])}
- Work Experience: {json.dumps(experience[:5])}
- Summary: {summary[:400]}

Return a JSON object with exactly these keys:
{{
  "required_skills": ["list of 10-15 skills required for {target_role}"],
  "matched_skills": ["skills the candidate already has that match"],
  "missing_skills": ["critical skills the candidate lacks"],
  "overall_readiness_pct": <integer 0-100>,
  "roadmap": [
    {{"step": 1, "title": "...", "description": "...", "duration_weeks": <int>, "priority": "high|medium|low"}}
  ],
  "courses": [
    {{"title": "...", "platform": "Coursera|Udemy|YouTube|edX|freeCodeCamp", "url": "...", "estimated_hours": <int>}}
  ],
  "project_ideas": [
    {{"title": "...", "description": "...", "tech_stack": ["..."]}}
  ],
  "readiness_label": "Beginner|Intermediate|Advanced|Job-Ready"
}}

Provide 5-7 roadmap steps, 4-6 courses, and 3-4 project ideas. Be specific and actionable.
"""

    raw = _call_groq(system_prompt, user_prompt, max_tokens=2200)

    # ── Parse JSON response ───────────────────────────────────────
    try:
        # Strip any accidental markdown fences
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        result = json.loads(clean)
    except Exception:
        # Fallback: return minimal structure
        result = {
            "required_skills": [],
            "matched_skills": all_skills[:10],
            "missing_skills": [],
            "overall_readiness_pct": 30,
            "roadmap": [],
            "courses": [],
            "project_ideas": [],
            "readiness_label": "Beginner",
        }

    result["target_role"] = target_role
    result["current_skills"] = all_skills

    return result


# ──────────────────────────────────────────────────────────────────
# Resume Tailoring
# ──────────────────────────────────────────────────────────────────

def tailor_resume(
    resume_data: dict[str, Any],
    job_description: str,
    target_role: str = "",
) -> dict[str, Any]:
    """
    Tailor a resume to a specific job description using LLM.

    Returns:
        dict with tailored_summary, suggested_skills, bullet_improvements, cover_points
    """
    skills = resume_data.get("skills", []) + resume_data.get("technical_skills", [])
    summary = resume_data.get("professional_summary", "")
    experience = resume_data.get("work_experience", [])
    projects = resume_data.get("projects", [])

    system_prompt = (
        "You are a professional resume coach. "
        "Respond ONLY with valid JSON — no markdown fences."
    )

    user_prompt = f"""
Tailor this resume to the job description below.

JOB DESCRIPTION:
{job_description[:1500]}

TARGET ROLE: {target_role}

CURRENT RESUME DATA:
- Summary: {summary[:400]}
- Skills: {json.dumps(skills[:20])}
- Experience: {json.dumps(experience[:4])}
- Projects: {json.dumps(projects[:4])}

Return JSON:
{{
  "tailored_summary": "rewritten professional summary (3-4 sentences) tailored to the JD",
  "suggested_skills": ["5-8 skills from JD not in resume to add"],
  "bullet_improvements": [
    {{"original": "...", "improved": "..."}}
  ],
  "cover_points": ["3-5 key points to emphasize in cover letter"],
  "keyword_density_tips": ["2-3 specific keyword insertion tips"]
}}
"""

    raw = _call_groq(system_prompt, user_prompt, max_tokens=1500)

    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        result = json.loads(clean)
    except Exception:
        result = {
            "tailored_summary": summary,
            "suggested_skills": [],
            "bullet_improvements": [],
            "cover_points": [],
            "keyword_density_tips": [],
        }

    return result
