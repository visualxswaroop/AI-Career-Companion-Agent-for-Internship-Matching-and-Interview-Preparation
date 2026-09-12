import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { BRAND_NAME } from '../config'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import CareerAssistantWidget from './career-assistant/CareerAssistantWidget'

interface AppShellProps {
  isDark: boolean
  onThemeToggle: () => void
}

export default function AppShell({ isDark, onThemeToggle }: AppShellProps) {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cc_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('cc_sidebar_collapsed', String(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    {
      to: '/app',
      end: true,
      label: 'Overview',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      to: '/app/resume',
      end: false,
      label: 'Resume Analysis',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      to: '/app/internships',
      end: false,
      label: 'Internships',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      to: '/app/cover-letters',
      end: false,
      label: 'Cover Letters',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      ),
    },
    {
      to: '/app/interview-agent',
      end: false,
      label: 'Interview Agent',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      ),
    },
    {
      to: '/app/voice-resume',
      end: false,
      label: 'Voice Resume',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <path d="M9 22h6" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      to: '/app/profile',
      end: false,
      label: 'Profile & Settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: isSidebarCollapsed ? '72px' : '280px',
          flexShrink: 0,
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          transition: 'width 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          zIndex: 40,
        }}
        className="app-sidebar-desktop"
      >
        {/* Brand & Collapse Toggle */}
        <div
          style={{
            padding: isSidebarCollapsed ? '20px 12px' : '16px 18px',
            borderBottom: '1px solid var(--sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
            gap: '8px',
            minHeight: '88px',
          }}
        >
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
              {/* Professional Logo Emblem */}
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  flexShrink: 0,
                  marginTop: '2px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                }}
              />

              {/* Stacked product name — intentional multi-line design */}
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.005em',
                  }}
                >
                  AI-Career Companion Agent
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.62rem',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.60)',
                    marginTop: '2px',
                    lineHeight: 1.3,
                    letterSpacing: '0em',
                  }}
                >
                  for Internship Matching &amp;
                  <br />Interview Preparation
                </div>
              </div>
            </div>
          )}

          {isSidebarCollapsed && (
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '7px',
                objectFit: 'contain',
                flexShrink: 0,
                marginBottom: '4px',
              }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sidebar-text-sub)',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#FFFFFF'
                e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-text-sub)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {isSidebarCollapsed ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7" />
                  <polyline points="18 17 13 12 18 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Collapsed Theme Toggle when icon-only */}
        {isSidebarCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', borderBottom: '1px solid var(--sidebar-border)' }}>
            <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
          </div>
        )}

        {/* Navigation Links */}
        <nav style={{ padding: isSidebarCollapsed ? '16px 8px' : '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isSidebarCollapsed ? item.label : undefined}
              aria-label={item.label}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                gap: isSidebarCollapsed ? '0' : '12px',
                padding: isSidebarCollapsed ? '10px 0' : '11px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-sub)',
                backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.14)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
                  e.currentTarget.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--sidebar-text-sub)'
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </span>
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Theme Toggle above user card */}
        <div
          style={{
            padding: isSidebarCollapsed ? '10px 8px' : '10px 18px',
            borderTop: '1px solid var(--sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
          }}
        >
          <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
        </div>

        {/* User Card at bottom */}
        <div
          style={{
            padding: isSidebarCollapsed ? '14px 8px' : '16px 18px',
            borderTop: '1px solid var(--sidebar-border)',
            backgroundColor: 'rgba(0, 0, 0, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
            gap: isSidebarCollapsed ? '8px' : '12px',
            flexDirection: isSidebarCollapsed ? 'column' : 'row',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--sidebar-active-bg)',
              color: 'var(--sidebar-active-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.88rem',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
            }}
            title={user?.name || 'User Profile'}
          >
            {userInitials}
          </div>

          {!isSidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'User'}
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--sidebar-text-sub)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {profile?.address || user?.email || ''}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            style={{
              padding: '8px',
              color: 'var(--sidebar-text-sub)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'none',
              transition: 'color 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--sidebar-text-sub)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 90,
        }}
        className="app-mobile-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              objectFit: 'contain',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
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
                fontSize: '0.58rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
              }}
            >
              Internship Matching &amp; Interview Preparation
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle Navigation Menu"
            title="Toggle Navigation Menu"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius)',
            }}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay (tapping outside closes drawer) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 95,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'min(300px, 85vw)',
            backgroundColor: 'var(--sidebar-bg)',
            borderLeft: '1px solid var(--sidebar-border)',
            color: 'var(--sidebar-text)',
            zIndex: 100,
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
            animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--sidebar-border)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF' }}>
              {BRAND_NAME}
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              title="Close menu"
              style={{
                width: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sidebar-text-sub)',
                borderRadius: 'var(--radius-pill)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-sub)',
                  backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.12)' : 'none',
                })}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                {userInitials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || ''}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--accent-text)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'var(--bg)',
          transition: 'all 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="app-main-column"
      >


        {/* Scrollable Page Content */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: '32px 36px',
            overflowY: 'auto',
          }}
          className="app-main-content"
        >
          <Outlet />
        </main>
      </div>

      {/* Floating Career Assistant Widget */}
      <CareerAssistantWidget />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .app-sidebar-desktop { display: none !important; }
          .app-mobile-header { display: flex !important; }
          .app-main-content {
            padding: 72px 14px 24px !important;
          }
        }
      `}</style>
    </div>
  )
}
