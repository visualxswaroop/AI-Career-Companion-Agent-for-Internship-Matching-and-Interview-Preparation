import { sampleResume } from '../data/sampleData'

function ResumeDocPreview() {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        fontSize: '9.5px',
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>{sampleResume.name}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{sampleResume.title}</div>
        <div style={{ color: 'var(--text-subtle)', fontSize: '8px', marginTop: '2px' }}>
          {sampleResume.email} · {sampleResume.phone}
        </div>
      </div>

      {/* Skills row */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>Skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {sampleResume.skills.map(s => (
            <span key={s} className="skill-tag" style={{ fontSize: '8px', padding: '2px 7px' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>Experience</div>
        {sampleResume.experience.map(exp => (
          <div key={exp.role}>
            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '9px' }}>{exp.role}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '8px', marginBottom: '4px' }}>{exp.org}</div>
            {exp.points.map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: '4px', color: 'var(--text-muted)', fontSize: '8px', marginBottom: '2px' }}>
                <span>·</span><span>{pt}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Education */}
      <div>
        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>Education</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '8px' }}>{sampleResume.education}</div>
      </div>
    </div>
  )
}

function AnalysisPanel() {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px',
        fontSize: '10px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '11px', marginBottom: '12px' }}>
        Analysis results
      </div>

      {/* Skills */}
      <div style={{ marginBottom: '12px' }}>
        <div className="label-sm" style={{ marginBottom: '6px' }}>Skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {['Python', 'SQL', 'Power BI', 'Excel', 'Pandas'].map(s => (
            <span key={s} className="skill-tag skill-tag-accent" style={{ fontSize: '8px', padding: '2px 7px' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Strongest experience */}
      <div style={{ marginBottom: '12px' }}>
        <div className="label-sm" style={{ marginBottom: '6px' }}>Strongest experience</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {sampleResume.strengthsExperience.map(s => (
            <span key={s} className="skill-tag skill-tag-green" style={{ fontSize: '8px', padding: '2px 7px' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Match % */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div className="label-sm">Match score</div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--accent)', lineHeight: 1 }}>
            {sampleResume.matchPercent}%
          </div>
        </div>
        <div className="match-bar-track">
          <div className="match-bar-fill" style={{ width: `${sampleResume.matchPercent}%` }} />
        </div>
      </div>

      {/* Missing skills */}
      <div style={{ marginBottom: '12px' }}>
        <div className="label-sm" style={{ marginBottom: '6px' }}>Missing skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {sampleResume.missingSkills.map(s => (
            <span key={s} className="skill-tag" style={{ fontSize: '8px', padding: '2px 7px', borderStyle: 'dashed' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Suggested roles */}
      <div style={{ marginBottom: '12px' }}>
        <div className="label-sm" style={{ marginBottom: '6px' }}>Suggested roles</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {sampleResume.suggestedRoles.map(r => (
            <span key={r} className="skill-tag" style={{ fontSize: '8px', padding: '2px 7px' }}>{r}</span>
          ))}
        </div>
      </div>

      {/* Why this role */}
      <div
        style={{
          padding: '10px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '2px solid var(--accent)',
        }}
      >
        <div className="label-sm" style={{ marginBottom: '4px' }}>Why this role fits</div>
        <p style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{sampleResume.whyThisRole}</p>
      </div>
    </div>
  )
}

export default function ResumeAnalysisSection() {
  return (
    <section
      id="resume"
      className="section"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.6fr',
            gap: '64px',
            alignItems: 'flex-start',
          }}
          className="resume-grid"
        >
          {/* Left — text */}
          <div>
            <p className="label-accent" style={{ marginBottom: '16px' }}>Resume Analysis</p>
            <h2 className="headline-lg" style={{ marginBottom: '20px' }}>
              We read the resume.{' '}
              <em style={{ fontStyle: 'italic' }}>You decide what comes next.</em>
            </h2>
            <p className="body-md" style={{ marginBottom: '32px' }}>
              Upload your resume and get an instant breakdown of your skills, experience, strengths, gaps, and a list of roles that genuinely match where you are — not just where you wish you were.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Skills extracted automatically', icon: '✦' },
                { label: 'Strengths and gaps clearly mapped', icon: '✦' },
                { label: 'Suggested roles based on your profile', icon: '✦' },
                { label: 'Match percentage for target roles', icon: '✦' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '10px', flexShrink: 0 }}>{item.icon}</span>
                  <span className="body-md" style={{ color: 'var(--text)' }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Annotation */}
            <div style={{ marginTop: '36px', position: 'relative' }}>
              <span
                className="annotation"
                style={{ position: 'static', display: 'block', transform: 'rotate(-1deg)', marginBottom: '4px' }}
              >
                worth exploring →
              </span>
            </div>
          </div>

          {/* Right — mockup */}
          <div>
            <div
              className="mockup-window"
              style={{ overflow: 'visible', boxShadow: 'var(--shadow-lg)' }}
            >
              <div className="mockup-titlebar">
                <span className="mockup-dot mockup-dot-red" />
                <span className="mockup-dot mockup-dot-yellow" />
                <span className="mockup-dot mockup-dot-green" />
                <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  {sampleResume.name} — Resume Analysis
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr',
                  gap: '0',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderRight: '1px solid var(--border)',
                  }}
                >
                  <ResumeDocPreview />
                </div>
                <div style={{ padding: '16px' }}>
                  <AnalysisPanel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .resume-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }
      `}</style>
    </section>
  )
}
