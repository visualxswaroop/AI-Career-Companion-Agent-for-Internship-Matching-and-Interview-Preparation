import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import Button from '../components/Button'

export default function VoiceResumeSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [waveformBars, setWaveformBars] = useState<number[]>([25, 45, 70, 95, 60, 80, 40, 65, 85, 50, 75, 90, 35, 60, 45])

  // Subtle audio wave animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformBars(prev =>
        prev.map(() => Math.floor(Math.random() * 65) + 25)
      )
    }, 450)
    return () => clearInterval(interval)
  }, [])

  const pipelineStages = [
    {
      step: '01',
      title: 'Conversational Voice Capture',
      desc: 'Speak freely into your mic about your day-to-day achievements, key metrics, and tools without worrying about phrasing.',
      badge: 'Whisper Large-v3',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      ),
    },
    {
      step: '02',
      title: 'STAR Bullet Synthesis',
      desc: 'LLaMA 3.3 70B synthesizes your spoken transcript into punchy Situation, Task, Action, and quantified Result bullets.',
      badge: 'STAR Framing',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      step: '03',
      title: 'ATS Scoring & Keyword Tuning',
      desc: 'Industry-standard ATS benchmark evaluates readability, keyword match density, and highlights quantified achievements.',
      badge: '94/100 ATS Match',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      step: '04',
      title: '1-Click Executive PDF Export',
      desc: 'Download a clean, recruiter-approved A4 PDF formatted according to top tier executive typography guidelines.',
      badge: 'Instant Download',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="12" y2="18" />
          <line x1="15" y1="15" x2="12" y2="18" />
        </svg>
      ),
    },
  ]

  return (
    <section
      id="voice-resume"
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '96px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(49, 20, 207, 0.12) 0%, rgba(49, 20, 207, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div style={{ maxWidth: '720px', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--accent)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: '1px solid var(--border-alt)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
              Voice-to-Resume Copilot
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✦ Brand New Feature</span>
          </div>

          <h2 className="headline-lg" style={{ marginBottom: '20px' }}>
            Speak Your Experience.{' '}
            <span style={{ color: 'var(--accent)' }}>Let AI Forge Your Executive Resume.</span>
          </h2>

          <p className="body-lg" style={{ color: 'var(--text-muted)' }}>
            Ditch writer’s block. Talk naturally about your projects, challenges, and results. 
            CareerForge AI transcribes your spoken answers, converts them into high-conviction STAR bullet points, 
            scores your ATS compatibility, and exports a recruiter-ready executive PDF in seconds.
          </p>
        </div>

        {/* Showcase Grid: Interactive Demo Card (Left) + Pipeline Walkthrough (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            alignItems: 'center',
          }}
          className="voice-showcase-grid"
        >
          {/* Left: Interactive Simulated Voice Studio Preview */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
            }}
          >
            {/* Window header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', marginLeft: '6px' }}>
                  Live Voice Interview Session
                </span>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-bg)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
                Recording Active
              </span>
            </div>

            {/* Prompt Card */}
            <div
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>
                Question 2 of 4 • Work Experience
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
                "Tell me about a challenging backend scaling project you delivered and its measurable impact."
              </div>
            </div>

            {/* Live Audio Waveform Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-alt)',
                borderRadius: 'var(--radius)',
                padding: '20px',
                border: '1px solid var(--border)',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  height: '56px',
                  marginBottom: '12px',
                }}
              >
                {waveformBars.map((height, i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${height}%`,
                      backgroundColor: i % 2 === 0 ? 'var(--accent)' : 'var(--accent-dark)',
                      borderRadius: '2px',
                      transition: 'height 0.35s ease',
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                "...re-architected the ingest queue with Redis and FastAPI, which slashed processing latency by 42%..."
              </p>
            </div>

            {/* Real-time Result Preview */}
            <div
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Generated STAR Bullet
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  ATS Score: 96/100
                </span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.5 }}>
                • Engineered an asynchronous ingestion pipeline utilizing <strong>FastAPI & Redis</strong>, reducing payload processing time by <strong>42%</strong> and scaling peak throughput to <strong>15,000 req/min</strong>.
              </div>
            </div>
          </div>

          {/* Right: Pipeline Steps & Feature Callout */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
              {pipelineStages.map((stage, idx) => {
                const isSelected = activeStep === idx
                return (
                  <div
                    key={stage.step}
                    onClick={() => setActiveStep(idx)}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--surface-alt)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-alt)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background-color 0.2s ease, color 0.2s ease',
                      }}
                    >
                      {stage.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
                          {stage.step}. {stage.title}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {stage.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/app/voice-resume">
                <Button variant="primary" showArrow>
                  Launch Voice Resume Studio
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost">
                  Explore Full Feature Suite ↓
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @media (max-width: 960px) {
          .voice-showcase-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }
      `}</style>
    </section>
  )
}
