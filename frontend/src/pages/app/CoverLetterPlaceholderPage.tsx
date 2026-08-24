import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { coverLetterApi } from '../../api/coverLetter'
import { resumeApi } from '../../api/resume'
import { ApiRequestError, formatErrorMessage } from '../../api/client'
import type { CoverLetterResponse, InternshipMatch, ResumeResponse } from '../../api/types'
import Button from '../../components/Button'

interface CoverLetterLocationState {
  resumeId?: number
  internships?: InternshipMatch[]
}

export default function CoverLetterPlaceholderPage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navigationState = location.state as CoverLetterLocationState | null
  const [resumes, setResumes] = useState<ResumeResponse[]>([])
  const [internships, setInternships] = useState<InternshipMatch[]>(navigationState?.internships ?? [])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(navigationState?.resumeId ?? null)
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>(navigationState?.internships?.[0]?.internship.id ?? '')
  const [generated, setGenerated] = useState<CoverLetterResponse | null>(null)
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const accessToken = token
    let cancelled = false

    async function loadResumes() {
      setLoadingResumes(true)
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
  const selectedInternship = internships.find(match => match.internship.id === selectedInternshipId)

  const handleResumeChange = (resumeId: number) => {
    setSelectedResumeId(resumeId)
    setGenerated(null)
    setCopyStatus('idle')
    if (navigationState?.resumeId !== resumeId) {
      setInternships([])
      setSelectedInternshipId('')
    }
  }

  const generate = async () => {
    if (!token || selectedResumeId == null || !selectedInternshipId) return
    setGenerating(true)
    setError(null)
    setCopyStatus('idle')
    try {
      const response = await coverLetterApi.generate({
        resume_id: selectedResumeId,
        internship_id: selectedInternshipId,
      }, token)
      setGenerated(response)
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await logout()
        navigate('/login', { replace: true })
        return
      }
      setError(formatErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const copyLetter = async () => {
    if (!generated?.cover_letter) return
    try {
      await navigator.clipboard.writeText(generated.cover_letter)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>Module 03</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>Personalized Cover Letter Studio</h1>
        <p className="body-md" style={{ color: 'var(--text-muted)', maxWidth: '680px' }}>
          Generate a grounded letter using your resume and a matched internship.
        </p>
      </div>

      {error && (
        <div className="resume-empty-parse" style={{ marginBottom: '20px' }}>
          <p className="body-md">{error}</p>
        </div>
      )}

      <section className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          <div>
            <label htmlFor="cover-letter-resume" className="label-sm">Use resume</label>
            {loadingResumes ? (
              <p className="body-sm" style={{ marginTop: '8px' }}>Loading your resumes…</p>
            ) : resumes.length === 0 ? (
              <p className="body-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Upload a resume to begin.</p>
            ) : (
              <select
                id="cover-letter-resume"
                value={selectedResumeId ?? ''}
                onChange={event => handleResumeChange(Number(event.target.value))}
                style={{ width: '100%', marginTop: '8px', padding: '11px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', font: 'inherit' }}
              >
                {resumes.map(resume => <option key={resume.resume_id} value={resume.resume_id}>{resume.filename}</option>)}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="cover-letter-internship" className="label-sm">Use matched internship</label>
            {internships.length === 0 ? (
              <p className="body-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Find matches first to choose an internship.</p>
            ) : (
              <select
                id="cover-letter-internship"
                value={selectedInternshipId}
                onChange={event => {
                  setSelectedInternshipId(event.target.value)
                  setGenerated(null)
                  setCopyStatus('idle')
                }}
                style={{ width: '100%', marginTop: '8px', padding: '11px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', font: 'inherit' }}
              >
                {internships.map(match => <option key={match.internship.id} value={match.internship.id}>{match.internship.role_title} · {match.internship.company}</option>)}
              </select>
            )}
          </div>
        </div>
        {selectedResume && selectedInternship && (
          <p className="body-sm" style={{ marginTop: '14px', color: 'var(--text-muted)' }}>
            {selectedResume.filename} → {selectedInternship.internship.role_title} at {selectedInternship.internship.company}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button type="button" variant="primary" disabled={generating || loadingResumes || selectedResumeId == null || !selectedInternshipId} onClick={() => void generate()}>
            {generating ? 'Generating letter…' : 'Generate cover letter'}
          </Button>
        </div>
      </section>

      {!generated && !loadingResumes && (resumes.length === 0 || internships.length === 0) && (
        <div className="resume-empty">
          <p className="label-accent" style={{ marginBottom: '10px' }}>One step before the letter</p>
          <h2 className="headline-md" style={{ marginBottom: '12px' }}>Choose a resume and matched role.</h2>
          <p className="body-md" style={{ maxWidth: '520px', margin: '0 auto 20px' }}>
            Cover letters are generated from real resume data and internship matches, so there is no generic sample text here.
          </p>
          <Link to="/app/internships"><Button type="button" variant="outline" size="sm">Find internship matches</Button></Link>
        </div>
      )}

      {generated && (
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <p className="label-accent" style={{ marginBottom: '6px' }}>{generated.generation_method === 'llm' ? 'Generated with Groq' : 'Generated locally'}</p>
              <h2 className="headline-sm" style={{ fontSize: '1.35rem', marginBottom: '4px' }}>{generated.role_title}</h2>
              <p className="body-sm">{generated.company}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyLetter()}>
              {copyStatus === 'copied' ? 'Copied' : 'Copy letter'}
            </Button>
          </div>
          {copyStatus === 'error' && <p className="body-sm" style={{ color: 'var(--accent-text)', marginBottom: '12px' }}>Copy failed. Please select the letter text manually.</p>}
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            {generated.cover_letter}
          </div>
        </section>
      )}
    </div>
  )
}
