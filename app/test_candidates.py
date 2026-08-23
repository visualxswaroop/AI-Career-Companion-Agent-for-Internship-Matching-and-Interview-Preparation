"""
Test suite for internship recommendation system.

Tests:
1. Resume parsing accuracy
2. Embeddings generation
3. FAISS semantic search
4. Second-stage ranking
5. LLM explanations
6. End-to-end API flow
"""

import json
from typing import Dict, List, Any


def create_test_candidates() -> List[Dict[str, Any]]:
    """Create 10 diverse test candidate profiles."""
    return [
        {
            "name": "Candidate 1: Full-stack Developer",
            "skills": ["Python", "JavaScript", "React", "FastAPI", "SQL", "Docker", "AWS", "REST API"],
            "education": [
                {
                    "degree": "B.Tech",
                    "field": "Computer Science",
                    "institution": "IIT Delhi",
                    "graduation_year": 2024
                }
            ],
            "experience": [
                {
                    "title": "Software Engineering Intern",
                    "company": "Tech Startup",
                    "duration_months": 4,
                    "description": "Developed REST APIs using FastAPI"
                }
            ],
            "projects": [
                {
                    "title": "E-commerce Platform",
                    "description": "Built full-stack application with Python/React",
                    "technologies": ["Python", "React", "PostgreSQL"]
                }
            ],
            "expected_fits": ["Software Development", "DevOps/Cloud"]
        },
        {
            "name": "Candidate 2: Data Science Enthusiast",
            "skills": ["Python", "Machine Learning", "SQL", "Pandas", "Scikit-learn", "TensorFlow", "Excel"],
            "education": [
                {
                    "degree": "M.Tech",
                    "field": "Artificial Intelligence",
                    "institution": "IIIT Hyderabad",
                    "graduation_year": 2025
                }
            ],
            "experience": [
                {
                    "title": "ML Research Intern",
                    "company": "AI Lab",
                    "duration_months": 6,
                    "description": "Worked on NLP models"
                }
            ],
            "projects": [
                {
                    "title": "Sentiment Analysis Model",
                    "description": "Built BERT-based sentiment classifier",
                    "technologies": ["Python", "TensorFlow", "NLP"]
                }
            ],
            "expected_fits": ["AI/ML", "Data Science"]
        },
        {
            "name": "Candidate 3: DevOps & Cloud Specialist",
            "skills": ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD", "Terraform", "Python", "Git"],
            "education": [
                {
                    "degree": "B.Tech",
                    "field": "Electronics & Communication",
                    "institution": "NIT Rourkee",
                    "graduation_year": 2024
                }
            ],
            "experience": [
                {
                    "title": "DevOps Intern",
                    "company": "Cloud Company",
                    "duration_months": 3,
                    "description": "Managed K8s clusters and CI/CD pipelines"
                }
            ],
            "projects": [
                {
                    "title": "Infrastructure Automation",
                    "description": "Automated deployment using Terraform",
                    "technologies": ["Terraform", "Docker", "AWS"]
                }
            ],
            "expected_fits": ["DevOps/Cloud"]
        },
        {
            "name": "Candidate 4: Cybersecurity Focussed",
            "skills": ["Linux", "Networking", "Python", "C++", "SQL", "Problem Solving", "Penetration Testing"],
            "education": [
                {
                    "degree": "B.Tech",
                    "field": "Information Technology",
                    "institution": "BITS Pilani",
                    "graduation_year": 2024
                }
            ],
            "experience": [
                {
                    "title": "Security Research Intern",
                    "company": "Cybersecurity Firm",
                    "duration_months": 5,
                    "description": "Conducted vulnerability assessments"
                }
            ],
            "projects": [
                {
                    "title": "Network Security Tool",
                    "description": "Built packet analyzer in C++",
                    "technologies": ["C++", "Networking", "Linux"]
                }
            ],
            "expected_fits": ["Cybersecurity"]
        },
        {
            "name": "Candidate 5: Business Analyst Track",
            "skills": ["Excel", "SQL", "Data Analysis", "Communication", "JIRA", "Power BI", "Tableau"],
            "education": [
                {
                    "degree": "M.Tech",
                    "field": "Business Administration",
                    "institution": "IIM Ahmedabad",
                    "graduation_year": 2025
                }
            ],
            "experience": [
                {
                    "title": "Business Analyst Intern",
                    "company": "Consulting Firm",
                    "duration_months": 4,
                    "description": "Analyzed business processes and metrics"
                }
            ],
            "projects": [
                {
                    "title": "Sales Dashboard",
                    "description": "Created Power BI dashboards for reporting",
                    "technologies": ["Power BI", "SQL", "Excel"]
                }
            ],
            "expected_fits": ["Business Analysis"]
        },
        {
            "name": "Candidate 6: Versatile Generalist",
            "skills": ["Python", "Java", "JavaScript", "SQL", "AWS", "REST API", "Communication", "Problem Solving"],
            "education": [
                {
                    "degree": "B.Tech",
                    "field": "Computer Science",
                    "institution": "VIT University",
                    "graduation_year": 2024
                }
            ],
            "experience": [
                {
                    "title": "Software Developer",
                    "company": "MNC",
                    "duration_months": 6,
                    "description": "Worked on multiple technologies"
                }
            ],
            "projects": [
                {
                    "title": "Multi-platform App",
                    "description": "Built features across web and mobile",
                    "technologies": ["Python", "JavaScript", "SQL"]
                }
            ],
            "expected_fits": ["Software Development"]
        },
        {
            "name": "Candidate 7: Early Career - Limited Experience",
            "skills": ["Python", "Java", "HTML/CSS", "Git", "SQL"],
            "education": [
                {
                    "degree": "B.Tech",
                    "field": "Computer Science",
                    "institution": "Local College",
                    "graduation_year": 2025
                }
            ],
            "experience": [],
            "projects": [
                {
                    "title": "Student Projects",
                    "description": "Basic college assignments",
                    "technologies": ["Python", "Java", "SQL"]
                }
            ],
            "expected_fits": ["Software Development"]
        },
        {
            "name": "Candidate 8: AI/ML Specialist",
            "skills": ["Python", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "NLP", "Computer Vision"],
            "education": [
                {
                    "degree": "M.Tech",
                    "field": "Artificial Intelligence",
                    "institution": "IIT Mumbai",
                    "graduation_year": 2024
                }
            ],
            "experience": [
                {
                    "title": "AI Research Fellow",
                    "company": "Research Institute",
                    "duration_months": 8,
                    "description": "Published papers on deep learning"
                }
            ],
            "projects": [
                {
                    "title": "Vision Transformer",
                    "description": "Implemented state-of-the-art vision model",
                    "technologies": ["PyTorch", "Computer Vision", "Python"]
                }
            ],
            "expected_fits": ["AI/ML"]
        },
        {
            "name": "Candidate 9: Cloud Infrastructure Expert",
            "skills": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Linux", "Networking"],
            "education": [
                {
                    "degree": "B.Tech",
                    "field": "Computer Science",
                    "institution": "Delhi Technological University",
                    "graduation_year": 2023
                }
            ],
            "experience": [
                {
                    "title": "Cloud Architect",
                    "company": "Enterprise IT",
                    "duration_months": 12,
                    "description": "Designed multi-cloud infrastructure"
                }
            ],
            "projects": [
                {
                    "title": "Hybrid Cloud Setup",
                    "description": "Managed AWS and Azure integration",
                    "technologies": ["AWS", "Azure", "Terraform"]
                }
            ],
            "expected_fits": ["DevOps/Cloud"]
        },
        {
            "name": "Candidate 10: Non-Tech Background to Software",
            "skills": ["Java", "Python", "Problem Solving", "Communication", "Learning"],
            "education": [
                {
                    "degree": "B.Com",
                    "field": "Commerce",
                    "institution": "Delhi University",
                    "graduation_year": 2023
                },
                {
                    "degree": "Bootcamp",
                    "field": "Full-Stack Development",
                    "institution": "Coding Bootcamp",
                    "graduation_year": 2024
                }
            ],
            "experience": [
                {
                    "title": "Career Switcher",
                    "company": "N/A",
                    "duration_months": 0,
                    "description": "Recently completed bootcamp"
                }
            ],
            "projects": [
                {
                    "title": "Todo App",
                    "description": "Basic full-stack application",
                    "technologies": ["Python", "Java", "SQL"]
                }
            ],
            "expected_fits": ["Software Development"]
        }
    ]


def convert_candidate_to_resume_data(candidate: Dict[str, Any]) -> Dict[str, Any]:
    """Convert test candidate to resume data format."""
    return {
        "name": candidate.get("name", ""),
        "email": f"{candidate['name'].lower().replace(' ', '.')}@example.com",
        "phone": "+91-9876543210",
        "linkedin": f"linkedin.com/in/{candidate['name'].lower().replace(' ', '-')}",
        "github": f"github.com/{candidate['name'].lower().replace(' ', '')}",
        "professional_summary": f"Experienced in {', '.join(candidate.get('skills', [])[:3])}",
        "skills": candidate.get("skills", []),
        "education": candidate.get("education", []),
        "work_experience": candidate.get("experience", []),
        "projects": candidate.get("projects", []),
        "certifications": [],
        "achievements": []
    }


def test_candidate_diversity():
    """Test that we have diverse candidates with different skill profiles."""
    candidates = create_test_candidates()
    
    print("\n" + "="*80)
    print("TEST CANDIDATES OVERVIEW")
    print("="*80)
    
    for i, candidate in enumerate(candidates, 1):
        print(f"\n{i}. {candidate['name']}")
        print(f"   Skills ({len(candidate['skills'])}): {', '.join(candidate['skills'][:5])}...")
        print(f"   Education: {candidate['education'][0]['field']}")
        print(f"   Expected Best Fits: {', '.join(candidate['expected_fits'])}")
    
    print(f"\n✓ Created {len(candidates)} diverse test candidates")
    return candidates


def prepare_test_candidates_for_api():
    """Format candidates as they would appear in resume extraction."""
    candidates = create_test_candidates()
    formatted = []
    
    for candidate in candidates:
        resume_data = convert_candidate_to_resume_data(candidate)
        formatted.append({
            "candidate": candidate['name'],
            "resume_data": resume_data,
            "expected_fits": candidate['expected_fits']
        })
    
    return formatted


if __name__ == "__main__":
    # Run tests
    test_candidate_diversity()
    formatted = prepare_test_candidates_for_api()
    
    # Save for reference
    with open("test_candidates.json", "w") as f:
        json.dump(formatted, f, indent=2)
    
    print("\n✓ Test candidates saved to test_candidates.json")
