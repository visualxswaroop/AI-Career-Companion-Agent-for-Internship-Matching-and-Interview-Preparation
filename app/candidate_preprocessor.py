def prepare_candidate_data(candidate):
    candidate_text = ""

    candidate_text += "Skills: " + ", ".join(candidate.get("skills", [])) + "\n"

    # Handle education - could be list of dicts or strings
    education_list = candidate.get("education", [])
    education_text = []
    for edu in education_list:
        if isinstance(edu, dict):
            degree = edu.get("degree", "")
            field = edu.get("field", "")
            institution = edu.get("institution", "")
            year = edu.get("graduation_year", "")
            education_text.append(f"{degree} in {field} from {institution} ({year})")
        else:
            education_text.append(str(edu))
    candidate_text += "Education: " + " ".join(education_text) + "\n"

    # Handle work experience - could be list of dicts or strings
    experience_list = candidate.get("work_experience", [])
    experience_text = []
    for exp in experience_list:
        if isinstance(exp, dict):
            title = exp.get("title", "")
            company = exp.get("company", "")
            desc = exp.get("description", "")
            experience_text.append(f"{title} at {company}: {desc}")
        else:
            experience_text.append(str(exp))
    candidate_text += "Work Experience: " + " ".join(experience_text) + "\n"

    # Handle projects - could be list of dicts or strings
    projects_list = candidate.get("projects", [])
    projects_text = []
    for proj in projects_list:
        if isinstance(proj, dict):
            title = proj.get("title", "")
            desc = proj.get("description", "")
            projects_text.append(f"{title}: {desc}")
        else:
            projects_text.append(str(proj))
    candidate_text += "Projects: " + " ".join(projects_text) + "\n"

    candidate_text += "Certifications: " + " ".join(
        candidate.get("certifications", [])
    ) + "\n"

    candidate_text += "Internships: " + " ".join(
        candidate.get("internships", [])
    ) + "\n"

    candidate_text += "Achievements: " + " ".join(
        candidate.get("achievements", [])
    ) + "\n"

    professional_summary = candidate.get("professional_summary") or ""
    candidate_text += "Professional Summary: " + professional_summary

    return candidate_text