import { Link } from 'react-router'
import Button from '../components/Button'

export default function FinalCTASection() {
  return (
    <section
      id="get-started"
      style={{
        background: 'linear-gradient(135deg, #3114cf 0%, #1c0a85 100%)',
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
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2rem, 4.5vw, 3.6rem)',
              fontWeight: 700,
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
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
              color: 'rgba(255,255,255,0.85)',
              marginBottom: '40px',
              lineHeight: 1.3,
            }}
          >
            Just a clearer next step, forged with AI.
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
                  padding: '14px 34px',
                  borderRadius: 'var(--radius-pill)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  backgroundColor: '#fff',
                  color: '#3114cf',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 10px 28px rgba(0,0,0,0.25)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.18)'
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
