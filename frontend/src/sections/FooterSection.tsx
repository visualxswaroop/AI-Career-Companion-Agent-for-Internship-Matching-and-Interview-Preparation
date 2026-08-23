import { BRAND_NAME, NAV_LINKS } from '../config'

const footerColumns = [
  {
    title: 'Product',
    links: NAV_LINKS.map(l => ({ label: l.label, href: l.href })),
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Blog', href: '#blog' },
      { label: 'Careers', href: '#careers' },
      { label: 'Press', href: '#press' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#help' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Contact', href: '#contact' },
    ],
  },
]

export default function FooterSection() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-alt)',
        borderTop: '1px solid var(--border)',
        padding: '64px 0 40px',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr repeat(3, 1fr)',
            gap: '48px',
            marginBottom: '48px',
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text)',
                letterSpacing: '-0.01em',
                marginBottom: '12px',
              }}
            >
              {BRAND_NAME}
            </div>
            <p
              className="body-sm"
              style={{ maxWidth: '220px', marginBottom: '20px' }}
            >
              Career intelligence for students and early-career professionals.
            </p>
            <p className="body-sm" style={{ color: 'var(--text-subtle)' }}>
              A demonstration project.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map(col => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                {col.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                      transition: 'color 0.15s ease',
                      display: 'block',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p className="body-sm" style={{ color: 'var(--text-subtle)' }}>
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
          <p className="body-sm" style={{ color: 'var(--text-subtle)' }}>
            Built with FastAPI + React
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
