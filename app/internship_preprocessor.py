def prepare_internship_data(internship):
    internship_text = ""

    internship_text += "Role: " + internship.get("role_title", "") + "\n"
    internship_text += "Domain: " + internship.get("domain", "") + "\n"

    internship_text += "Description: " + internship.get(
        "description", ""
    ) + "\n"

    internship_text += "Required Skills: " + ", ".join(
        internship.get("required_skills", [])
    ) + "\n"

    internship_text += "Preferred Skills: " + ", ".join(
        internship.get("preferred_skills", [])
    ) + "\n"

    internship_text += "Education: " + internship.get(
        "min_education", ""
    )

    return internship_text