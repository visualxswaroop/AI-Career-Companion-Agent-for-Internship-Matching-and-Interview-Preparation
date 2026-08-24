import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { resumeApi } from '../../api/resume'
import { ApiRequestError, formatErrorMessage } from '../../api/client'
import type { InternshipMatch, ResumeResponse } from '../../api/types'
import Button from '../../components/Button'

function formatScore(value?: number | null): string {
  return value == null ? '—' : `${Math.round(value * 100)}%`
}

export default function InternshipsPlaceholderPage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<ResumeResponse[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [matches, setMatches] = useState<InternshipMatch[]>([])
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [matching, setMatching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const accessToken = token
    let cancelled = false

    async function loadResumes() {
      setLoadingResumes(true)
      setError(null)
      try {
        const response = await resumeApi.list(accessToken)
        if (cancelled) return
        const items = response.resumes ?? []
        setResumes(items)
        setSelectedResumeId(current => current ?? items[0]?.resume_id ?? null)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiRequestError && err.status === 401) {
          await logout()
          navigate('/login', { replace: true })
          return
        }
        setError(formatErrorMessage(err))
      } finally {
        if (!cancelled) setLoadingResumes(false)
      }
    }

    void loadResumes()
    return () => {
      cancelled = true
    }
  }, [token, logout, navigate])

  const selectedResume = resumes.find(resume => resume.resume_id === selectedResumeId)

  const findMatches = async () => {
    if (!token || selectedResumeId == null) return
    setMatching(true)
    setError(null)
    try {
      const response = await resumeApi.matchInternships(selectedResumeId, token)
      setMatches(response.results ?? [])
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await logout()
        navigate('/login', { replace: true })
        return
      }
      setError(formatErrorMessage(err))
    } finally {
      setMatching(false)
    }
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>Module 02</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>Internship Opportunity Matching</h1>
        <p className="body-md" style={{ color: 'var(--text-muted)', maxWidth: '680px' }}>
          Find roles ranked against the skills and experience in your parsed resume.
        </p>
      </div>

      {error && (
        <div className="resume-empty-parse" style={{ marginBottom: '20px' }}>
          <p className="body-md">{error}</p>
        </div>
      )}

      <section className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '240px', flex: 1 }}>
            <label htmlFor="matching-resume" className="label-sm">Match using resume</label>
            {loadingResumes ? (
              <p className="body-sm" style={{ marginTop: '8px' }}>Loading your resumes…</p>
            ) : resumes.length === 0 ? (
              <p className="body-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                Upload a resume before searching for internships.
              </p>
            ) : (
              <select
                id="matching-resume"
                value={selectedResumeId ?? ''}
                onChange={event => {
                  setSelectedResumeId(Number(event.target.value))
                  setMatches([])
                }}
                style={{ width: '100%', marginTop: '8px', padding: '11px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', font: 'inherit' }}
              >
                {resumes.map(resume => (
                  <option key={resume.resume_id} value={resume.resume_id}>{resume.filename}</option>
                ))}
              </select>
            )}
          </div>
          <Button type="button" variant="primary" disabled={matching || loadingResumes || selectedResumeId == null} onClick={() => void findMatches()}>
            {matching ? 'Finding matches…' : 'Find matching internships'}
          </Button>
        </div>
        {selectedResume && (
          <p className="body-sm" style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
            Using {selectedResume.filename} · {selectedResume.extracted_data?.skills?.length ?? 0} parsed skills
          </p>
        )}
      </section>

      {matching && (
        <div className="resume-loading" style={{ minHeight: '180px' }}>
          <div className="spinner" />
          <p className="body-sm">Ranking opportunities against your resume…</p>
        </div>
      )}

      {!matching && matches.length === 0 && resumes.length > 0 && (
        <div className="resume-empty">
          <p className="label-accent" style={{ marginBottom: '10px' }}>Ready when you are</p>
          <h2 className="headline-md" style={{ marginBottom: '12px' }}>Start with your strongest resume.</h2>
          <p className="body-md" style={{ maxWidth: '520px', margin: '0 auto' }}>
            We will combine semantic similarity with skill overlap and explain where each role fits.
          </p>
        </div>
      )}

      {!matching && matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {matches.map(match => {
            const internship = match.internship
            const explanation = match.explanation
            const analysis = match.skill_analysis
            return (
              <article key={internship.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <p className="label-accent" style={{ marginBottom: '6px' }}>Match #{match.rank} · {explanation?.match_rating || 'Recommended'}</p>
                    <h2 className="headline-sm" style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{internship.role_title}</h2>
                    <p className="body-sm">{internship.company} · {internship.location} · {internship.mode}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="label-sm">Match score</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
                      {formatScore(match.adjusted_similarity_score ?? match.similarity_score)}
                    </div>
                  </div>
                </div>
                <p className="body-sm" style={{ margin: '16px 0', color: 'var(--text-muted)' }}>{internship.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {internship.required_skills.map(skill => <span key={skill} className="skill-tag skill-tag-accent">{skill}</span>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div><span className="label-sm">Required skills</span><p className="body-sm">{analysis?.required_skills_matched ?? 0}/{analysis?.required_skills_total ?? internship.required_skills.length} matched</p></div>
                  <div><span className="label-sm">Stipend</span><p className="body-sm">₹{internship.stipend_inr_per_month.toLocaleString()}/month</p></div>
                  <div><span className="label-sm">Duration</span><p className="body-sm">{internship.duration_weeks} weeks</p></div>
                  {analysis?.skill_gap && analysis.skill_gap.length > 0 && <div><span className="label-sm">Skill gap</span><p className="body-sm">{analysis.skill_gap.join(', ')}</p></div>}
                </div>
                {explanation?.recommendation_summary && (
                  <p className="body-sm" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    {explanation.recommendation_summary}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/app/cover-letters', {
                      state: { resumeId: selectedResumeId, internships: matches },
                    })}
                  >
                    Write a cover letter
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
