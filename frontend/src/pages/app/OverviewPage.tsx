import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'

export default function OverviewPage() {
  const { user, profile } = useAuth()
  const firstName = user?.name ? user.name.split(' ')[0] : 'there'

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header Greeting */}
      <div style={{ marginBottom: '32px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>Career Dashboard</p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Good day, {firstName} ✦
        </h1>
        <p className="body-md" style={{ color: 'var(--text-muted)' }}>
          Welcome to your personal career command center. Here's a snapshot of your journey.
        </p>
      </div>

      {/* Profile status banner if incomplete */}
      {!profile && (
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-text)', marginBottom: '4px' }}>
              Complete your profile setup
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text)', opacity: 0.85 }}>
              Add your target direction and social links to unlock deeper internship and cover letter alignment.
            </p>
          </div>
          <Link to="/onboarding">
            <Button variant="primary" size="sm">
              Complete Setup →
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="label-sm">Profile Status</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: profile ? '#28C840' : 'var(--accent)',
                backgroundColor: profile ? 'rgba(40,200,64,0.12)' : 'var(--accent-bg)',
                padding: '2px 8px',
                borderRadius: '100px',
              }}
            >
              {profile ? 'Active' : 'Incomplete'}
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text)', marginBottom: '4px' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {user?.email}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="label-sm">Resume Parser</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Phase 3</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text)', marginBottom: '4px' }}>
            Ready to Upload
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Extract skills, experience & target roles
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="label-sm">Internship Matching</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Phase 4</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text)', marginBottom: '4px' }}>
            AI Semantic Engine
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Semantic search across 100+ verified listings
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div style={{ marginBottom: '32px' }}>
        <h2 className="headline-sm" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>
          Explore Platform Capabilities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[
            {
              title: 'Resume Breakdown',
              desc: 'Upload PDF or DOCX resumes to inspect extracted skills, strengths, and role suggestions.',
              link: '/app/resume',
              cta: 'View Resume Module',
            },
            {
              title: 'Opportunity Discovery',
              desc: 'Discover tailored internships ranked by semantic match score and required skill overlap.',
              link: '/app/internships',
              cta: 'Discover Roles',
            },
            {
              title: 'Personalized Cover Letters',
              desc: 'Generate role-aligned cover letters powered by Groq LLM with customized tone settings.',
              link: '/app/cover-letters',
              cta: 'Open Letter Studio',
            },
          ].map(f => (
            <div key={f.title} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                {f.title}
              </h3>
              <p className="body-sm" style={{ marginBottom: '20px', flex: 1 }}>
                {f.desc}
              </p>
              <Link to={f.link}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                  {f.cta} →
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
