import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode, type RefObject } from 'react'
import { useNavigate } from 'react-router'
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

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
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

  const isEmpty = !listLoading && resumes.length === 0 && !listError

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>Module 01</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Resume Analysis
        </h1>
        <p className="body-md" style={{ color: 'var(--text-muted)', maxWidth: '640px' }}>
          Upload a resume and we will read what is actually on the page — names, skills, history —
          so the next steps can be grounded in your experience, not a generic template.
        </p>
      </div>

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
              <ResumeAnalysis resume={selectedResume} onFindMatches={() => navigate('/app/internships')} />
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

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <AnalysisSection title={title} hidden={items.length === 0}>
      <ul className="resume-entry-list">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="resume-entry">
            {item}
          </li>
        ))}
      </ul>
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
