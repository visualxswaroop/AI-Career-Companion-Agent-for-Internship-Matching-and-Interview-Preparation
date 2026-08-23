// ─────────────────────────────────────────────────────────────────────────────
// Sample data — all fictional, for landing page demonstration only
// ─────────────────────────────────────────────────────────────────────────────

export interface Internship {
  id: string
  company: string
  role: string
  location: string
  mode: 'Remote' | 'Hybrid' | 'On-site'
  matchPercent: number
  skills: string[]
  whyFit: string
}

export interface Testimonial {
  id: string
  name: string
  description: string
  quote: string
  avatar: string
}

export const sampleInternships: Internship[] = [
  {
    id: '1',
    company: 'Beta Analytics',
    role: 'Data Analyst Intern',
    location: 'Bengaluru, India',
    mode: 'Hybrid',
    matchPercent: 89,
    skills: ['Python', 'SQL', 'Power BI', 'Pandas'],
    whyFit:
      'Your analytics projects and SQL skills closely match their requirements.',
  },
  {
    id: '2',
    company: 'FinStart',
    role: 'Business Analyst Intern',
    location: 'Mumbai, India',
    mode: 'On-site',
    matchPercent: 81,
    skills: ['SQL', 'Analytics', 'Communication'],
    whyFit:
      'Your finance coursework and data analysis background make you a relevant fit.',
  },
  {
    id: '3',
    company: 'Designo',
    role: 'UX Research Intern',
    location: 'Remote',
    mode: 'Remote',
    matchPercent: 74,
    skills: ['Research', 'Figma', 'User Testing'],
    whyFit:
      'Your portfolio and research coursework align well with their research needs.',
  },
]

export const sampleTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Priya Mehta',
    description: 'Final-year CS student',
    quote:
      '"I knew what skills to build next. It felt like having a career advisor available 24/7."',
    avatar: 'PM',
  },
  {
    id: '2',
    name: 'Marco Ferretti',
    description: 'Design Graduate',
    quote:
      '"The cover letters actually sound like me. It issues me sounding generic completely."',
    avatar: 'MF',
  },
  {
    id: '3',
    name: 'Arjun Singh',
    description: 'BBA Student',
    quote:
      '"Found three internships I genuinely wanted to apply for in under ten minutes."',
    avatar: 'AS',
  },
]

export const sampleResume = {
  name: 'Aanya Sharma',
  title: 'Computer Science Student',
  email: 'aanya@email.com',
  phone: '+91 98765 43210',
  skills: ['Python', 'SQL', 'Power BI', 'Excel', 'Pandas', 'Tableau'],
  experience: [
    {
      role: 'Data Analytics Intern',
      org: 'InfoTech Ltd',
      points: [
        'Analyzed user behaviour data to improve onboarding conversion by 18%',
        'Built interactive dashboards using Power BI for senior management',
      ],
    },
  ],
  education: 'B.Tech Computer Science, VIT Vellore — 2024',
  strengthsExperience: ['Data Analysis', 'Dashboarding', 'Stakeholder collab'],
  missingSkills: ['Machine Learning', 'Tableau', 'SQL'],
  suggestedRoles: ['Data Analyst', 'Product Analyst', 'Business Analyst', 'Data Associate'],
  matchPercent: 82,
  whyThisRole:
    'Your strengths, interests and projects align well with this role. You have the right foundation to grow.',
}

export const sampleCoverLetter = {
  jobTitle: 'Data Analyst Intern at Beta Analytics',
  jobDescription:
    'Beta Analytics is looking for someone who is passionate about data, comfortable with Python, SQL, and Excel, and excited to learn. You will work on real business problems, help dashboard design and data storytelling, and collaborate with our cross-functional teams.',
  letter: `Dear Hiring Team at Beta Analytics,

I'm excited to apply for the Data Analyst Intern role. I am someone who naturally links data to decisions — I genuinely enjoy identifying patterns that change how a team operates.

In my internship at InfoTech, I analysed user behaviour data that improved recurring efficiency by 14%. I work with SQL and Power BI, and I find that the most valuable part is translating the numbers into something a non-technical stakeholder can act on.

I'm looking forward to this opportunity to learn from your team and contribute to your data projects.

Looking forward to connecting.

Sincerely,
Aanya Sharma`,
}
