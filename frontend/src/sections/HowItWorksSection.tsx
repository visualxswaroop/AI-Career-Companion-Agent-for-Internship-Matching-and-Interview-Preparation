const steps = [
  {
    number: '01',
    title: 'Understand your resume',
    description:
      'AI-assisted tools for resume breakdown that lay your resume to life and create your resume profile.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Find internships that fit',
    description:
      'Personalised internship matching based on your internship matching, homed around and focused on your skills and interests.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Write applications without sounding robotic',
    description:
      'Generate tailored cover letters for a signed generate tailored letters and create machert cover letters armcatans.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Know what to improve next',
    description:
      'Provides skill recommendations and providing skill recommendations to custom increment interests and skills recommendations.',
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
