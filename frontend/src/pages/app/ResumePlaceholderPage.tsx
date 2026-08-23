export default function ResumePlaceholderPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>Module 01</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Resume Parsing & Extraction
        </h1>
        <p className="body-md" style={{ color: 'var(--text-muted)' }}>
          Deep document analysis powered by spaCy and structured resume extraction.
        </p>
      </div>

      <div
        className="card"
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-alt)',
          borderStyle: 'dashed',
          borderWidth: '2px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>

        <h3 className="headline-sm" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
          Resume Upload & Analysis Module
        </h3>
        <p className="body-sm" style={{ maxWidth: '440px', margin: '0 auto 20px', color: 'var(--text-muted)' }}>
          The backend pipeline with PDF/DOCX parsing, entity extraction, and skills taxonomy is ready. Frontend upload interface will be enabled in Phase 3.
        </p>
        <span className="skill-tag skill-tag-accent">
          Upcoming Phase 3 Feature
        </span>
      </div>
    </div>
  )
}
