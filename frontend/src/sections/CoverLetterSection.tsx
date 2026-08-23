import { useState } from 'react'
import { sampleCoverLetter } from '../data/sampleData'

type Tone = 'Tone' | 'Draw' | 'Match' | 'Combine'

export default function CoverLetterSection() {
  const [activeTab, setActiveTab] = useState<Tone>('Match')
  const tabs: Tone[] = ['Tone', 'Draw', 'Match', 'Combine']

  return (
    <section
      id="cover-letters"
      className="section"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.8fr',
            gap: '64px',
            alignItems: 'flex-start',
          }}
          className="cover-letter-grid"
        >
          {/* Left — copy */}
          <div>
            <p className="label-accent" style={{ marginBottom: '16px' }}>Applications that sound like you</p>
            <h2 className="headline-lg" style={{ marginBottom: '20px' }}>
              Cover letters personalized to{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                you and the role.
              </em>
            </h2>
            <p className="body-md" style={{ marginBottom: '32px' }}>
              Stop sending the same letter with the company name swapped. We
              generate tailored cover letters based on your actual experience,
              the specific internship requirements, and the tone that suits you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {[
                'Based on your resume + the job description',
                'Adjust tone — formal, conversational, confident',
                'Regenerate until it feels right',
                'Export or copy with one click',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '10px', marginTop: '4px', flexShrink: 0 }}>✦</span>
                  <span className="body-md" style={{ color: 'var(--text)' }}>{item}</span>
                </div>
              ))}
            </div>

            <button
              style={{
                fontSize: '0.875rem',
                color: 'var(--accent-text)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0,
              }}
            >
              Create a cover letter →
            </button>
          </div>

          {/* Right — cover letter editor mockup */}
          <div className="mockup-window" style={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }}>
            {/* Title bar */}
            <div className="mockup-titlebar">
              <span className="mockup-dot mockup-dot-red" />
              <span className="mockup-dot mockup-dot-yellow" />
              <span className="mockup-dot mockup-dot-green" />
              <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>Cover letter editor</span>

              {/* Tone tabs */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: tab === activeTab ? 600 : 400,
                      color: tab === activeTab ? '#fff' : 'var(--text-muted)',
                      backgroundColor: tab === activeTab ? 'var(--accent)' : 'transparent',
                      border: '1px solid ' + (tab === activeTab ? 'var(--accent)' : 'var(--border)'),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', minHeight: '360px' }}>
              {/* Job description pane */}
              <div
                style={{
                  padding: '16px',
                  borderRight: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-alt)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '10px', marginBottom: '8px' }}>
                  Job description
                </div>
                <div
                  style={{
                    fontSize: '8.5px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    marginBottom: '10px',
                  }}
                >
                  <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                    {sampleCoverLetter.jobTitle}
                  </strong>
                  {sampleCoverLetter.jobDescription}
                </div>

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '10px', marginBottom: '6px' }}>Description</div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Currently pursuing or recently completed a degree in a relevant field.
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>Strong analytical problem-solving skills.</div>
                </div>

                {/* Sounds like you indicator */}
                <div
                  style={{
                    marginTop: '14px',
                    padding: '8px',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontSize: '10px' }}>✦</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Sounds like you</span>
                </div>
              </div>

              {/* Generated letter pane */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '10px', marginBottom: '10px' }}>
                  Generated letter
                </div>

                <div
                  style={{
                    flex: 1,
                    fontSize: '8.5px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    overflowY: 'auto',
                    maxHeight: '240px',
                  }}
                >
                  {sampleCoverLetter.letter}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <button
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '9px',
                      fontFamily: 'var(--font-sans)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    ↺ Regenerate
                  </button>
                  <button
                    style={{
                      flex: 1.2,
                      padding: '6px',
                      fontSize: '9px',
                      fontFamily: 'var(--font-sans)',
                      border: '1px solid var(--accent)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--accent)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Use this letter →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cover-letter-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </section>
  )
}
