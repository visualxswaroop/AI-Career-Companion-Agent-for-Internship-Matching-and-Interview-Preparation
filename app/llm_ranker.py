"""
LLM-based grounded recommendation analyzer.

Uses semantic search results + skill analysis to generate
grounded recommendations with explanations.
"""

import os
import json
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()


def generate_grounded_explanation(
    candidate_data: Dict[str, Any],
    internship_result: Dict[str, Any],
    use_llm: bool = True
) -> Dict[str, Any]:
    """
    Generate a grounded explanation for why an internship matches a candidate.
    
    Args:
        candidate_data: Parsed candidate resume data
        internship_result: Result from second-stage ranking (includes skill_analysis)
        use_llm: Whether to attempt LLM generation (fallback to heuristic if unavailable)
    
    Returns:
        Dict with match explanation and reasoning
    """
    internship = internship_result["internship"]
    skill_analysis = internship_result.get("skill_analysis", {})
    similarity_score = internship_result["similarity_score"]
    adjusted_score = internship_result.get("adjusted_similarity_score", similarity_score)
    
    # Build structured explanation
    explanation = {
        "match_rating": _rate_match(adjusted_score),
        "key_strengths": _extract_strengths(candidate_data, internship, skill_analysis),
        "potential_gaps": _extract_gaps(candidate_data, internship, skill_analysis),
        "domain_fit": _evaluate_domain_fit(candidate_data, internship),
        "internship_highlights": {
            "role": internship.get("role_title"),
            "company": internship.get("company"),
            "domain": internship.get("domain"),
            "stipend": f"₹{internship.get('stipend_inr_per_month', 0):,}/month",
            "duration": f"{internship.get('duration_weeks', 0)} weeks",
            "mode": internship.get("mode")
        },
        "recommendation_summary": ""
    }
    
    # Attempt LLM generation if enabled and credentials available
    if use_llm:
        llm_text = _generate_with_llm(candidate_data, internship, explanation)
        if llm_text:
            explanation["recommendation_summary"] = llm_text
            explanation["explanation_method"] = "llm"
            return explanation
    
    # Fallback to heuristic explanation
    explanation["recommendation_summary"] = _generate_heuristic_explanation(
        candidate_data, internship, explanation
    )
    explanation["explanation_method"] = "heuristic"
    
    return explanation


def _rate_match(adjusted_score: float) -> str:
    """Rate the match quality."""
    if adjusted_score >= 0.75:
        return "Excellent Match"
    elif adjusted_score >= 0.60:
        return "Good Match"
    elif adjusted_score >= 0.45:
        return "Moderate Match"
    else:
        return "Fair Match"


def _extract_strengths(
    candidate_data: Dict[str, Any],
    internship: Dict[str, Any],
    skill_analysis: Dict[str, Any]
) -> List[str]:
    """Extract why this is a good match."""
    strengths = []
    
    required_matched = skill_analysis.get("required_skills_matched", 0)
    required_total = skill_analysis.get("required_skills_total", 0)
    
    if required_total > 0 and required_matched > 0:
        strength_pct = int((required_matched / required_total) * 100)
        strengths.append(
            f"Strong skill alignment: {required_matched}/{required_total} "
            f"required skills ({strength_pct}%)"
        )
    
    preferred_matched = skill_analysis.get("preferred_skills_matched", 0)
    if preferred_matched > 0:
        strengths.append(
            f"Bonus: {preferred_matched} preferred skills already present"
        )
    
    # Domain relevance
    candidate_skills = set(s.lower() for s in candidate_data.get("skills", []))
    domain = internship.get("domain", "").lower()
    
    if any(keyword in candidate_skills for keyword in ["machine learning", "python", "data", "ai"]):
        if "ai" in domain or "ml" in domain or "data" in domain:
            strengths.append("Relevant AI/ML experience for this domain")
    
    if any(keyword in candidate_skills for keyword in ["aws", "azure", "gcp", "docker", "kubernetes"]):
        if "cloud" in domain or "devops" in domain:
            strengths.append("Cloud/DevOps experience aligns with role requirements")
    
    return strengths if strengths else ["Semantic match detected for this role"]


def _extract_gaps(
    candidate_data: Dict[str, Any],
    internship: Dict[str, Any],
    skill_analysis: Dict[str, Any]
) -> List[str]:
    """Extract areas where candidate might need support."""
    gaps = []
    
    skill_gap = skill_analysis.get("skill_gap", [])
    if skill_gap:
        gaps.append(f"Consider learning: {', '.join(skill_gap[:3])}")
    
    required_coverage = skill_analysis.get("required_coverage_percent", 0)
    if required_coverage < 50:
        gaps.append("Missing several required skills - may require onboarding")
    
    min_education = internship.get("min_education", "").lower()
    candidate_education = candidate_data.get("education", [])
    
    if "m.tech" in min_education or "m.e." in min_education:
        if not any("master" in str(edu).lower() for edu in candidate_education):
            gaps.append("Position prefers Master's degree - B.Tech candidates welcome but at advantage for M.Tech")
    
    return gaps if gaps else ["No major gaps identified"]


def _evaluate_domain_fit(
    candidate_data: Dict[str, Any],
    internship: Dict[str, Any]
) -> str:
    """Evaluate domain fit."""
    domain = internship.get("domain", "").lower()
    candidate_skills = set(s.lower() for s in candidate_data.get("skills", []))
    
    domain_keywords = {
        "software development": ["python", "java", "c++", "rest api", "fastapi", "django"],
        "devops": ["docker", "kubernetes", "aws", "azure", "ci/cd", "linux"],
        "data science": ["python", "machine learning", "sql", "pandas", "scikit-learn"],
        "cybersecurity": ["linux", "networking", "python", "sql", "security"],
        "business analysis": ["sql", "excel", "power bi", "jira", "communication"],
        "cloud": ["aws", "azure", "gcp", "docker", "terraform"],
        "ai/ml": ["python", "machine learning", "deep learning", "tensorflow", "pytorch"],
    }
    
    for domain_name, keywords in domain_keywords.items():
        if domain_name in domain:
            match_count = sum(1 for kw in keywords if kw in candidate_skills)
            if match_count >= len(keywords) // 2:
                return f"Strong - Relevant skills in {domain_name}"
            elif match_count > 0:
                return f"Moderate - Some {domain_name} experience"
    
    return f"Good - Internship in {domain}"


def _generate_heuristic_explanation(
    candidate_data: Dict[str, Any],
    internship: Dict[str, Any],
    explanation: Dict[str, Any]
) -> str:
    """Generate explanation using heuristics (no LLM)."""
    strengths = explanation.get("key_strengths", [])
    gaps = explanation.get("potential_gaps", [])
    rating = explanation.get("match_rating", "")
    role = internship.get("role_title", "internship")
    company = internship.get("company", "company")
    
    text = f"{rating} for {role} position at {company}. "
    
    if strengths:
        text += f"Your profile aligns well: {strengths[0]}. "
    
    if gaps:
        text += f"Growth opportunity: {gaps[0]}. "
    
    text += f"This role offers a chance to work on {internship.get('description', 'impactful projects')}"
    
    return text


def _generate_with_llm(
    candidate_data: Dict[str, Any],
    internship: Dict[str, Any],
    explanation: Dict[str, Any]
) -> Optional[str]:
    """
    Generate explanation using Groq if available.
    
    Returns None if Groq is unavailable (falls back to heuristic).
    """
    try:
        from groq import Groq
    except ImportError:
        return None
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    
    try:
        client = Groq(api_key=api_key)
        prompt = _build_llm_prompt(candidate_data, internship, explanation)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a grounded career counselor for internship placements. "
                        "Use only the candidate and internship information provided in the prompt. "
                        "Never invent internships, companies, salaries, links, deadlines, or candidate qualifications. "
                        "If information is missing, say so clearly. "
                        "Explain matching skills and missing requirements conservatively."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=180
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Groq generation failed: {e}")
        return None


def _build_llm_prompt(
    candidate_data: Dict[str, Any],
    internship: Dict[str, Any],
    explanation: Dict[str, Any]
) -> str:
    """Build prompt for LLM."""
    strengths = explanation.get("key_strengths", [])
    gaps = explanation.get("potential_gaps", [])
    
    prompt = f"""
Candidate's Top Skills: {', '.join(candidate_data.get('skills', [])[:10])}

Internship Role: {internship.get('role_title')} at {internship.get('company')}
Domain: {internship.get('domain')}
Required Skills: {', '.join(internship.get('required_skills', []))}
Preferred Skills: {', '.join(internship.get('preferred_skills', []))}

Match Analysis:
- Strengths: {strengths[0] if strengths else 'No major strengths identified'}
- Gaps: {gaps[0] if gaps else 'No major gaps identified'}

Provide a brief recommendation for this candidate for this role.
"""
    return prompt.strip()


def rank_internships_with_explanations(
    results: List[Dict[str, Any]],
    candidate_data: Dict[str, Any],
    use_llm: bool = True
) -> List[Dict[str, Any]]:
    """
    Add LLM-based explanations to ranked internship results.
    
    Args:
        results: Results from second-stage ranking
        candidate_data: Parsed candidate resume
        use_llm: Whether to attempt LLM generation
    
    Returns:
        Results with added explanation field
    """
    for result in results:
        result["explanation"] = generate_grounded_explanation(
            candidate_data, result, use_llm=use_llm
        )
    
    return results
