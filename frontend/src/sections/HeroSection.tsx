import { Link } from 'react-router'
import Button from '../components/Button'

// ─── Dashboard Mockup ────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div
      className="mockup-window animate-float"
      style={{
        width: '100%',
        maxWidth: '480px',
        fontSize: '11px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Title bar */}
      <div className="mockup-titlebar">
        <span className="mockup-dot mockup-dot-red" />
        <span className="mockup-dot mockup-dot-yellow" />
        <span className="mockup-dot mockup-dot-green" />
        <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
          Career dashboard
        </span>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', minHeight: '300px' }}>
        {/* Sidebar */}
        <div
          style={{
            width: '118px',
            flexShrink: 0,
            borderRight: '1px solid var(--sidebar-border)',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            backgroundColor: 'var(--sidebar-bg)',
            color: 'var(--sidebar-text)',
          }}
        >
          <div style={{ marginBottom: '10px', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--sidebar-active-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sidebar-active-text)', fontSize: '9px', fontWeight: 800 }}>C</div>
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '10px' }}>CareerForge</span>
            </div>
            <div style={{ color: 'var(--sidebar-text-sub)', fontSize: '8px' }}>Garima • CS Student</div>
          </div>

          {[
            { icon: '▦', label: 'Dashboard', active: true },
            { icon: '⊙', label: 'Voice Resume' },
            { icon: '◈', label: 'Search Roles' },
            { icon: '⟵', label: 'Applications' },
            { icon: '⊡', label: 'Cover Letters' },
          ].map(item => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: item.active ? 'var(--sidebar-active-bg)' : 'transparent',
                color: item.active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-sub)',
                fontSize: '10px',
                fontWeight: item.active ? 700 : 400,
                cursor: 'pointer',
                boxShadow: item.active ? '0 2px 6px rgba(0, 0, 0, 0.12)' : 'none',
              }}
            >
              <span style={{ fontSize: '9px', width: '12px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, padding: '14px 14px', overflow: 'hidden' }}>
          <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '2px', fontSize: '12px' }}>
            Good morning, Garima ✦
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '9px', marginBottom: '12px' }}>
            Here's what is happening with your profile
          </div>

          {/* Profile strength */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Profile strength</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>76%</div>
              <div className="match-bar-track" style={{ width: '60px', marginLeft: 'auto' }}>
                <div className="match-bar-fill" style={{ width: '76%' }} />
              </div>
            </div>
          </div>

          {/* Career direction */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)' }}>Career direction</span>
              <span style={{ fontSize: '9px', color: 'var(--accent)' }}>View all</span>
            </div>
            {[
              { role: 'Product Analyst', match: 83 },
              { role: 'UX Researcher', match: 76 },
              { role: 'Growth Associate', match: 65 },
            ].map(r => (
              <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>{r.role}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="match-bar-track" style={{ width: '40px' }}>
                    <div className="match-bar-fill" style={{ width: `${r.match}%` }} />
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', width: '28px', textAlign: 'right' }}>{r.match}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Application progress */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              Application progress
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: 'Applied', count: 8, color: 'var(--accent)' },
                { label: 'Interview', count: 2, color: '#4A90D9' },
                { label: 'Offered', count: 1, color: '#4CAF50' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: 'var(--surface)', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Hero Section ────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section
      id="hero"
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
            paddingTop: '80px',
            paddingBottom: '80px',
          }}
          className="hero-grid"
        >
          {/* Left — copy */}
          <div style={{ maxWidth: '520px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <p className="label-accent" style={{ margin: 0 }}>
                CareerForge AI • Career Intelligence
              </p>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-alt)',
                }}
              >
                🎙️ Voice Resume Live
              </span>
            </div>

            <h1
              className="headline-xl"
              style={{ marginBottom: '24px' }}
            >
              Your next move should feel less like a guess.
            </h1>

            <p
              className="body-lg"
              style={{ marginBottom: '36px', maxWidth: '440px' }}
            >
              Build a career plan around your strengths, speak your story into an
              executive ATS-scored resume, and find high-conviction opportunities
              tailored specifically for you.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register">
                <Button variant="primary" showArrow>
                  Get Started Free
                </Button>
              </Link>
              <a href="#voice-resume">
                <Button variant="ghost" showArrow>
                  Try Voice Resume
                </Button>
              </a>
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Annotation: strong fit */}
            <span
              className="annotation"
              style={{ top: '-8px', right: '24px', transform: 'rotate(3deg)', zIndex: 2 }}
            >
              strong fit ✓
            </span>

            <DashboardMockup />

            {/* Annotation: worth exploring */}
            <span
              className="annotation"
              style={{ bottom: '16px', left: '-8px', transform: 'rotate(-2deg)', zIndex: 2 }}
            >
              worth exploring →
            </span>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
          .hero-grid > div:first-child {
            max-width: 100% !important;
          }
        }
        @media (max-width: 600px) {
          .annotation { display: none; }
        }
      `}</style>
    </section>
  )
}
