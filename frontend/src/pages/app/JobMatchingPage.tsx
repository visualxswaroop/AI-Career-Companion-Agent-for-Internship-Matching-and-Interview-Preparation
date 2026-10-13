import { useState, useEffect, useMemo } from 'react'
import { resumeApi } from '../../api/resume'
import internshipsDataRaw from '../../data/internships.json'

interface InternshipItem {
  id: string
  company: string
  role_title: string
  domain: string
  location: string
  mode: string
  duration_weeks: number
  stipend_inr_per_month: number
  min_education: string
  required_skills: string[]
  preferred_skills: string[]
  description: string
}

const internshipsData = internshipsDataRaw as InternshipItem[]

function ScoreBadge({ score, size = 68 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? '#10B981' : score >= 45 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', lineHeight: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color, fontFamily: 'var(--font-sans)' }}>
          {score}%
        </div>
        <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Match
        </div>
      </div>
    </div>
  )
}

interface MatchResult {
  rank: number
  internship: InternshipItem
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  matchedPreferred: string[]
  fitReasoning: string
}

export default function JobMatchingPage() {
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('All')
  const [selectedMode, setSelectedMode] = useState('All')
  const [sortBy, setSortBy] = useState<'match' | 'stipend' | 'duration'>('match')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadCandidateResumes() {
      setLoadingResumes(true)
      const storedId = localStorage.getItem('cc_selected_resume_id')
      const storedData = localStorage.getItem('cc_active_resume_data')
      let fallbackData: any = null
      if (storedData) {
        try { fallbackData = JSON.parse(storedData) } catch {}
      }

      try {
        const d = await resumeApi.list()
        const list = d.resumes || []
        if (list.length > 0) {
          const targetId = storedId ? Number(storedId) : list[0].resume_id
          const found = list.find(r => r.resume_id === targetId) || list[0]
          setSelectedResumeId(found.resume_id)

          // Load full parsed details if missing or empty
          if (!found.extracted_data || Object.keys(found.extracted_data).length === 0 || (!found.extracted_data.skills && !found.extracted_data.technical_skills)) {
            try {
              const full = await resumeApi.getById(found.resume_id)
              found.extracted_data = full.extracted_data
              if (full.extracted_data) {
                localStorage.setItem('cc_active_resume_data', JSON.stringify(full.extracted_data))
              }
            } catch {}
          }
          setResumes(list)
        } else if (fallbackData) {
          setResumes([{ resume_id: 1, filename: 'Parsed Resume', extracted_data: fallbackData }])
          setSelectedResumeId(1)
        }
      } catch {
        if (fallbackData) {
          setResumes([{ resume_id: 1, filename: 'Parsed Resume', extracted_data: fallbackData }])
          setSelectedResumeId(1)
        } else {
          setError('Could not retrieve candidate resumes. Please upload a resume in Resume Parser and Analysis.')
        }
      } finally {
        setLoadingResumes(false)
      }
    }

    loadCandidateResumes()
  }, [])

  // Sync selected resume ID and fetch full details when user switches resume
  const handleSelectResume = async (newId: number) => {
    setSelectedResumeId(newId)
    localStorage.setItem('cc_selected_resume_id', String(newId))
    const curr = resumes.find(r => r.resume_id === newId)
    if (curr && (!curr.extracted_data || Object.keys(curr.extracted_data).length === 0 || (!curr.extracted_data.skills && !curr.extracted_data.technical_skills))) {
      try {
        const full = await resumeApi.getById(newId)
        setResumes(prev => prev.map(r => r.resume_id === newId ? { ...r, extracted_data: full.extracted_data } : r))
        if (full.extracted_data) {
          localStorage.setItem('cc_active_resume_data', JSON.stringify(full.extracted_data))
        }
      } catch {}
    } else if (curr?.extracted_data) {
      localStorage.setItem('cc_active_resume_data', JSON.stringify(curr.extracted_data))
    }
  }

  const currentResume = useMemo(() => {
    const found = resumes.find(r => r.resume_id === selectedResumeId) || resumes[0] || null
    if (!found) {
      const stored = localStorage.getItem('cc_active_resume_data')
      if (stored) {
        try {
          return { resume_id: 1, filename: 'Parsed Resume', extracted_data: JSON.parse(stored) }
        } catch {}
      }
    }
    return found
  }, [resumes, selectedResumeId])

  // Extract resume profile data
  const candidateProfile = useMemo(() => {
    if (!currentResume) return null
    const data = currentResume.extracted_data || {}
    const rawSkills: string[] = [
      ...(Array.isArray(data.skills) ? data.skills : []),
      ...(Array.isArray(data.technical_skills) ? data.technical_skills : []),
      ...(Array.isArray(data.soft_skills) ? data.soft_skills : []),
    ]
    const skills = Array.from(new Set(rawSkills.map(s => String(s).trim()).filter(Boolean)))
    const summary = String(data.professional_summary || '')
    const expCount = Array.isArray(data.work_experience) ? data.work_experience.length : 0
    const projCount = Array.isArray(data.projects) ? data.projects.length : 0
    const eduList = Array.isArray(data.education) ? data.education : []
    const fullName = data.full_name || currentResume.filename || 'Candidate'

    return {
      fullName,
      skills,
      summary,
      expCount,
      projCount,
      eduList,
      filename: currentResume.filename,
    }
  }, [currentResume])

  // Compute matches against the JSON dataset
  const matchResults: MatchResult[] = useMemo(() => {
    if (!candidateProfile) return []

    const candidateSkillsLower = candidateProfile.skills.map(s => s.toLowerCase())
    const summaryLower = candidateProfile.summary.toLowerCase()

    const results: MatchResult[] = internshipsData.map(job => {
      const required = job.required_skills || []
      const preferred = job.preferred_skills || []

      // Skill matches
      const matchedSkills = required.filter(skill => {
        const sLower = skill.toLowerCase()
        return candidateSkillsLower.some(cs => cs.includes(sLower) || sLower.includes(cs))
      })

      const missingSkills = required.filter(skill => !matchedSkills.includes(skill))

      const matchedPreferred = preferred.filter(skill => {
        const sLower = skill.toLowerCase()
        return candidateSkillsLower.some(cs => cs.includes(sLower) || sLower.includes(cs))
      })

      // Required skills score component (up to 70 pts)
      let requiredScore = 0
      if (required.length > 0) {
        requiredScore = (matchedSkills.length / required.length) * 70
      } else {
        requiredScore = 50
      }

      // Preferred skills score component (up to 15 pts)
      let prefScore = 0
      if (preferred.length > 0) {
        prefScore = (matchedPreferred.length / preferred.length) * 15
      } else {
        prefScore = 10
      }

      // Domain & title affinity bonus (up to 15 pts)
      let domainBonus = 0
      const titleWords = job.role_title.toLowerCase().split(/\s+/)
      const domainWords = job.domain.toLowerCase().split(/\s+/)
      const hasTitleOverlap = titleWords.some(w => w.length > 3 && (summaryLower.includes(w) || candidateSkillsLower.some(cs => cs.includes(w))))
      const hasDomainOverlap = domainWords.some(w => w.length > 3 && (summaryLower.includes(w) || candidateSkillsLower.some(cs => cs.includes(w))))

      if (hasTitleOverlap) domainBonus += 10
      if (hasDomainOverlap) domainBonus += 5

      const rawScore = Math.min(100, Math.round(requiredScore + prefScore + domainBonus))
      const matchScore = Math.max(15, rawScore)

      // Fit reasoning
      let fitReasoning = ''
      if (matchedSkills.length > 0) {
        fitReasoning = `Direct skill match on ${matchedSkills.slice(0, 3).join(', ')}. Aligns with ${job.domain} requirements.`
      } else {
        fitReasoning = `Foundational match for ${job.role_title}. Recommended to acquire key skills: ${required.slice(0, 2).join(', ')}.`
      }

      return {
        rank: 0,
        internship: job,
        matchScore,
        matchedSkills,
        missingSkills,
        matchedPreferred,
        fitReasoning,
      }
    })

    // Sort by match score descending initially
    results.sort((a, b) => b.matchScore - a.matchScore)

    // Assign rank
    results.forEach((item, index) => {
      item.rank = index + 1
    })

    return results
  }, [candidateProfile])

  // Extract distinct domains for filter
  const domains = useMemo(() => {
    const set = new Set<string>()
    internshipsData.forEach(i => {
      if (i.domain) set.add(i.domain)
    })
    return ['All', ...Array.from(set).sort()]
  }, [])

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    return matchResults
      .filter(item => {
        if (selectedDomain !== 'All' && item.internship.domain !== selectedDomain) {
          return false
        }
        if (selectedMode !== 'All' && item.internship.mode.toLowerCase() !== selectedMode.toLowerCase()) {
          return false
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchesTitle = item.internship.role_title.toLowerCase().includes(q)
          const matchesCompany = item.internship.company.toLowerCase().includes(q)
          const matchesLocation = item.internship.location.toLowerCase().includes(q)
          const matchesSkill = item.internship.required_skills.some(s => s.toLowerCase().includes(q))
          if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesSkill) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'stipend') {
          return b.internship.stipend_inr_per_month - a.internship.stipend_inr_per_month
        }
        if (sortBy === 'duration') {
          return a.internship.duration_weeks - b.internship.duration_weeks
        }
        return b.matchScore - a.matchScore
      })
  }, [matchResults, selectedDomain, selectedMode, searchQuery, sortBy])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>
            Semantic Dataset Matcher
          </span>
          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 600 }}>
            {internshipsData.length} Opportunities
          </span>
        </div>
        <h1 style={{ fontSize: '1.95rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          Job Matching
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
          Directly matches verified internship listings from project records with your parsed resume profile and detected skills.
        </p>
      </div>

      {/* Active Resume Bar & Switcher */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          marginBottom: '22px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Active Parsed Resume
            </div>
            {candidateProfile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
                  {candidateProfile.fullName}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  {candidateProfile.skills.length} skills identified
                </span>
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {loadingResumes ? 'Loading candidate profile...' : 'No resume uploaded yet.'}
              </span>
            )}
          </div>

          {resumes.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Switch Resume:
              </label>
              <select
                value={selectedResumeId || ''}
                onChange={e => handleSelectResume(Number(e.target.value))}
                style={{
                  height: '36px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  padding: '0 10px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {resumes.map(r => (
                  <option key={r.resume_id} value={r.resume_id}>
                    {r.filename}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {candidateProfile && candidateProfile.skills.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Detected Skills Considered for Matching:
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxHeight: '58px', overflowY: 'auto' }}>
              {candidateProfile.skills.slice(0, 18).map(skill => (
                <span
                  key={skill}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontWeight: 500,
                  }}
                >
                  {skill}
                </span>
              ))}
              {candidateProfile.skills.length > 18 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', paddingLeft: '4px' }}>
                  +{candidateProfile.skills.length - 18} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by role title, company, location, or skill..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                padding: '0 14px',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
              aria-label="Filter by Domain"
              style={{
                height: '40px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                padding: '0 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Domains</option>
              {domains.filter(d => d !== 'All').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value)}
              aria-label="Filter by Work Mode"
              style={{
                height: '40px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                padding: '0 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Sort Results"
              style={{
                height: '40px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                padding: '0 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <option value="match">Sort: Match Score</option>
              <option value="stipend">Sort: Highest Stipend</option>
              <option value="duration">Sort: Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Results summary stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <div>
            Showing <strong style={{ color: 'var(--text)' }}>{filteredResults.length}</strong> matching positions from database
          </div>
          {matchResults.length > 0 && (
            <div>
              Top Match: <strong style={{ color: '#10B981' }}>{matchResults[0].matchScore}%</strong>
            </div>
          )}
        </div>
      </div>

      {/* Match Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredResults.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '6px' }}>
              No matches found
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
              Try adjusting your search query, selecting "All Domains", or reviewing your parsed resume skills.
            </p>
          </div>
        ) : (
          filteredResults.map(item => {
            const { internship, matchScore, matchedSkills, missingSkills, fitReasoning } = item
            const isExpanded = expandedId === internship.id

            return (
              <div
                key={internship.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Main Card Header / Summary Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : internship.id)}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {/* Circular Score Gauge */}
                  <ScoreBadge score={matchScore} size={64} />

                  {/* Title & Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: item.rank <= 3 ? 'var(--accent)' : 'var(--bg)',
                          color: item.rank <= 3 ? '#FFFFFF' : 'var(--text-muted)',
                        }}
                      >
                        Rank #{item.rank}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {internship.domain}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {internship.role_title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {internship.company}
                      </span>
                      <span>
                        {internship.location}
                      </span>
                      <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                        {internship.mode}
                      </span>
                      <span>
                        Duration: {internship.duration_weeks} wks
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        ₹{internship.stipend_inr_per_month.toLocaleString()}/mo
                      </span>
                    </div>

                    {/* Matched skills pill preview */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {matchedSkills.slice(0, 4).map(skill => (
                        <span
                          key={skill}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10B981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {skill}
                        </span>
                      ))}

                      {missingSkills.slice(0, 2).map(skill => (
                        <span
                          key={skill}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#EF4444',
                          }}
                        >
                          Need: {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Accordion Toggle Icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '20px 24px',
                      borderTop: '1px solid var(--border)',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    {/* Fit Analysis Highlight */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', marginBottom: '4px' }}>
                        Match Analysis
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>
                        {fitReasoning}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      {/* Matched skills detailed */}
                      <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Matched Requirements ({matchedSkills.length})
                        </div>
                        {matchedSkills.length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None directly detected in resume skills</div>
                        ) : (
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {matchedSkills.map(s => (
                              <span key={s} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Missing skills detailed */}
                      <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Missing Requirements ({missingSkills.length})
                        </div>
                        {missingSkills.length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: '#10B981' }}>All required skills satisfied</div>
                        ) : (
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {missingSkills.map(s => (
                              <span key={s} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Description */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Role Description &amp; Qualifications
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                        {internship.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div>
                        Minimum Education: <strong style={{ color: 'var(--text)' }}>{internship.min_education}</strong>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        Listing ID: {internship.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
