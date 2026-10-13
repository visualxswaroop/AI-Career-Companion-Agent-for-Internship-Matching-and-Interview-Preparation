"""
NLP Workbench Service — TF-IDF + Cosine Similarity ATS Scorer.

Provides:
  - ATS compatibility scoring between resume text and job description
  - Keyword extraction and match analysis
  - Section-level feedback for resume optimization
"""

import re
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ──────────────────────────────────────────────────────────────────
# Text Preprocessing
# ──────────────────────────────────────────────────────────────────

def _clean(text: str) -> str:
    """Normalize text for TF-IDF comparison."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_keywords(text: str, top_n: int = 30) -> list[str]:
    """Extract top N TF-IDF keywords from a document."""
    if not text.strip():
        return []
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=200,
        )
        tfidf_matrix = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]
        ranked = sorted(
            zip(feature_names, scores),
            key=lambda x: x[1],
            reverse=True,
        )
        return [term for term, score in ranked[:top_n] if score > 0]
    except Exception:
        return []


# ──────────────────────────────────────────────────────────────────
# ATS Scorer
# ──────────────────────────────────────────────────────────────────

def score_resume_ats(
    resume_data: dict[str, Any],
    job_description: str,
) -> dict[str, Any]:
    """
    Score a parsed resume against a job description using TF-IDF + cosine similarity.

    Args:
        resume_data: Parsed resume dictionary (from parse_resume).
        job_description: Raw job description text.

    Returns:
        dict with keys: ats_score, matched_keywords, missing_keywords,
        keyword_coverage, section_feedback, recommendation
    """
    # Build resume text corpus
    def _join(lst: list) -> str:
        return " ".join(str(i) for i in lst if i)

    resume_sections = {
        "skills": _join(resume_data.get("skills", [])),
        "technical_skills": _join(resume_data.get("technical_skills", [])),
        "soft_skills": _join(resume_data.get("soft_skills", [])),
        "work_experience": _join(resume_data.get("work_experience", [])),
        "education": _join(resume_data.get("education", [])),
        "projects": _join(resume_data.get("projects", [])),
        "certifications": _join(resume_data.get("certifications", [])),
        "summary": resume_data.get("professional_summary", "") or "",
    }

    full_resume_text = " ".join(resume_sections.values())

    if not full_resume_text.strip() or not job_description.strip():
        return {
            "ats_score": 0,
            "matched_keywords": [],
            "missing_keywords": [],
            "keyword_coverage": 0.0,
            "section_feedback": {},
            "recommendation": "Insufficient data to score. Please provide a valid resume and job description.",
        }

    cleaned_resume = _clean(full_resume_text)
    cleaned_jd = _clean(job_description)

    # ── 1. Overall cosine similarity ──────────────────────────────
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=500,
        )
        matrix = vectorizer.fit_transform([cleaned_resume, cleaned_jd])
        similarity = float(cosine_similarity(matrix[0], matrix[1])[0][0])
    except Exception:
        similarity = 0.0

    # ── 2. Keyword coverage ────────────────────────────────────────
    jd_keywords = set(_extract_keywords(cleaned_jd, top_n=40))
    resume_keywords = set(_extract_keywords(cleaned_resume, top_n=80))

    matched_keywords = sorted(jd_keywords & resume_keywords)
    missing_keywords = sorted(jd_keywords - resume_keywords)
    keyword_coverage = (
        len(matched_keywords) / len(jd_keywords) if jd_keywords else 0.0
    )

    # ── 3. Section-level feedback ──────────────────────────────────
    section_feedback: dict[str, dict[str, Any]] = {}
    for section_name, section_text in resume_sections.items():
        if not section_text.strip():
            section_feedback[section_name] = {
                "score": 0,
                "present": False,
                "feedback": f"Section '{section_name}' is empty or missing.",
            }
            continue

        try:
            sec_matrix = vectorizer.transform([_clean(section_text)])
            jd_vec = vectorizer.transform([cleaned_jd])
            sec_score = float(cosine_similarity(sec_matrix, jd_vec)[0][0])
        except Exception:
            sec_score = 0.0

        section_feedback[section_name] = {
            "score": round(sec_score * 100, 1),
            "present": True,
            "feedback": _section_advice(section_name, sec_score),
        }

    # ── 4. Composite ATS score (0–100) ────────────────────────────
    # Weighted: 50% cosine similarity + 35% keyword coverage + 15% section presence
    sections_present = sum(1 for s in section_feedback.values() if s["present"])
    section_ratio = sections_present / max(len(resume_sections), 1)

    raw_score = (similarity * 0.5) + (keyword_coverage * 0.35) + (section_ratio * 0.15)
    ats_score = min(100, round(raw_score * 100))

    # ── 5. Recommendation ─────────────────────────────────────────
    recommendation = _build_recommendation(
        ats_score, missing_keywords[:8], section_feedback
    )

    return {
        "ats_score": ats_score,
        "similarity_score": round(similarity * 100, 1),
        "matched_keywords": matched_keywords[:25],
        "missing_keywords": missing_keywords[:20],
        "keyword_coverage": round(keyword_coverage * 100, 1),
        "section_feedback": section_feedback,
        "recommendation": recommendation,
    }


def _section_advice(section_name: str, score: float) -> str:
    if score >= 0.35:
        return f"Strong alignment in {section_name}."
    elif score >= 0.15:
        return f"Moderate alignment in {section_name}. Consider adding more relevant keywords."
    else:
        return f"Weak alignment in {section_name}. Tailor this section to the job description."


def _build_recommendation(
    ats_score: int,
    missing_keywords: list[str],
    section_feedback: dict,
) -> str:
    lines = []
    if ats_score >= 75:
        lines.append("✅ Strong ATS compatibility. Your resume is well-aligned with the job description.")
    elif ats_score >= 50:
        lines.append("⚠️ Moderate ATS compatibility. Some improvements recommended.")
    else:
        lines.append("❌ Low ATS compatibility. Significant tailoring needed.")

    if missing_keywords:
        kw_str = ", ".join(missing_keywords[:6])
        lines.append(f"Add missing keywords: {kw_str}.")

    weak_sections = [
        name for name, info in section_feedback.items()
        if info.get("present") and info.get("score", 100) < 15
    ]
    if weak_sections:
        lines.append(f"Strengthen sections: {', '.join(weak_sections[:3])}.")

    return " ".join(lines)


# ──────────────────────────────────────────────────────────────────
# Skills Gap Extractor (standalone helper)
# ──────────────────────────────────────────────────────────────────

def extract_skills_from_text(text: str) -> list[str]:
    """Simple skill keyword extractor using TF-IDF."""
    return _extract_keywords(_clean(text), top_n=30)


def compute_skill_overlap(
    candidate_skills: list[str],
    required_skills: list[str],
) -> dict[str, Any]:
    """
    Compute overlap between candidate and required skill sets.

    Returns:
        matched, missing, overlap_pct
    """
    candidate_set = {s.lower().strip() for s in candidate_skills}
    required_set = {s.lower().strip() for s in required_skills}

    matched = sorted(candidate_set & required_set)
    missing = sorted(required_set - candidate_set)
    overlap_pct = (
        round(len(matched) / len(required_set) * 100, 1) if required_set else 0.0
    )

    return {
        "matched": matched,
        "missing": missing,
        "overlap_pct": overlap_pct,
    }
