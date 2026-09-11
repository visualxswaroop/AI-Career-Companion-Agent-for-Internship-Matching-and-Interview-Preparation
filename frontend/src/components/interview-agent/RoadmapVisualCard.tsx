import type { InterviewRoadmapData } from '../../api/types'

interface RoadmapVisualCardProps {
  roadmap: InterviewRoadmapData
}

export default function RoadmapVisualCard({ roadmap }: RoadmapVisualCardProps) {
  return (
    <div
      style={{
        marginTop: '16px',
        marginBottom: '12px',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-alt)',
        border: '1px solid var(--accent)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text)',
                margin: 0,
              }}
            >
              Preparation Roadmap: {roadmap.role}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Personalized Milestone Breakdown
            </span>
          </div>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '100px',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{roadmap.duration}</span>
        </span>
      </div>

      {/* Timeline Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {roadmap.milestones.map((milestone, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '14px',
              position: 'relative',
            }}
          >
            {/* Step Number Circle */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-bg)',
                border: '1.5px solid var(--accent)',
                color: 'var(--accent-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </div>

            {/* Content Card */}
            <div
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <h5 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  {milestone.title}
                </h5>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-alt)',
                    color: 'var(--accent-text)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {milestone.period}
                </span>
              </div>

              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {milestone.focus.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
