import { useState } from 'react'
import { Link } from 'react-router'
import { NAV_LINKS } from '../config'
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
            <img
              src="/logo.png"
              alt="AI-Career Companion Agent"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
              }}
            />
            <div style={{ lineHeight: 1.2 }}>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  letterSpacing: '-0.01em',
                }}
              >
                AI-Career Companion Agent
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  letterSpacing: '0em',
                }}
              >
                for Internship Matching &amp; Interview Preparation
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
