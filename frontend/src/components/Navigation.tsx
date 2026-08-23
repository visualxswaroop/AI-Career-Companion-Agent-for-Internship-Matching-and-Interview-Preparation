import { useState } from 'react'
import { BRAND_NAME, NAV_LINKS } from '../config'
import ThemeToggle from './ThemeToggle'
import Button from './Button'

interface NavigationProps {
  isDark: boolean
  onThemeToggle: () => void
}

export default function Navigation({ isDark, onThemeToggle }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

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
          <a
            href="#"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
              flexShrink: 0,
            }}
          >
            {BRAND_NAME}
          </a>

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

            <a
              href="#signin"
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
            </a>

            <Button variant="primary" size="sm" className="nav-cta">
              Get Started
            </Button>

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
              <Button variant="outline" size="sm">Sign in</Button>
              <Button variant="primary" size="sm">Get Started</Button>
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
