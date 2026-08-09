import re


# =========================================================
# EMAIL
# =========================================================

def extract_email(text: str):

    pattern = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"

    match = re.search(pattern, text)

    if match:
        return match.group(0)

    return None


# =========================================================
# PHONE
# =========================================================

def extract_phone(text: str):

    patterns = [
        r"\+91[\s-]?[6-9]\d{9}",
        r"\b[6-9]\d{9}\b",
        r"\+\d{1,3}[\s-]?\d{7,12}"
    ]

    for pattern in patterns:

        match = re.search(pattern, text)

        if match:
            return match.group(0)

    return None


# =========================================================
# LINKEDIN
# =========================================================

def extract_linkedin(text: str):

    pattern = r"(https?://)?(www\.)?linkedin\.com/in/[A-Za-z0-9_-]+"

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(0)

    return None


# =========================================================
# GITHUB
# =========================================================

def extract_github(text: str):

    pattern = r"(https?://)?(www\.)?github\.com/[A-Za-z0-9_-]+"

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(0)

    return None


# =========================================================
# NAME
# =========================================================

def extract_name(text: str):

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    if not lines:
        return None

    ignored_words = [
        "resume",
        "curriculum vitae",
        "cv"
    ]

    for line in lines[:10]:

        lower_line = line.lower()

        if any(
            word in lower_line
            for word in ignored_words
        ):
            continue

        if "@" in line:
            continue

        if "linkedin.com" in lower_line:
            continue

        if "github.com" in lower_line:
            continue

        if re.search(r"\d{7,}", line):
            continue

        words = line.split()

        if 2 <= len(words) <= 5:

            if all(
                re.match(
                    r"^[A-Za-z][A-Za-z.'-]*$",
                    word
                )
                for word in words
            ):
                return line

    return None


# =========================================================
# TECHNICAL SKILLS
# =========================================================

TECHNICAL_SKILLS = [
    "Python",
    "Java",
    "C",
    "C++",
    "JavaScript",
    "TypeScript",
    "HTML",
    "CSS",
    "SQL",
    "FastAPI",
    "Flask",
    "Django",
    "React",
    "Node.js",
    "Express.js",
    "Git",
    "GitHub",
    "Docker",
    "AWS",
    "Azure",
    "Google Cloud",
    "Machine Learning",
    "Deep Learning",
    "Artificial Intelligence",
    "Natural Language Processing",
    "Computer Vision",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "OpenCV",
    "MediaPipe",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "SQLite",
    "Redis",
    "REST API",
    "REST APIs",
    "API",
    "Data Structures",
    "Algorithms",
    "GitLab",
    "Linux",
    "Matplotlib",
    "Seaborn",
    "Power BI",
    "Tableau"
]


# =========================================================
# SOFT SKILLS
# =========================================================

SOFT_SKILLS = [
    "Communication",
    "Leadership",
    "Teamwork",
    "Problem Solving",
    "Time Management",
    "Critical Thinking",
    "Adaptability",
    "Creativity",
    "Team Leadership",
    "Decision Making",
    "Presentation",
    "Collaboration",
    "Analytical Thinking",
    "Interpersonal Skills"
]


# =========================================================
# EXTRACT SKILLS
# =========================================================

def extract_skills(text: str, skill_list: list):

    found_skills = []

    text_lower = text.lower()

    for skill in skill_list:

        if skill.lower() in text_lower:
            found_skills.append(skill)

    return found_skills


# =========================================================
# SECTION NAMES
# =========================================================

SECTION_NAMES = {

    "summary": [
        "summary",
        "professional summary",
        "profile",
        "career profile",
        "objective",
        "career objective"
    ],

    "education": [
        "education",
        "educational background",
        "academic background",
        "academic qualifications",
        "qualifications"
    ],

    "work_experience": [
        "work experience",
        "professional experience",
        "experience",
        "employment history",
        "work history"
    ],

    "projects": [
        "projects",
        "personal projects",
        "academic projects",
        "key projects"
    ],

    "certifications": [
        "certifications",
        "certificates",
        "professional certifications"
    ],

    "internships": [
        "internships",
        "internship",
        "internship experience"
    ],

    "achievements": [
        "achievements",
        "accomplishments",
        "awards",
        "honors",
        "honours"
    ],

    "languages": [
        "languages",
        "language",
        "language proficiency"
    ],

    "skills": [
        "skills",
        "technical skills",
        "core skills",
        "key skills",
        "skills & technologies"
    ]
}


# =========================================================
# EXTRACT SECTIONS
# =========================================================

def extract_sections(text: str):

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    sections = {}

    current_section = None

    for line in lines:

        cleaned_line = line.strip(" :-").lower()

        detected_section = None

        for section, names in SECTION_NAMES.items():

            if cleaned_line in names:

                detected_section = section

                break

        if detected_section:

            current_section = detected_section

            if current_section not in sections:
                sections[current_section] = []

            continue

        if current_section:

            sections[current_section].append(line)

    return sections


# =========================================================
# PROFESSIONAL SUMMARY
# =========================================================

def extract_summary(text: str):

    sections = extract_sections(text)

    summary = sections.get(
        "summary",
        []
    )

    if summary:

        return " ".join(summary)

    return None


# =========================================================
# ADDRESS
# =========================================================

def extract_address(text: str):

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    address_keywords = [
        "address:",
        "location:",
        "residence:",
        "city:",
        "address -",
        "location -"
    ]

    for line in lines:

        lower_line = line.lower()

        for keyword in address_keywords:

            if lower_line.startswith(keyword):

                address = line[len(keyword):].strip()

                if address:
                    return address

    return None


# =========================================================
# LANGUAGES
# =========================================================

def extract_languages(text: str):

    common_languages = [
        "English",
        "Hindi",
        "Odia",
        "Telugu",
        "Tamil",
        "Kannada",
        "Malayalam",
        "Bengali",
        "Marathi",
        "Gujarati",
        "Punjabi",
        "Urdu",
        "German",
        "French",
        "Spanish",
        "Japanese",
        "Chinese"
    ]

    return extract_skills(
        text,
        common_languages
    )


# =========================================================
# MAIN RESUME PARSER
# =========================================================

def parse_resume(text: str):

    sections = extract_sections(text)

    technical_skills = extract_skills(
        text,
        TECHNICAL_SKILLS
    )

    soft_skills = extract_skills(
        text,
        SOFT_SKILLS
    )

    all_skills = []

    for skill in technical_skills + soft_skills:

        if skill not in all_skills:
            all_skills.append(skill)

    return {

        "full_name": extract_name(text),

        "email": extract_email(text),

        "phone": extract_phone(text),

        "address": extract_address(text),

        "linkedin": extract_linkedin(text),

        "github": extract_github(text),

        "professional_summary": extract_summary(text),

        "skills": all_skills,

        "education": sections.get(
            "education",
            []
        ),

        "work_experience": sections.get(
            "work_experience",
            []
        ),

        "projects": sections.get(
            "projects",
            []
        ),

        "certifications": sections.get(
            "certifications",
            []
        ),

        "internships": sections.get(
            "internships",
            []
        ),

        "languages": extract_languages(text),

        "achievements": sections.get(
            "achievements",
            []
        ),

        "technical_skills": technical_skills,

        "soft_skills": soft_skills
    }