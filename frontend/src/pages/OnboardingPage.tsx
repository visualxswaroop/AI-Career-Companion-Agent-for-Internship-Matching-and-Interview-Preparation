import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { BRAND_NAME } from '../config'
import { useAuth } from '../context/AuthContext'
import { formatErrorMessage } from '../api/client'
import Button from '../components/Button'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, profile, saveProfile } = useAuth()

  // Steps: 1: Career Direction & Summary, 2: Links & Contact Details
  const [step, setStep] = useState<1 | 2>(1)

  // Form states based strictly on ProfileCreate schema
  const [summary, setSummary] = useState(profile?.summary || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '')
  const [github, setGithub] = useState(profile?.github || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep(2)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await saveProfile({
        summary: summary.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        linkedin: linkedin.trim() || null,
        github: github.trim() || null,
      })

      // Redirect to the authenticated app shell overview
      navigate('/app')
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/app')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 16px',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          maxWidth: '620px',
          width: '100%',
          margin: '0 auto 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.15rem',
            fontWeight: 600,
            color: 'var(--text)',
          }}
        >
          {BRAND_NAME}
        </span>

        <button
          type="button"
          onClick={handleSkip}
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 'var(--radius)',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Skip for now →
        </button>
      </div>

      {/* Main Container */}
      <div
        style={{
          maxWidth: '620px',
          width: '100%',
          margin: '0 auto',
          backgroundColor: 'var(--bg-alt)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 36px',
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Step Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span className="label-accent">
              Step {step} of 2 — {step === 1 ? 'Career Direction' : 'Contact & Portfolios'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {step === 1 ? '50%' : '100%'} Completed
            </span>
          </div>
          <div className="match-bar-track">
            <div
              className="match-bar-fill"
              style={{
                width: step === 1 ? '50%' : '100%',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
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
              marginBottom: '24px',
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: Professional Summary */
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 className="headline-md" style={{ fontSize: '1.9rem', marginBottom: '10px' }}>
                Let's start with where you're headed{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
              </h1>
              <p className="body-md" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Share a brief summary of your background, career interests, or target roles. This helps shape your career matches and tailored letters.
              </p>
            </div>

            <div>
              <label
                htmlFor="summary"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '8px',
                }}
              >
                Professional & Academic Summary
              </label>
              <textarea
                id="summary"
                rows={6}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="e.g. Computer Science student passionate about data analytics, dashboard engineering, and Python backend systems. Looking for Summer 2026 data analyst internships where I can solve real business problems..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '6px' }}>
                Tip: You can always update this or let your uploaded resume autofill this later.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <Button variant="primary" type="submit" showArrow>
                Continue to Contact & Links
              </Button>
            </div>
          </form>
        ) : (
          /* STEP 2: Contact & Links */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 className="headline-md" style={{ fontSize: '1.9rem', marginBottom: '10px' }}>
                Your links & details
              </h1>
              <p className="body-md" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Add your portfolio links and contact information so internship applications and cover letters are ready to go.
              </p>
            </div>

            {/* Phone & Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="onboarding-row">
              <div>
                <label
                  htmlFor="phone"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: '6px',
                  }}
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
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

              <div>
                <label
                  htmlFor="address"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: '6px',
                  }}
                >
                  Location / City
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Bengaluru, India"
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
            </div>

            {/* LinkedIn */}
            <div>
              <label
                htmlFor="linkedin"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '6px',
                }}
              >
                LinkedIn Profile URL
              </label>
              <input
                id="linkedin"
                type="url"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
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

            {/* GitHub */}
            <div>
              <label
                htmlFor="github"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '6px',
                }}
              >
                GitHub or Portfolio URL
              </label>
              <input
                id="github"
                type="url"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="https://github.com/yourhandle"
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <Button
                variant="outline"
                type="button"
                onClick={() => setStep(1)}
              >
                ← Back
              </Button>

              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Saving profile...' : 'Complete Profile →'}
              </Button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .onboarding-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
