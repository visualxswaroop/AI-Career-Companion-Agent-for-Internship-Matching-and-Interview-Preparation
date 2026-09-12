import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import { formatErrorMessage } from '../api/client'
import Button from '../components/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Forgot password sub-flow state
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request')
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null)
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const { hasProfile } = await login({
        email: email.trim(),
        password,
      })

      // If user came from a protected route redirect, use it; otherwise check profile completion
      const fromPath = (location.state as any)?.from?.pathname
      if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
        navigate(fromPath)
      } else if (!hasProfile) {
        navigate('/onboarding')
      } else {
        navigate('/app')
      }
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setForgotSuccessMessage(null)

    if (!forgotEmail.trim()) {
      setError('Please enter your registered email address.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await authApi.forgotPassword({ email: forgotEmail.trim() })
      setResetToken(res.reset_token)
      setResetStep('reset')
      setForgotSuccessMessage('Reset token generated. Enter your new password below.')
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setForgotLoading(false)
    }
  }

  const handlePerformReset = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setForgotSuccessMessage(null)

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setForgotLoading(true)
    try {
      await authApi.resetPassword({
        token: resetToken,
        new_password: newPassword,
      })
      setForgotSuccessMessage('Password reset successfully! You can now log in.')
      setIsForgotPassword(false)
      setResetStep('request')
      setPassword('')
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg)',
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto 32px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
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
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              AI-Career Companion Agent
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              for Internship Matching &amp; Interview Preparation
            </div>
          </div>
        </Link>
      </div>

      {/* Main card */}
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          margin: '0 auto',
          backgroundColor: 'var(--bg-alt)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow)',
        }}
      >
        {!isForgotPassword ? (
          <>
            <div style={{ marginBottom: '28px' }}>
              <p className="label-accent" style={{ marginBottom: '8px' }}>Welcome Back</p>
              <h1 className="headline-md" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
                Sign in to your account
              </h1>
              <p className="body-sm" style={{ color: 'var(--text-muted)' }}>
                Access your career intelligence dashboard, matches, and applications.
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(196, 82, 42, 0.1)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--accent-text)',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            {forgotSuccessMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(40, 200, 64, 0.1)',
                  border: '1px solid #28C840',
                  borderRadius: 'var(--radius)',
                  color: '#28C840',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                  lineHeight: 1.4,
                }}
              >
                {forgotSuccessMessage}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: '6px',
                  }}
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label
                    htmlFor="login-password"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Forgot password link */}
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true)
                    setError(null)
                    setForgotEmail(email)
                  }}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '4px',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </Button>
            </form>

            <div
              style={{
                marginTop: '28px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              <p className="body-sm">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{
                    color: 'var(--accent-text)',
                    fontWeight: 600,
                  }}
                >
                  Create one now
                </Link>
              </p>
            </div>
          </>
        ) : (
          /* Forgot Password View */
          <>
            <div style={{ marginBottom: '24px' }}>
              <p className="label-accent" style={{ marginBottom: '8px' }}>Account Recovery</p>
              <h1 className="headline-md" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
                Reset your password
              </h1>
              <p className="body-sm" style={{ color: 'var(--text-muted)' }}>
                {resetStep === 'request'
                  ? 'Enter your registered email address to generate a password reset token.'
                  : 'Enter your new password below to finalize your account reset.'}
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(196, 82, 42, 0.1)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--accent-text)',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            {forgotSuccessMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(40, 200, 64, 0.1)',
                  border: '1px solid #28C840',
                  borderRadius: 'var(--radius)',
                  color: '#28C840',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                  lineHeight: 1.4,
                }}
              >
                {forgotSuccessMessage}
              </div>
            )}

            {resetStep === 'request' ? (
              <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label
                    htmlFor="forgot-email"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                      marginBottom: '6px',
                    }}
                  >
                    Registered Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    opacity: forgotLoading ? 0.7 : 1,
                  }}
                >
                  {forgotLoading ? 'Generating token...' : 'Get Reset Token →'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePerformReset} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label
                    htmlFor="new-password"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                      marginBottom: '6px',
                    }}
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter minimum 6 characters"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    opacity: forgotLoading ? 0.7 : 1,
                  }}
                >
                  {forgotLoading ? 'Updating password...' : 'Set New Password →'}
                </Button>
              </form>
            )}

            <div
              style={{
                marginTop: '24px',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setError(null)
                }}
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                }}
              >
                ← Back to sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
