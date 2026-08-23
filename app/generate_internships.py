"""Generate a synthetic internship dataset for testing and development."""

import json
import uuid
from pathlib import Path

# Data for synthetic internships
COMPANIES = [
    "Google", "Amazon", "Microsoft", "Apple", "Meta", "Tesla", "Netflix",
    "Airbnb", "Uber", "LinkedIn", "Adobe", "Salesforce", "Oracle", "IBM",
    "Intel", "NVIDIA", "Qualcomm", "Cisco", "VMware", "Stripe", "Square",
    "Dropbox", "Box", "Figma", "Slack", "Zoom", "Atlassian", "HashiCorp",
    "GitLab", "JetBrains", "RedHat", "Canonical", "Mozilla", "Apache",
    "TensorFlow", "PyTorch", "FastAI", "Hugging Face", "OpenAI", "Anthropic",
    "Databricks", "Palantir", "Notion", "Asana", "Monday.com", "Jira",
    "HubSpot", "Marketo", "Segment", "Twilio", "SendGrid", "Auth0",
    "PagerDuty", "LaunchDarkly", "Split.io", "Optimizely", "Amplitude",
    "Mixpanel", "Heap", "FullStory", "LogRocket", "Sentry", "Rollbar",
    "DataDog", "New Relic", "Splunk", "Elastic", "Prometheus", "Grafana",
    "Kubernetes", "Docker", "HashiCorp", "Terraform", "Ansible", "Puppet",
    "Chef", "SaltStack", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI",
    "Travis CI", "Drone", "Tekton", "ArgoCD", "Flux", "Helm", "Kustomize",
    "Skaffold", "Tilt", "Telepresence", "Okteto", "DevSpace", "Nix",
    "Flox", "Rye", "Poetry", "Pipenv", "Conda", "Mamba", "Micromamba",
    "Infosys", "TCS", "Wipro", "HCL Technologies", "Cognizant", "Tech Mahindra",
    "Accenture", "Deloitte", "PWC", "EY", "KPMG", "Capgemini", "Atos",
    "Fujitsu", "NEC", "Hitachi", "Sony", "Panasonic", "Samsung", "LG",
    "Hyundai", "Kia", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Ferrari",
    "Goldman Sachs", "JP Morgan", "Morgan Stanley", "Bank of America", "Citigroup",
    "Wells Fargo", "Deutsche Bank", "HSBC", "Barclays", "RBS", "UBS",
    "Credit Suisse", "ING", "Santander", "BNP Paribas", "Société Générale",
    "Airbnb", "Booking.com", "Expedia", "Trivago", "Kayak", "Hopper",
    "Instacart", "DoorDash", "Uber Eats", "Grubhub", "Zomato", "Swiggy",
    "Pinterest", "Twitter", "Snapchat", "TikTok", "Discord", "Telegram",
    "WhatsApp", "Signal", "Viber", "WeChat", "QQ", "Alipay", "WeChat Pay",
    "Spotify", "Apple Music", "Amazon Music", "YouTube Music", "Tidal",
    "Pandora", "Audible", "Scribd", "Medium", "Substack", "Patreon"
]

ROLES = [
    "Software Engineering Intern", "Backend Developer Intern", "Frontend Developer Intern",
    "Full-Stack Developer Intern", "Machine Learning Engineer Intern", "Data Science Intern",
    "Data Engineer Intern", "DevOps Engineer Intern", "Cloud Engineer Intern",
    "Security Engineer Intern", "QA Engineer Intern", "Product Manager Intern",
    "Product Designer Intern", "UX Designer Intern", "UI Designer Intern",
    "Business Analyst Intern", "Solutions Architect Intern", "Technical Writer Intern",
    "Sales Engineer Intern", "Solutions Engineer Intern", "Research Scientist Intern",
    "AI/ML Research Intern", "Deep Learning Intern", "NLP Engineer Intern",
    "Computer Vision Engineer Intern", "Robotics Engineer Intern", "Embedded Systems Intern",
    "Mobile Developer Intern", "Android Developer Intern", "iOS Developer Intern",
    "React Native Developer Intern", "DevOps/SRE Intern", "Infrastructure Engineer Intern",
]

DOMAINS = [
    "Software Development", "Machine Learning", "Data Science", "Cloud Computing",
    "DevOps & Infrastructure", "Security", "Mobile Development", "Web Development",
    "Artificial Intelligence", "Deep Learning", "Natural Language Processing",
    "Computer Vision", "Robotics", "IoT", "Blockchain", "Cryptocurrency",
    "Fintech", "Healthcare Tech", "EdTech", "E-commerce", "Social Media",
    "Streaming & Entertainment", "Gaming", "Automotive Tech", "Aerospace",
    "Quantum Computing", "AR/VR", "Augmented Reality", "Virtual Reality",
    "Big Data", "Real-time Analytics", "Business Intelligence", "Data Engineering",
]

LOCATIONS = [
    "Bangalore, India", "Hyderabad, India", "Mumbai, India", "Delhi, India", "Pune, India",
    "Gurugram, India", "Chennai, India", "Kolkata, India", "Indore, India",
    "San Francisco, USA", "New York, USA", "Seattle, USA", "Los Angeles, USA",
    "Boston, USA", "Chicago, USA", "Austin, USA", "Denver, USA", "Portland, USA",
    "London, UK", "Berlin, Germany", "Paris, France", "Amsterdam, Netherlands",
    "Singapore", "Tokyo, Japan", "Sydney, Australia", "Toronto, Canada", "Vancouver, Canada",
]

MODES = ["On-site", "Remote", "Hybrid"]

MIN_EDUCATION = [
    "Pursuing B.Tech/B.E.",
    "Pursuing B.Tech/B.E. (2nd year)",
    "Pursuing B.Tech/B.E. (3rd year)",
    "Completed B.Tech/B.E.",
    "Pursuing M.Tech/M.E.",
    "Completed M.Tech/M.E.",
    "Any graduation year",
    "Pursuing Bachelor's",
]

TECHNICAL_SKILLS = [
    "Python", "Java", "C++", "JavaScript", "TypeScript", "Go", "Rust", "C#", "PHP", "Ruby",
    "Kotlin", "Swift", "Objective-C", "R", "MATLAB", "SQL", "NoSQL", "MongoDB", "PostgreSQL",
    "MySQL", "Oracle", "Redis", "Elasticsearch", "React", "Angular", "Vue.js", "Next.js",
    "Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET",
    "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Terraform", "Ansible",
    "Git", "GitHub", "GitLab", "Bitbucket", "Linux", "Windows", "macOS", "REST API",
    "GraphQL", "WebSocket", "gRPC", "OAuth", "JWT", "SSL/TLS", "CORS", "API Gateway",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Keras",
    "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn", "Plotly", "Apache Spark",
    "Hadoop", "Kafka", "RabbitMQ", "AWS SQS", "AWS SNS", "Microservices", "CI/CD",
    "Jenkins", "GitHub Actions", "GitLab CI", "Docker Compose", "Helm", "JIRA",
    "Agile", "Scrum", "Kanban", "Waterfall", "Test-Driven Development", "Unit Testing",
    "Integration Testing", "End-to-End Testing", "Selenium", "Pytest", "Jest", "Mocha",
    "OWASP", "GDPR", "Encryption", "Penetration Testing", "Bug Bounty",
]

SOFT_SKILLS = [
    "Communication", "Teamwork", "Leadership", "Problem Solving", "Critical Thinking",
    "Time Management", "Adaptability", "Creativity", "Initiative", "Accountability",
    "Collaboration", "Mentoring", "Presentation Skills", "Written Communication",
    "Interpersonal Skills", "Negotiation", "Decision Making", "Analytical Thinking",
]

DESCRIPTIONS = [
    "Join our innovative team to work on cutting-edge technologies and solve real-world problems. You'll collaborate with experienced engineers and get exposure to the full software development lifecycle.",
    "Be part of our mission to revolutionize {domain}. Work on scalable systems that impact millions of users globally. You'll gain hands-on experience with modern development practices and tools.",
    "Exciting opportunity to contribute to our {domain} platform. You'll work on challenging problems, learn from industry experts, and have the chance to make a real impact on our product.",
    "Help us build the future of {domain}. This internship offers a unique blend of learning and practical application. You'll work on real projects and collaborate with cross-functional teams.",
    "Dive into our {domain} projects and expand your technical skills. You'll be mentored by experienced professionals and contribute to products used by millions worldwide.",
    "Join our dynamic team and make an immediate impact. Work on interesting problems in {domain} while developing your professional skills in a supportive environment.",
    "Passionate about {domain}? We're looking for interns who want to learn and grow. You'll work on real-world projects and gain valuable industry experience.",
    "Be part of our success story. Internship focused on {domain} where you'll learn, grow, and contribute to meaningful projects. Great mentorship and career development opportunities.",
    "Transform your passion into expertise. Our {domain} internship provides hands-on experience, mentorship, and the opportunity to work on impactful projects.",
    "Accelerate your career in {domain}. Join us for an internship that combines learning with practical application. Work on challenging projects with a supportive team.",
]


def generate_internships(count=180):
    """Generate synthetic internship records."""
    internships = []
    
    # Use deterministic generation to ensure reproducibility
    used_combinations = set()
    
    for i in range(count):
        company_idx = i % len(COMPANIES)
        role_idx = (i // len(COMPANIES)) % len(ROLES)
        domain_idx = (i // (len(COMPANIES) * len(ROLES))) % len(DOMAINS)
        location_idx = (i + i*7) % len(LOCATIONS)
        mode_idx = (i + i*3) % len(MODES)
        education_idx = (i + i*11) % len(MIN_EDUCATION)
        
        company = COMPANIES[company_idx]
        role = ROLES[role_idx]
        domain = DOMAINS[domain_idx]
        location = LOCATIONS[location_idx]
        mode = MODES[mode_idx]
        min_education = MIN_EDUCATION[education_idx]
        
        # Generate required skills (3-6 skills)
        required_skill_count = 3 + (i % 4)
        required_skills = [
            TECHNICAL_SKILLS[(i*j + j) % len(TECHNICAL_SKILLS)]
            for j in range(required_skill_count)
        ]
        required_skills = list(set(required_skills))[:required_skill_count]
        
        # Generate preferred skills (1-4 skills)
        preferred_skill_count = 1 + (i % 4)
        preferred_skills = [
            TECHNICAL_SKILLS[(i*j + j*7) % len(TECHNICAL_SKILLS)]
            for j in range(preferred_skill_count)
        ]
        # Remove duplicates with required skills
        preferred_skills = [s for s in preferred_skills if s not in required_skills][:preferred_skill_count]
        
        # Generate description
        desc_template = DESCRIPTIONS[i % len(DESCRIPTIONS)]
        description = desc_template.format(domain=domain)
        
        # Duration and stipend
        duration_weeks = 6 + (i % 13)  # 6-18 weeks
        stipend = 5000 + (i % 25000)  # 5000-29999 INR/month
        
        internship = {
            "id": str(uuid.uuid4()),
            "company": company,
            "role_title": role,
            "domain": domain,
            "location": location,
            "mode": mode,
            "duration_weeks": duration_weeks,
            "stipend_inr_per_month": stipend,
            "min_education": min_education,
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "description": description,
        }
        
        internships.append(internship)
    
    return internships


def save_internships(internships, output_file="data/internships.json"):
    """Save internships to JSON file."""
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(internships, f, indent=2)
    
    print(f"✓ Generated {len(internships)} internships")
    print(f"✓ Saved to {output_path}")


def load_internships(input_file="data/internships.json"):
    """Load internships from JSON file."""
    input_path = Path(input_file)
    
    if not input_path.exists():
        print(f"Internship dataset not found at {input_path}")
        print("Generating synthetic dataset...")
        internships = generate_internships(180)
        save_internships(internships, input_file)
        return internships
    
    with open(input_path, "r") as f:
        internships = json.load(f)
    
    return internships


if __name__ == "__main__":
    internships = generate_internships(180)
    save_internships(internships)
    print(f"\nSample internship:")
    import json as json_module
    print(json_module.dumps(internships[0], indent=2))
