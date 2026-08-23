import { Link } from 'react-router'
import Button from '../components/Button'

export default function FinalCTASection() {
  return (
    <section
      id="get-started"
      style={{
        backgroundColor: 'var(--accent)',
        padding: '96px 0',
      }}
    >
      <div className="container">
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4.5vw, 3.6rem)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#fff',
              marginBottom: '20px',
            }}
          >
            You don't need your whole career figured out.
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '40px',
              lineHeight: 1.3,
            }}
          >
            Just a clearer next step.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link to="/register">
              <button
                style={{
                  padding: '14px 32px',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  backgroundColor: '#fff',
                  color: 'var(--accent)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = ''
                }}
              >
                Start building your path →
              </button>
            </Link>
          </div>

          <p
            style={{
              marginTop: '24px',
              fontSize: '0.8125rem',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Free to start. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}

// Separate smaller CTA that can be embedded mid-page
export function InlineCTA() {
  return (
    <div
      style={{
        padding: '40px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          fontWeight: 500,
          color: 'var(--text)',
          lineHeight: 1.2,
        }}
      >
        Ready to find your next move?
      </h3>
      <Link to="/register">
        <Button variant="primary" showArrow>
          Get started — it's free
        </Button>
      </Link>
    </div>
  )
}
