import { sampleInternships, type Internship } from '../data/sampleData'
import Button from '../components/Button'

function InternshipCard({ internship }: { internship: Internship }) {
  const modeColor = {
    Remote: '#4A90D9',
    Hybrid: '#7B5EA7',
    'On-site': '#4CAF50',
  }[internship.mode]

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = ''
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginBottom: '10px',
              fontFamily: 'var(--font-serif)',
            }}
          >
            {internship.company.charAt(0)}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>{internship.role}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
            {internship.company}
          </div>
        </div>

        {/* Match badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'var(--accent-bg)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            minWidth: '56px',
          }}
        >
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-serif)',
              color: 'var(--accent-text)',
              lineHeight: 1,
            }}
          >
            {internship.matchPercent}%
          </span>
          <span style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
            match
          </span>
        </div>
      </div>

      {/* Location + mode */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          📍 {internship.location}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: modeColor,
            backgroundColor: `${modeColor}18`,
            padding: '2px 8px',
            borderRadius: '100px',
          }}
        >
          {internship.mode}
        </span>
      </div>

      {/* Match bar */}
      <div>
        <div className="match-bar-track">
          <div className="match-bar-fill" style={{ width: `${internship.matchPercent}%` }} />
        </div>
      </div>

      {/* Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {internship.skills.map(s => (
          <span key={s} className="skill-tag">{s}</span>
        ))}
      </div>

      {/* Why fit */}
      <p className="body-sm" style={{ flex: 1 }}>
        {internship.whyFit}
      </p>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
        <Button variant="outline" size="sm" style={{ flex: 1 }}>Save</Button>
        <Button variant="primary" size="sm" style={{ flex: 1 }}>View Details</Button>
      </div>
    </div>
  )
}

export default function InternshipSection() {
  return (
    <section
      id="internships"
      className="section"
      style={{ backgroundColor: 'var(--bg-alt)' }}
    >
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '48px',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ maxWidth: '480px' }}>
            <p className="label-accent" style={{ marginBottom: '12px' }}>Opportunity Discovery</p>
            <h2 className="headline-lg">
              Internships that match you,{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                not just keywords.
              </em>
            </h2>
          </div>
          <button
            style={{
              fontSize: '0.875rem',
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'opacity 0.2s',
            }}
          >
            View all opportunities →
          </button>
        </div>

        {/* Annotation */}
        <div style={{ position: 'relative' }}>
          <span
            className="annotation"
            style={{
              position: 'absolute',
              top: '-24px',
              left: '50%',
              transform: 'rotate(-1.5deg)',
              zIndex: 1,
              fontSize: '0.8rem',
            }}
          >
            This one is worth a look.
          </span>

          {/* Cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
            }}
            className="internship-grid"
          >
            {sampleInternships.map(internship => (
              <InternshipCard key={internship.id} internship={internship} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .internship-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .internship-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
