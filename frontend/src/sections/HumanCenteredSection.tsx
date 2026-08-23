import { sampleTestimonials } from '../data/sampleData'

export default function HumanCenteredSection() {
  return (
    <>
      {/* Human centered banner */}
      <section
        id="human-centered"
        style={{
          backgroundColor: 'var(--bg-alt)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '64px 0',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '64px',
              alignItems: 'center',
            }}
            className="human-grid"
          >
            {/* Left — quote */}
            <div>
              <p className="label-accent" style={{ marginBottom: '16px' }}>Built for humans</p>
              <h2 className="headline-lg" style={{ marginBottom: '20px' }}>
                AI can suggest the path.{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  You still choose where to go.
                </em>
              </h2>
              <p className="body-lg" style={{ maxWidth: '420px' }}>
                We're not here to automate your career. We're here to make the
                path clearer — so you can move with more confidence and less
                second-guessing.
              </p>
            </div>

            {/* Right — value points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                {
                  title: 'Your data, your decisions',
                  body: 'We surface insights from your resume and preferences. The choices always stay with you.',
                },
                {
                  title: 'No black boxes',
                  body: 'When we suggest a role or flag a skill gap, we explain why — in plain language.',
                },
                {
                  title: 'No pressure, just clarity',
                  body: "You don't need to have it all figured out. Start where you are and we'll help you see the next move.",
                },
              ].map(point => (
                <div key={point.title}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        marginTop: '8px',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--text)',
                          fontSize: '0.9375rem',
                          marginBottom: '4px',
                        }}
                      >
                        {point.title}
                      </div>
                      <p className="body-sm">{point.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="section-sm"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div className="container">
          <p className="label-sm" style={{ marginBottom: '8px', textAlign: 'center' }}>
            What students say
          </p>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-subtle)',
              fontSize: '0.8125rem',
              marginBottom: '48px',
            }}
          >
            Fictional names and quotes for demonstration purposes.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
            }}
            className="testimonials-grid"
          >
            {sampleTestimonials.map(t => (
              <div
                key={t.id}
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Quote marks */}
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '3rem',
                    color: 'var(--border-alt)',
                    lineHeight: 0.8,
                    userSelect: 'none',
                  }}
                >
                  "
                </div>

                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: '0.9375rem',
                    color: 'var(--text)',
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {t.quote.replace(/^"/, '').replace(/"$/, '')}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent-text)',
                      flexShrink: 0,
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>
                      {t.name}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {t.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .human-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
