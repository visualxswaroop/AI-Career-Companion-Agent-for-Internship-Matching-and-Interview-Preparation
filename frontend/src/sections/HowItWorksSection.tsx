const steps = [
  {
    number: '01',
    title: 'Speak or Upload Your Resume',
    description:
      'Answer conversational voice prompts to generate an executive resume from scratch, or upload an existing PDF for AI parsing.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Discover High-Match Roles',
    description:
      'Intelligent TF-IDF and LLaMA ranking scores live internships against your actual skills and projects.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Tailor Cover Letters & Answers',
    description:
      'Generate company-specific cover letters and interview talking points grounded in your genuine background.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'AI Mock Interviews & Next Steps',
    description:
      'Simulate technical and behavioral interviews with real-time feedback and actionable skill gap recommendations.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
        <polyline points="16,7 22,7 22,13" />
      </svg>
    ),
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section" style={{ backgroundColor: 'var(--bg-alt)' }}>
      <div className="container">
        {/* Section header */}
        <div
          style={{
            maxWidth: '640px',
            marginBottom: '64px',
          }}
        >
          <p className="label-sm" style={{ marginBottom: '16px' }}>The journey</p>
          <h2 className="headline-lg">
            From{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              'I don't know what to apply for'
            </em>{' '}
            to{' '}
            <span style={{ color: 'var(--accent)' }}>
              'I know my next step.'
            </span>
          </h2>
        </div>

        {/* Steps grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '32px',
          }}
          className="steps-grid"
        >
          {steps.map(step => (
            <div
              key={step.number}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  marginBottom: '4px',
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>

              {/* Number + title */}
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {step.number} —
                </span>
                <h3
                  className="headline-sm"
                  style={{ marginTop: '4px', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-sans)' }}
                >
                  {step.title}
                </h3>
              </div>

              <p className="body-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; }
        }
        @media (max-width: 520px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
