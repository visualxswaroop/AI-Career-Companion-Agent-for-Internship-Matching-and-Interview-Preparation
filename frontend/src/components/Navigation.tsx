import { useState } from 'react'
import { Link } from 'react-router'
import { BRAND_NAME, NAV_LINKS } from '../config'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import Button from './Button'

interface NavigationProps {
  isDark: boolean
  onThemeToggle: () => void
}

export default function Navigation({ isDark, onThemeToggle }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <div className="container">
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '60px',
            gap: '32px',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f2ee8 0%, #3114cf 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(49, 20, 207, 0.28)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.1 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    color: 'var(--text)',
                    letterSpacing: '-0.025em',
                  }}
                >
                  CareerForge
                </span>
                <span
                  style={{
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                    padding: '1px 6px',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  AI
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.01em' }}>
                Your career, spoken into shape.
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flex: 1,
            }}
            className="nav-links-desktop"
          >
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginLeft: 'auto',
            }}
          >
            <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />

            {isAuthenticated ? (
              <Link to="/app" className="nav-cta">
                <Button variant="primary" size="sm">
                  Dashboard ({user?.name.split(' ')[0] || 'App'}) →
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    fontWeight: 400,
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
                  className="nav-signin"
                >
                  Sign in
                </Link>

                <Link to="/register" className="nav-cta">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
              className="nav-hamburger"
              style={{
                display: 'none',
                width: '36px',
                height: '36px',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                flexShrink: 0,
              }}
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '16px 0 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-muted)',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'block',
                }}
              >
                {link.label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              {isAuthenticated ? (
                <Link to="/app" style={{ width: '100%' }} onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                    Dashboard →
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/register" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Responsive styles injected via style tag trick */}
      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-signin { display: none !important; }
          .nav-cta { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
