import { useState, type FormEvent, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth'
import { formatErrorMessage } from '../../api/client'
import Button from '../../components/Button'

export default function ProfilePage() {
  const { user, profile, token, saveProfile } = useAuth()

  const [summary, setSummary] = useState(profile?.summary || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '')
  const [github, setGithub] = useState(profile?.github || '')

  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile) {
      setSummary(profile.summary || '')
      setPhone(profile.phone || '')
      setAddress(profile.address || '')
      setLinkedin(profile.linkedin || '')
      setGithub(profile.github || '')
    }
  }, [profile])

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)
    setProfileLoading(true)

    try {
      await saveProfile({
        summary: summary.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        linkedin: linkedin.trim() || null,
        github: github.trim() || null,
      })
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setProfileMessage({ type: 'error', text: formatErrorMessage(err) })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (!token) return
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setPasswordLoading(true)
    try {
      await authApi.changePassword(
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        token
      )
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMessage({ type: 'error', text: formatErrorMessage(err) })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>User Settings</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Profile & Account
        </h1>
        <p className="body-md" style={{ color: 'var(--text-muted)' }}>
          Manage your career background, contact details, and account security.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h2 className="headline-sm" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          Account Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <span className="label-sm">Full Name</span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              {user?.name}
            </div>
          </div>
          <div>
            <span className="label-sm">Registered Email</span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Career Profile Form */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h2 className="headline-sm" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          Career Profile
        </h2>

        {profileMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              marginBottom: '20px',
              fontSize: '0.85rem',
              backgroundColor: profileMessage.type === 'success' ? 'rgba(40,200,64,0.1)' : 'rgba(196,82,42,0.1)',
              border: `1px solid ${profileMessage.type === 'success' ? '#28C840' : 'var(--accent)'}`,
              color: profileMessage.type === 'success' ? '#28C840' : 'var(--accent-text)',
            }}
          >
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="profile-summary"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}
            >
              Professional Summary & Direction
            </label>
            <textarea
              id="profile-summary"
              rows={4}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Summary of your background, technical interests, and target roles..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="profile-grid-row">
            <div>
              <label
                htmlFor="profile-phone"
                style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}
              >
                Phone Number
              </label>
              <input
                id="profile-phone"
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
                htmlFor="profile-address"
                style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}
              >
                Location / City
              </label>
              <input
                id="profile-address"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="profile-grid-row">
            <div>
              <label
                htmlFor="profile-linkedin"
                style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}
              >
                LinkedIn Profile URL
              </label>
              <input
                id="profile-linkedin"
                type="url"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
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
                htmlFor="profile-github"
                style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}
              >
                GitHub / Portfolio URL
              </label>
              <input
                id="profile-github"
                type="url"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="https://github.com/username"
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="primary" type="submit" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="card">
        <h2 className="headline-sm" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          Change Password
        </h2>

        {passwordMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              marginBottom: '20px',
              fontSize: '0.85rem',
              backgroundColor: passwordMessage.type === 'success' ? 'rgba(40,200,64,0.1)' : 'rgba(196,82,42,0.1)',
              border: `1px solid ${passwordMessage.type === 'success' ? '#28C840' : 'var(--accent)'}`,
              color: passwordMessage.type === 'success' ? '#28C840' : 'var(--accent-text)',
            }}
          >
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="current-pw"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}
            >
              Current Password
            </label>
            <input
              id="current-pw"
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="profile-grid-row">
            <div>
              <label
                htmlFor="new-pw"
                style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}
              >
                New Password
              </label>
              <input
                id="new-pw"
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
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
                htmlFor="confirm-new-pw"
                style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}
              >
                Confirm New Password
              </label>
              <input
                id="confirm-new-pw"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="outline" type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .profile-grid-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
