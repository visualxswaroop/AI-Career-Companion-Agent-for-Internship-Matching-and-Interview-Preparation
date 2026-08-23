export default function CoverLetterPlaceholderPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>Module 03</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Personalized Cover Letter Studio
        </h1>
        <p className="body-md" style={{ color: 'var(--text-muted)' }}>
          LLM-powered cover letter synthesis tailored to your resume data and internship requirements.
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
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </div>

        <h3 className="headline-sm" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
          Interactive Cover Letter Generator
        </h3>
        <p className="body-sm" style={{ maxWidth: '440px', margin: '0 auto 20px', color: 'var(--text-muted)' }}>
          The backend Groq LLM service with authentic tone adjustment is implemented. Live document editing and export will be launched in Phase 5.
        </p>
        <span className="skill-tag skill-tag-accent">
          Upcoming Phase 5 Feature
        </span>
      </div>
    </div>
  )
}
