export default function InternshipsPlaceholderPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>Module 02</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Internship Opportunity Matching
        </h1>
        <p className="body-md" style={{ color: 'var(--text-muted)' }}>
          High-dimensional vector search powered by Sentence Transformers and FAISS.
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <h3 className="headline-sm" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
          Semantic Internship Discovery
        </h3>
        <p className="body-sm" style={{ maxWidth: '440px', margin: '0 auto 20px', color: 'var(--text-muted)' }}>
          The backend FAISS index and LLM re-ranker are fully calibrated. Interactive role cards and filtering will be connected in Phase 4.
        </p>
        <span className="skill-tag skill-tag-accent">
          Upcoming Phase 4 Feature
        </span>
      </div>
    </div>
  )
}
