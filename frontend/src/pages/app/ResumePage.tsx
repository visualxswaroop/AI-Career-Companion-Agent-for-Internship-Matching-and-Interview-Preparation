import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode, type RefObject } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { resumeApi } from '../../api/resume'
import { ApiRequestError, formatErrorMessage } from '../../api/client'
import {
  RESUME_ALLOWED_EXTENSIONS,
  RESUME_MAX_FILE_SIZE_BYTES,
  type ResumeData,
  type ResumeResponse,
} from '../../api/types'
import Button from '../../components/Button'

// ─────────────────────────────────────────────────────────────────────────────
// ATS Score computation (pure frontend)
// ─────────────────────────────────────────────────────────────────────────────

interface ATSCategory {
  label: string
  score: number
  maxScore: number
  feedback: string[]
}

function computeATSScore(data: ResumeData): { total: number; categories: ATSCategory[] } {
  const categories: ATSCategory[] = []

  // 1. Contact Info (20 pts)
  let contactScore = 0
  const contactFeedback: string[] = []
  if (toText(data.full_name)) contactScore += 5; else contactFeedback.push('Add your full name')
  if (toText(data.email)) contactScore += 5; else contactFeedback.push('Add a professional email address')
  if (toText(data.phone)) contactScore += 3; else contactFeedback.push('Include a phone number')
  if (toText(data.address)) contactScore += 2; else contactFeedback.push('Add city/state location')
  if (toText(data.linkedin)) contactScore += 3; else contactFeedback.push('Add your LinkedIn URL')
  if (toText(data.github)) contactScore += 2; else contactFeedback.push('Add your GitHub profile')
  if (contactScore === 20) contactFeedback.push('Contact info is complete ✓')
  categories.push({ label: 'Contact Info', score: contactScore, maxScore: 20, feedback: contactFeedback })

  // 2. Summary (15 pts)
  let summaryScore = 0
  const summaryFeedback: string[] = []
  const summary = toText(data.professional_summary)
  if (summary.length > 0) {
    summaryScore += 5
    if (summary.length >= 100) summaryScore += 5; else summaryFeedback.push('Expand your summary to 100+ characters for better impact')
    if (summary.length >= 200) summaryScore += 5; else summaryFeedback.push('A 200+ char summary with metrics greatly improves ATS ranking')
  } else {
    summaryFeedback.push('Add a professional summary — ATS systems rank it highly')
  }
  if (summaryScore === 15) summaryFeedback.push('Strong professional summary ✓')
  categories.push({ label: 'Professional Summary', score: summaryScore, maxScore: 15, feedback: summaryFeedback })

  // 3. Skills (25 pts)
  let skillsScore = 0
  const skillsFeedback: string[] = []
  const allSkills = [...toList(data.skills), ...toList(data.technical_skills), ...toList(data.soft_skills)]
  if (allSkills.length >= 5) skillsScore += 10; else skillsFeedback.push(`Add more skills (have ${allSkills.length}, recommend 5+)`)
  if (allSkills.length >= 10) skillsScore += 8; else if (allSkills.length >= 5) skillsFeedback.push('Add 10+ skills for better keyword matching')
  if (toList(data.technical_skills).length > 0) skillsScore += 4; else skillsFeedback.push('Separate technical skills into their own section')
  if (toList(data.soft_skills).length > 0) skillsScore += 3; else skillsFeedback.push('Add soft skills (communication, leadership, etc.)')
  if (skillsScore === 25) skillsFeedback.push('Excellent skills coverage ✓')
  categories.push({ label: 'Skills & Keywords', score: skillsScore, maxScore: 25, feedback: skillsFeedback })

  // 4. Experience (25 pts)
  let expScore = 0
  const expFeedback: string[] = []
  const experience = toList(data.work_experience)
  const projects = toList(data.projects)
  const internships = toList(data.internships)
  const totalExp = experience.length + projects.length + internships.length
  if (experience.length > 0) expScore += 10; else expFeedback.push('Add work experience entries')
  if (projects.length > 0) expScore += 8; else expFeedback.push('Include personal/academic projects with tech stack & outcomes')
  if (internships.length > 0) expScore += 4; else expFeedback.push('List internships separately for greater ATS weight')
  if (totalExp >= 3) expScore += 3; else expFeedback.push('More experience entries strengthen your ATS profile')
  if (expScore === 25) expFeedback.push('Experience section is comprehensive ✓')
  categories.push({ label: 'Experience & Projects', score: expScore, maxScore: 25, feedback: expFeedback })

  // 5. Education & Certs (15 pts)
  let eduScore = 0
  const eduFeedback: string[] = []
  if (toList(data.education).length > 0) eduScore += 8; else eduFeedback.push('Add your education details')
  if (toList(data.certifications).length > 0) eduScore += 5; else eduFeedback.push('Certifications (AWS, Google, Coursera) boost ATS scores significantly')
  if (toList(data.achievements).length > 0) eduScore += 2; else eduFeedback.push('Add achievements, awards, or honors')
  if (eduScore === 15) eduFeedback.push('Education & certifications are complete ✓')
  categories.push({ label: 'Education & Certs', score: eduScore, maxScore: 15, feedback: eduFeedback })

  const total = categories.reduce((sum, c) => sum + c.score, 0)
  return { total, categories }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Role → required skills (for Skill Gap Analyzer)
// ─────────────────────────────────────────────────────────────────────────────

const JOB_ROLE_SKILLS: Record<string, string[]> = {
  'Software Engineer': ['JavaScript', 'Python', 'Data Structures', 'Algorithms', 'Git', 'REST APIs', 'SQL', 'Problem Solving'],
  'Frontend Developer': ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Git', 'Responsive Design', 'REST APIs'],
  'Backend Developer': ['Python', 'Node.js', 'SQL', 'REST APIs', 'Docker', 'Git', 'Authentication', 'Databases'],
  'Full Stack Developer': ['React', 'Node.js', 'Python', 'SQL', 'REST APIs', 'Git', 'Docker', 'TypeScript'],
  'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Pandas', 'NumPy', 'Data Visualization', 'Statistics', 'Scikit-learn'],
  'Data Analyst': ['SQL', 'Python', 'Excel', 'Power BI', 'Data Visualization', 'Pandas', 'Statistics'],
  'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'Docker', 'SQL'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS', 'Terraform', 'Git', 'Bash'],
  'Cloud Engineer': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Networking', 'Linux'],
  'Product Manager': ['Product Strategy', 'Agile', 'User Research', 'Data Analysis', 'Roadmapping', 'Stakeholder Management'],
  'UX Designer': ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Adobe XD'],
  'Business Analyst': ['SQL', 'Excel', 'Requirements Gathering', 'Data Analysis', 'Power BI', 'Communication', 'Agile'],
  'Cybersecurity Analyst': ['Network Security', 'SIEM', 'Penetration Testing', 'Linux', 'Risk Assessment', 'Incident Response'],
  'Android Developer': ['Kotlin', 'Java', 'Android SDK', 'REST APIs', 'Git', 'Firebase', 'Material Design'],
  'iOS Developer': ['Swift', 'Xcode', 'Objective-C', 'REST APIs', 'Git', 'Core Data', 'SwiftUI'],
  'Marketing Intern': ['Content Writing', 'Social Media', 'Google Analytics', 'Email Marketing', 'SEO', 'Canva'],
  'Finance Analyst': ['Excel', 'Financial Modeling', 'SQL', 'Power BI', 'Accounting', 'Python', 'Bloomberg'],
  'HR Executive': ['Communication', 'MS Office', 'Recruitment', 'Employee Relations', 'HRMS', 'Onboarding'],
  'Operations Manager': ['Project Management', 'Process Improvement', 'Excel', 'Supply Chain', 'Team Leadership', 'ERP'],
  'Research Intern': ['Literature Review', 'Data Collection', 'Statistical Analysis', 'Python', 'R', 'Report Writing'],
}

// ─────────────────────────────────────────────────────────────────────────────
// ATS Score Panel component
// ─────────────────────────────────────────────────────────────────────────────

function ATSScorePanel({ data }: { data: ResumeData }) {
  const { total, categories } = computeATSScore(data)
  const [expanded, setExpanded] = useState<string | null>(null)
  const scoreColor = total >= 80 ? '#10b981' : total >= 55 ? '#f59e0b' : '#ef4444'
  const scoreLabel = total >= 80 ? 'Excellent' : total >= 65 ? 'Good' : total >= 45 ? 'Fair' : 'Needs Work'
  const circumference = 2 * Math.PI * 38

  return (
    <div style={{
      marginTop: '0', padding: '28px',
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f2ee8 0%, #3114cf 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            ATS Compatibility Score
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            How well your resume performs in Applicant Tracking Systems
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'start' }} className="ats-grid">
        {/* Circular gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <svg width="104" height="104" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="38" fill="none" stroke={scoreColor} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * total) / 100}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill={scoreColor}>{total}</text>
            <text x="50" y="60" textAnchor="middle" fontSize="9" fill="var(--text-muted)">/100</text>
          </svg>
          <span style={{
            fontSize: '0.78rem', fontWeight: 700, padding: '3px 12px', borderRadius: '999px',
            backgroundColor: total >= 80 ? 'rgba(16,185,129,0.12)' : total >= 55 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
            color: scoreColor,
          }}>{scoreLabel}</span>
        </div>

        {/* Category breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {categories.map(cat => {
            const pct = Math.round((cat.score / cat.maxScore) * 100)
            const catColor = pct >= 80 ? '#10b981' : pct >= 55 ? '#f59e0b' : '#ef4444'
            const isOpen = expanded === cat.label
            return (
              <div key={cat.label}>
                <button type="button" onClick={() => setExpanded(isOpen ? null : cat.label)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{cat.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: catColor, fontWeight: 700 }}>{cat.score}/{cat.maxScore}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: catColor, borderRadius: '99px', transition: 'width 0.8s ease' }} />
                  </div>
                </button>
                {isOpen && (
                  <ul style={{ margin: '6px 0 4px 4px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {cat.feedback.map((tip, i) => (
                      <li key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: tip.includes('✓') ? '#10b981' : '#f59e0b', flexShrink: 0 }}>{tip.includes('✓') ? '✓' : '→'}</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {total < 80 && (
        <div style={{
          marginTop: '20px', padding: '12px 16px',
          backgroundColor: 'var(--bg-alt)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border-alt)', fontSize: '0.82rem', color: 'var(--text-muted)',
        }}>
          💡 <strong style={{ color: 'var(--text)' }}>Quick win:</strong> Click any category above to see specific improvements. Aim for 80+ to pass most ATS filters automatically.
        </div>
      )}
      <style>{`@media(max-width:600px){.ats-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Skill Gap Analyzer component
// ─────────────────────────────────────────────────────────────────────────────

function SkillGapAnalyzer({ data }: { data: ResumeData }) {
  const [targetRole, setTargetRole] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const allUserSkills = [
    ...toList(data.skills),
    ...toList(data.technical_skills),
    ...toList(data.soft_skills),
  ].map(s => s.toLowerCase())

  const roleSkills = targetRole ? (JOB_ROLE_SKILLS[targetRole] ?? []) : []
  const matchedSkills = roleSkills.filter(s =>
    allUserSkills.some(u => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u))
  )
  const missingSkills = roleSkills.filter(s =>
    !allUserSkills.some(u => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u))
  )
  const matchPct = roleSkills.length > 0 ? Math.round((matchedSkills.length / roleSkills.length) * 100) : 0

  const filtered = customInput.trim().length > 0
    ? Object.keys(JOB_ROLE_SKILLS).filter(r => r.toLowerCase().includes(customInput.toLowerCase()))
    : Object.keys(JOB_ROLE_SKILLS)

  const matchColor = matchPct >= 70 ? '#10b981' : matchPct >= 40 ? '#f59e0b' : '#ef4444'
  const matchGradient = matchPct >= 70 ? 'linear-gradient(90deg,#059669,#10b981)' : matchPct >= 40 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#ef4444)'

  return (
    <div style={{
      padding: '28px', backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Skill Gap Analyzer
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Select a target role to see what you have and what to build
          </p>
        </div>
      </div>

      {/* Searchable role dropdown */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search job role (e.g. Data Scientist, Frontend Developer…)"
          value={customInput}
          onChange={e => { setCustomInput(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 'var(--radius)',
            border: '1.5px solid var(--border-alt)', backgroundColor: 'var(--bg)',
            color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'var(--font-sans)', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {showSuggestions && filtered.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
            zIndex: 20, maxHeight: '220px', overflowY: 'auto', marginTop: '4px',
          }}>
            {filtered.map(role => (
              <button key={role} type="button"
                onMouseDown={() => { setTargetRole(role); setCustomInput(role); setShowSuggestions(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 16px', border: 'none',
                  background: targetRole === role ? 'var(--accent-bg)' : 'none',
                  fontSize: '0.875rem', color: 'var(--text)', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-alt)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = targetRole === role ? 'var(--accent-bg)' : 'transparent' }}
              >{role}</button>
            ))}
          </div>
        )}
      </div>

      {/* Quick-select pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {['Software Engineer', 'Data Scientist', 'Frontend Developer', 'Data Analyst', 'Product Manager', 'DevOps Engineer'].map(role => (
          <button key={role} type="button"
            onClick={() => { setTargetRole(role); setCustomInput(role) }}
            style={{
              padding: '5px 14px', borderRadius: '999px',
              border: `1.5px solid ${targetRole === role ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: targetRole === role ? 'var(--accent-bg)' : 'var(--bg)',
              color: targetRole === role ? 'var(--accent-text)' : 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: targetRole === role ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'var(--font-sans)',
            }}
          >{role}</button>
        ))}
      </div>

      {/* Results */}
      {targetRole && roleSkills.length > 0 && (
        <div>
          {/* Match % bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                Match for <em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>{targetRole}</em>
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: matchColor }}>{matchPct}%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${matchPct}%`, background: matchGradient, borderRadius: '99px', transition: 'width 0.8s ease' }} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {matchedSkills.length} of {roleSkills.length} key skills matched
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="gap-grid">
            {/* Matched */}
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span>✅</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Skills You Have ({matchedSkills.length})
                </span>
              </div>
              {matchedSkills.length === 0
                ? <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No matching skills found yet.</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {matchedSkills.map(s => (
                      <span key={s} style={{
                        padding: '3px 10px', borderRadius: '999px',
                        backgroundColor: 'rgba(16,185,129,0.15)', color: '#059669',
                        fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)',
                      }}>{s}</span>
                    ))}
                  </div>
              }
            </div>

            {/* Missing */}
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span>🎯</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Skill Gaps ({missingSkills.length})
                </span>
              </div>
              {missingSkills.length === 0
                ? <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>🎉 You have all key skills for this role!</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {missingSkills.map(s => (
                      <span key={s} style={{
                        padding: '3px 10px', borderRadius: '999px',
                        backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626',
                        fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(239,68,68,0.25)',
                      }}>{s}</span>
                    ))}
                  </div>
              }
            </div>
          </div>

          {missingSkills.length > 0 && (
            <div style={{
              marginTop: '16px', padding: '12px 16px',
              backgroundColor: 'var(--bg-alt)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border-alt)', fontSize: '0.82rem', color: 'var(--text-muted)',
            }}>
              💡 <strong style={{ color: 'var(--text)' }}>Next step:</strong> Build projects, take courses, or earn certifications for{' '}
              <em>{missingSkills.slice(0, 3).join(', ')}{missingSkills.length > 3 ? ` and ${missingSkills.length - 3} more` : ''}</em> to close the gap and boost your match score.
            </div>
          )}
        </div>
      )}

      {!targetRole && (
        <div style={{
          textAlign: 'center', padding: '24px',
          backgroundColor: 'var(--bg-alt)', borderRadius: 'var(--radius)',
          border: '1px dashed var(--border-alt)',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Select or search a target role above to see your skill match percentage and gap analysis.
          </p>
        </div>
      )}
      <style>{`@media(max-width:600px){.gap-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const result: string[] = []
  for (const item of value) {
    if (typeof item === 'string') {
      const trimmed = item.trim()
      if (trimmed) result.push(trimmed)
    } else if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>
      const title = obj.title || obj.degree || obj.name || obj.role || obj.institution || ''
      const subtitle = obj.company || obj.field || obj.organization || ''
      const duration = obj.duration || obj.graduation_year || obj.dates || (obj.duration_months ? `${obj.duration_months} months` : '')
      const headerParts = [title, subtitle, duration].filter(Boolean)
      if (headerParts.length > 0) {
        result.push(headerParts.join(' — '))
      }
      if (obj.description && typeof obj.description === 'string') {
        result.push(`• ${obj.description}`)
      }
      if (Array.isArray(obj.technologies) && obj.technologies.length > 0) {
        result.push(`Tech Stack: ${obj.technologies.join(', ')}`)
      }
    }
  }
  return result
}

function fileExtension(filename: string): string {
  const index = filename.lastIndexOf('.')
  return index >= 0 ? filename.slice(index).toLowerCase() : ''
}

function validateResumeFile(file: File): string | null {
  const extension = fileExtension(file.name)
  if (!(RESUME_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    return 'Please upload a PDF or DOCX file.'
  }
  if (file.size === 0) {
    return 'That file appears to be empty. Please choose another resume.'
  }
  if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
    return 'This file is larger than 5 MB. Please upload a smaller PDF or DOCX.'
  }
  return null
}

function formatUploadedAt(value?: string | null): string {
  if (!value) return 'Upload time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Upload time unavailable'
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function looksLikeUrl(value: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(value) || value.includes('linkedin.com') || value.includes('github.com')
}

function hrefFor(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value.replace(/^\/\//, '')}`
}

function toUserFacingError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return 'Your session has expired. Please sign in again.'
    if (err.status === 404) return 'We could not find that resume. It may have been removed.'
    if (err.status === 413) return 'This file is larger than 5 MB. Please upload a smaller PDF or DOCX.'
    if (err.status >= 500) {
      return 'Something went wrong while processing your resume. Please try again.'
    }
    const formatted = formatErrorMessage(err)
    if (formatted && formatted.length < 280 && !/traceback|stack trace/i.test(formatted)) {
      return formatted
    }
  }
  return formatErrorMessage(err)
}

function hasAnyParsedContent(data: ResumeData | undefined | null): boolean {
  if (!data) return false
  const scalars = [
    data.full_name,
    data.email,
    data.phone,
    data.address,
    data.linkedin,
    data.github,
    data.professional_summary,
  ]
  const lists = [
    data.skills,
    data.education,
    data.work_experience,
    data.projects,
    data.certifications,
    data.internships,
    data.languages,
    data.achievements,
    data.technical_skills,
    data.soft_skills,
  ]
  return scalars.some(value => toText(value).length > 0) || lists.some(value => toList(value).length > 0)
}

export default function ResumePage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepthRef = useRef(0)

  const [resumes, setResumes] = useState<ResumeResponse[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedResume, setSelectedResume] = useState<ResumeResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // Voice Resume integration: data passed via router state from VoiceResumePage
  const voiceState = (location.state as { voiceResumeData?: ResumeData } | null)
  const [voiceResumeData] = useState<ResumeData | null>(voiceState?.voiceResumeData ?? null)
  const [showVoiceBanner, setShowVoiceBanner] = useState(!!voiceState?.voiceResumeData)

  const handleAuthFailure = useCallback(async () => {
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const loadResumes = useCallback(async (preferredId?: number | null) => {
    if (!token) return
    setListError(null)
    setListLoading(true)
    try {
      const response = await resumeApi.list(token)
      const items = response.resumes ?? []
      setResumes(items)

      if (items.length === 0) {
        setSelectedId(null)
        setSelectedResume(null)
        return
      }

      const nextId =
        preferredId && items.some(item => item.resume_id === preferredId)
          ? preferredId
          : items[0].resume_id
      setSelectedId(nextId)
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await handleAuthFailure()
        return
      }
      setListError(toUserFacingError(err))
    } finally {
      setListLoading(false)
    }
  }, [token, handleAuthFailure])

  useEffect(() => {
    void loadResumes()
  }, [loadResumes])

  useEffect(() => {
    if (!token || selectedId == null) {
      setSelectedResume(null)
      setDetailError(null)
      return
    }

    let cancelled = false

    async function loadDetail(resumeId: number, accessToken: string) {
      setDetailLoading(true)
      setDetailError(null)
      try {
        const detail = await resumeApi.getById(resumeId, accessToken)
        if (!cancelled) {
          setSelectedResume(detail)
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiRequestError && err.status === 401) {
          await handleAuthFailure()
          return
        }
        setSelectedResume(null)
        setDetailError(toUserFacingError(err))
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }

    void loadDetail(selectedId, token)
    return () => {
      cancelled = true
    }
  }, [selectedId, token, handleAuthFailure])

  const processFile = async (file: File) => {
    setStatusMessage(null)
    const validationError = validateResumeFile(file)
    if (validationError) {
      setStatusMessage({ type: 'error', text: validationError })
      return
    }
    if (!token) {
      setStatusMessage({ type: 'error', text: 'Please sign in to upload a resume.' })
      return
    }

    setUploading(true)
    try {
      const uploaded = await resumeApi.upload(file, token)
      setStatusMessage({
        type: 'success',
        text: uploaded.message || 'Resume uploaded and parsed successfully.',
      })
      setShowVoiceBanner(false)
      await loadResumes(uploaded.resume_id)
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await handleAuthFailure()
        return
      }
      setStatusMessage({ type: 'error', text: toUserFacingError(err) })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepthRef.current = 0
    setIsDragging(false)
    if (uploading) return
    const file = event.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  const isEmpty = !listLoading && resumes.length === 0 && !listError && !voiceResumeData

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>Module 01</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Resume Analysis
        </h1>
        <p className="body-md" style={{ color: 'var(--text-muted)', maxWidth: '640px' }}>
          Upload a resume to extract your profile, score ATS compatibility, and identify skill gaps
          for your target job role — so every application is grounded in your real experience.
        </p>
      </div>

      {/* Voice Resume integration banner */}
      {showVoiceBanner && voiceResumeData && (
        <div style={{
          padding: '14px 20px', marginBottom: '20px',
          backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-text)' }}>
              Voice Resume data loaded — ATS score & skill gap analysis shown below. Upload to save permanently.
            </span>
          </div>
          <button type="button" onClick={() => setShowVoiceBanner(false)}
            style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Dismiss ✕
          </button>
        </div>
      )}

      {statusMessage && (
        <AlertBanner
          type={statusMessage.type}
          text={statusMessage.text}
          onDismiss={() => setStatusMessage(null)}
        />
      )}

      {listError && (
        <AlertBanner
          type="error"
          text={listError}
          actionLabel="Try again"
          onAction={() => void loadResumes(selectedId)}
        />
      )}

      <UploadDropzone
        isDragging={isDragging}
        uploading={uploading}
        compact={!isEmpty}
        fileInputRef={fileInputRef}
        onBrowse={() => fileInputRef.current?.click()}
        onFile={file => void processFile(file)}
        onDragEnter={event => {
          event.preventDefault()
          dragDepthRef.current += 1
          setIsDragging(true)
        }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => {
          event.preventDefault()
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
          if (dragDepthRef.current === 0) setIsDragging(false)
        }}
        onDrop={event => void onDrop(event)}
      />

      {listLoading && (
        <div className="resume-loading">
          <div className="spinner" />
          <p className="body-sm">Loading your resumes…</p>
        </div>
      )}

      {isEmpty && (
        <EmptyState onUpload={() => fileInputRef.current?.click()} uploading={uploading} />
      )}

      {/* Voice Resume quick analysis (before file upload) */}
      {showVoiceBanner && voiceResumeData && !listLoading && (
        <div style={{ marginTop: '16px' }}>
          <ATSScorePanel data={voiceResumeData} />
          <div style={{ marginTop: '24px' }}>
            <SkillGapAnalyzer data={voiceResumeData} />
          </div>
        </div>
      )}

      {!listLoading && resumes.length > 0 && (
        <div className="resume-workspace">
          <aside className="resume-list-panel">
            <div className="resume-panel-header">
              <h2 className="headline-sm" style={{ fontSize: '1.2rem' }}>Your resumes</h2>
              <span className="body-sm">{resumes.length} uploaded</span>
            </div>
            <ul className="resume-list">
              {resumes.map(resume => {
                const selected = resume.resume_id === selectedId
                const previewName = toText(resume.extracted_data?.full_name)
                return (
                  <li key={resume.resume_id}>
                    <button
                      type="button"
                      className={`resume-item${selected ? ' is-selected' : ''}`}
                      onClick={() => setSelectedId(resume.resume_id)}
                    >
                      <span className="resume-item-icon" aria-hidden="true">
                        {fileExtension(resume.filename).replace('.', '').toUpperCase() || 'FILE'}
                      </span>
                      <span className="resume-item-copy">
                        <span className="resume-item-title">{resume.filename}</span>
                        <span className="resume-item-meta">
                          {previewName || 'Parsed resume'} · {formatUploadedAt(resume.uploaded_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          <section className="resume-analysis-panel">
            {detailLoading && (
              <div className="resume-loading" style={{ minHeight: '280px' }}>
                <div className="spinner" />
                <p className="body-sm">Reading the parsed resume…</p>
              </div>
            )}

            {!detailLoading && detailError && (
              <AlertBanner type="error" text={detailError} />
            )}

            {!detailLoading && !detailError && selectedResume && (
              <>
                {/* 1. Key Intelligence Features First: ATS Compatibility Score */}
                <ATSScorePanel data={selectedResume.extracted_data} />

                {/* 2. Skill Gap Analyzer for Target Roles */}
                <div style={{ marginTop: '24px' }}>
                  <SkillGapAnalyzer data={selectedResume.extracted_data} />
                </div>

                {/* 3. Full Parsed Resume Content Data */}
                <div style={{ marginTop: '32px' }}>
                  <ResumeAnalysis resume={selectedResume} onFindMatches={() => navigate('/app/internships')} />
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function UploadDropzone({
  isDragging,
  uploading,
  compact,
  fileInputRef,
  onBrowse,
  onFile,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  isDragging: boolean
  uploading: boolean
  compact: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onBrowse: () => void
  onFile: (file: File) => void
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      className={`resume-dropzone${isDragging ? ' is-active' : ''}${uploading ? ' is-disabled' : ''}${compact ? ' is-compact' : ''}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={event => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
        }}
      />
      <div className="resume-dropzone-icon" aria-hidden="true">
        {uploading ? <div className="spinner" /> : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <path d="M12 18v-6" />
            <path d="M9 15l3-3 3 3" />
          </svg>
        )}
      </div>
      <div>
        <h3 className="headline-sm" style={{ fontSize: compact ? '1.15rem' : '1.35rem', marginBottom: '6px' }}>
          {uploading ? 'Parsing your resume…' : compact ? 'Upload another resume' : 'Drop your resume here'}
        </h3>
        <p className="body-sm" style={{ maxWidth: '460px' }}>
          PDF or DOCX, up to 5 MB. We extract only what is written in the file — no invented titles or skills.
        </p>
      </div>
      <Button
        type="button"
        variant={compact ? 'outline' : 'primary'}
        size="sm"
        disabled={uploading}
        onClick={onBrowse}
      >
        {uploading ? 'Uploading…' : 'Choose file'}
      </Button>
    </div>
  )
}

function EmptyState({ onUpload, uploading }: { onUpload: () => void; uploading: boolean }) {
  return (
    <div className="resume-empty">
      <p className="label-accent" style={{ marginBottom: '10px' }}>A clearer starting point</p>
      <h2 className="headline-md" style={{ marginBottom: '12px' }}>
        No resume yet — and that is a fine place to begin.
      </h2>
      <p className="body-md" style={{ maxWidth: '520px', margin: '0 auto 24px' }}>
        Add the document you already have. We will sort the pieces so matching internships and letters
        can use your real experience, not a blank form.
      </p>
      <Button type="button" variant="primary" disabled={uploading} onClick={onUpload} showArrow>
        Upload a PDF or DOCX
      </Button>
    </div>
  )
}

function ResumeAnalysis({ resume, onFindMatches }: { resume: ResumeResponse; onFindMatches: () => void }) {
  const data = resume.extracted_data || {}
  const parsed = hasAnyParsedContent(data)
  const personalFields: Array<{ label: string; value: string; href?: string }> = [
    { label: 'Name', value: toText(data.full_name) },
    { label: 'Email', value: toText(data.email), href: toText(data.email) ? `mailto:${toText(data.email)}` : undefined },
    { label: 'Phone', value: toText(data.phone) },
    { label: 'Location', value: toText(data.address) },
    {
      label: 'LinkedIn',
      value: toText(data.linkedin),
      href: looksLikeUrl(toText(data.linkedin)) ? hrefFor(toText(data.linkedin)) : undefined,
    },
    {
      label: 'GitHub',
      value: toText(data.github),
      href: looksLikeUrl(toText(data.github)) ? hrefFor(toText(data.github)) : undefined,
    },
  ].filter(field => field.value)

  return (
    <div>
      <div className="resume-analysis-header">
        <div>
          <p className="label-accent" style={{ marginBottom: '8px' }}>Parsed analysis</p>
          <h2 className="headline-sm" style={{ fontSize: '1.55rem', marginBottom: '6px' }}>
            {toText(data.full_name) || resume.filename}
          </h2>
          <p className="body-sm">
            {resume.filename} · {formatUploadedAt(resume.uploaded_at)}
          </p>
        </div>
        <div className="resume-future-cta">
          <Button type="button" variant="outline" size="sm" onClick={onFindMatches}>
            Find matching internships
          </Button>
          <span className="body-sm">Use this resume for matching</span>
        </div>
      </div>

      {!parsed && (
        <div className="resume-empty-parse">
          <p className="body-md">
            This file was saved, but we could not extract structured sections from it.
            A clearer, text-based PDF or DOCX usually reads more completely.
          </p>
        </div>
      )}

      {parsed && (
        <div className="resume-sections">
          <AnalysisSection title="Personal information" hidden={personalFields.length === 0}>
            <div className="resume-kv-grid">
              {personalFields.map(field => (
                <div key={field.label} className="resume-kv">
                  <span className="label-sm">{field.label}</span>
                  {field.href ? (
                    <a href={field.href} target="_blank" rel="noreferrer" className="resume-link">
                      {field.value}
                    </a>
                  ) : (
                    <span className="resume-kv-value">{field.value}</span>
                  )}
                </div>
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection title="Professional summary" hidden={!toText(data.professional_summary)}>
            <p className="resume-prose">{toText(data.professional_summary)}</p>
          </AnalysisSection>

          <SkillsBlock data={data} />

          <ListSection title="Education" items={toList(data.education)} />
          <ListSection title="Work experience" items={toList(data.work_experience)} />
          <ListSection title="Projects" items={toList(data.projects)} />
          <ListSection title="Certifications" items={toList(data.certifications)} />
          <ListSection title="Internships" items={toList(data.internships)} />
          <ChipSection title="Languages" items={toList(data.languages)} />
          <ListSection title="Achievements" items={toList(data.achievements)} />
        </div>
      )}
    </div>
  )
}

function SkillsBlock({ data }: { data: ResumeData }) {
  const skills = toList(data.skills)
  const technical = toList(data.technical_skills)
  const soft = toList(data.soft_skills)
  if (skills.length === 0 && technical.length === 0 && soft.length === 0) return null

  return (
    <AnalysisSection title="Skills">
      {skills.length > 0 && (
        <div className="resume-chips" style={{ marginBottom: technical.length || soft.length ? '16px' : 0 }}>
          {skills.map(skill => (
            <span key={skill} className="skill-tag skill-tag-accent">{skill}</span>
          ))}
        </div>
      )}
      {technical.length > 0 && (
        <div style={{ marginBottom: soft.length ? '14px' : 0 }}>
          <p className="label-sm" style={{ marginBottom: '8px' }}>Technical</p>
          <div className="resume-chips">
            {technical.map(skill => (
              <span key={`tech-${skill}`} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}
      {soft.length > 0 && (
        <div>
          <p className="label-sm" style={{ marginBottom: '8px' }}>Soft skills</p>
          <div className="resume-chips">
            {soft.map(skill => (
              <span key={`soft-${skill}`} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </AnalysisSection>
  )
}

interface ResumeEntryItem {
  header: string
  details: string[]
}

function groupResumeItems(items: string[], sectionTitle?: string): ResumeEntryItem[] {
  if (!items || items.length === 0) return []

  const bulletRegex = /^([•●*▪▫►▸⁃\-\–\—]|\d+[\.\)])\s*/
  const continuationRegex = /^[a-z,;)]/
  const subDetailRegex = /^((CGPA|GPA|Grade|Score|Percentage|Tech(nologies)?|Tech Stack|Tools|Key Skills|Skills|Duration|Dates?|Timeline|Location|Role|Guide|Mentor)\b\s*[:\-])\s*/i

  const hasAnyBullets = items.some(it => bulletRegex.test(it.trim()))
  const isSimpleSection = sectionTitle && /certifications?|achievements?|awards?|languages?/i.test(sectionTitle)

  if (isSimpleSection && !hasAnyBullets) {
    return items
      .map(item => ({
        header: item.trim(),
        details: [],
      }))
      .filter(g => g.header.length > 0)
  }

  const groups: ResumeEntryItem[] = []
  let current: ResumeEntryItem | null = null

  for (const rawItem of items) {
    const item = rawItem.trim()
    if (!item) continue

    const isBulletMatch = bulletRegex.test(item)
    const cleanedText = isBulletMatch ? item.replace(bulletRegex, '').trim() : item

    if (!current) {
      current = {
        header: cleanedText,
        details: [],
      }
      continue
    }

    if (isBulletMatch) {
      current.details.push(cleanedText)
    } else if (continuationRegex.test(item)) {
      if (current.details.length > 0) {
        current.details[current.details.length - 1] += ' ' + item
      } else {
        current.header += ' ' + item
      }
    } else if (subDetailRegex.test(item)) {
      current.details.push(item)
    } else {
      if (current.details.length > 0) {
        groups.push(current)
        current = {
          header: item,
          details: [],
        }
      } else {
        const hasHeaderMarkers = /[|—–·]|\b(19|20)\d{2}\b/.test(item)
        const currentHasHeaderMarkers = /[|—–·]|\b(19|20)\d{2}\b/.test(current.header)

        if (currentHasHeaderMarkers && hasHeaderMarkers) {
          groups.push(current)
          current = { header: item, details: [] }
        } else if (currentHasHeaderMarkers && !hasHeaderMarkers) {
          current.details.push(item)
        } else {
          groups.push(current)
          current = { header: item, details: [] }
        }
      }
    }
  }

  if (current) {
    groups.push(current)
  }

  return groups
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  const groups = groupResumeItems(items, title)
  if (groups.length === 0) return null

  return (
    <AnalysisSection title={title}>
      <div className="resume-entry-group-list">
        {groups.map((group, index) => (
          <div key={`${title}-${index}`} className="resume-entry-card">
            <div className="resume-entry-card-header">
              <h4 className="resume-entry-card-title">{group.header}</h4>
            </div>
            {group.details.length > 0 && (
              <ul className="resume-entry-card-details">
                {group.details.map((detail, dIdx) => {
                  const isMeta = /^((CGPA|GPA|Grade|Score|Percentage|Tech(nologies)?|Tech Stack|Tools|Key Skills|Skills|Duration|Dates?|Timeline|Location|Role|Guide|Mentor)\b\s*[:\-])\s*/i.test(detail)
                  if (isMeta) {
                    return (
                      <li key={dIdx} className="resume-entry-card-detail-item resume-entry-meta-item">
                        <span className="resume-entry-meta-pill">{detail}</span>
                      </li>
                    )
                  }
                  return (
                    <li key={dIdx} className="resume-entry-card-detail-item">
                      {detail}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </AnalysisSection>
  )
}

function ChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <AnalysisSection title={title} hidden={items.length === 0}>
      <div className="resume-chips">
        {items.map(item => (
          <span key={item} className="skill-tag">{item}</span>
        ))}
      </div>
    </AnalysisSection>
  )
}

function AnalysisSection({
  title,
  hidden = false,
  children,
}: {
  title: string
  hidden?: boolean
  children: ReactNode
}) {
  if (hidden) return null
  return (
    <section className="resume-section">
      <h3 className="resume-section-title">{title}</h3>
      {children}
    </section>
  )
}

function AlertBanner({
  type,
  text,
  onDismiss,
  actionLabel,
  onAction,
}: {
  type: 'success' | 'error'
  text: string
  onDismiss?: () => void
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className={`resume-alert resume-alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <p>{text}</p>
      <div className="resume-alert-actions">
        {actionLabel && onAction && (
          <button type="button" className="resume-alert-btn" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {onDismiss && (
          <button type="button" className="resume-alert-btn" onClick={onDismiss} aria-label="Dismiss">
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
