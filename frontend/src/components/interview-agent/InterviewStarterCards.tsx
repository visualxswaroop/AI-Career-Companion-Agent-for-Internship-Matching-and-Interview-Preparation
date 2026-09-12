import { Link } from 'react-router'
import type { InterviewAgentContextResponse, InterviewDocumentResponse } from '../../api/types'

interface InterviewStarterCardsProps {
  context: InterviewAgentContextResponse | null
  activeDocument: InterviewDocumentResponse | null
  onSelectPrompt: (prompt: string) => void
  onUploadClick?: () => void
}

interface StarterItem {
  id: string
  title: string
  desc: string
  prompt: string
  icon: (color?: string) => React.ReactNode
}

// ───────────────────────────────────────────────
// SVG Icon Helpers
// ───────────────────────────────────────────────
function TargetIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
    </svg>
  )
}

function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  )
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

// ───────────────────────────────────────────────
// Standard Resume / General Starter Cards
// ───────────────────────────────────────────────
const GENERAL_STARTERS: StarterItem[] = [
  {
    id: 'role-suit',
    title: 'Which role suits my resume?',
    desc: 'Target roles best matched to your background',
    prompt: 'Which role suits my resume?',
    icon: () => <TargetIcon />,
  },
  {
    id: 'strongest-skills',
    title: 'What are my strongest technical skills?',
    desc: 'Top proficiencies to highlight during interviews',
    prompt: 'What are my strongest technical skills?',
    icon: () => <SparklesIcon />,
  },
  {
    id: 'role-questions',
    title: 'Give me interview questions for my role',
    desc: 'High-yield technical questions tailored to your field',
    prompt: 'Give me interview questions for my role.',
    icon: () => <HelpCircleIcon />,
  },
  {
    id: 'prep-roadmap',
    title: 'Create a preparation roadmap',
    desc: 'Structured timeline and study milestones',
    prompt: 'Create a preparation roadmap.',
    icon: () => <MapIcon />,
  },
  {
    id: 'learn-next',
    title: 'What should I learn next?',
    desc: 'Bridge critical skill gaps before interviewing',
    prompt: 'What should I learn next?',
    icon: () => <ZapIcon />,
  },
  {
    id: 'mock-interview',
    title: 'Take my mock interview',
    desc: 'Interactive 1-on-1 interview practice with feedback',
    prompt: 'Take my mock interview.',
    icon: () => <MicIcon />,
  },
]

// ───────────────────────────────────────────────
// Document-Grounded Starter Cards
// ───────────────────────────────────────────────
const DOCUMENT_STARTERS: StarterItem[] = [
  {
    id: 'doc-summarize',
    title: 'Summarize this document',
    desc: 'Key subjects, main definitions, and core takeaways',
    prompt: 'Summarize this document.',
    icon: () => <FileTextIcon />,
  },
  {
    id: 'doc-questions',
    title: 'Generate interview questions',
    desc: 'Technical questions extracted from document content',
    prompt: 'Generate interview questions.',
    icon: () => <HelpCircleIcon />,
  },
  {
    id: 'doc-roadmap',
    title: 'Create a revision roadmap',
    desc: 'Step-by-step review plan for these materials',
    prompt: 'Create a revision roadmap.',
    icon: () => <MapIcon />,
  },
  {
    id: 'doc-topics',
    title: 'What are the important topics?',
    desc: 'Core topics most likely to be tested in interviews',
    prompt: 'What are the most important topics in this document?',
    icon: () => <BookmarkIcon />,
  },
  {
    id: 'doc-qa',
    title: 'Generate Q&A pairs',
    desc: 'Questions and detailed answers directly from the text',
    prompt: 'Generate questions and answers from this document.',
    icon: () => <SparklesIcon />,
  },
  {
    id: 'doc-focus',
    title: 'Align resume with document',
    desc: 'Bridge your candidate profile with these materials',
    prompt: 'Based on my resume and this document, what should I prepare for interviews?',
    icon: () => <LayersIcon />,
  },
]

export default function InterviewStarterCards({
  context,
  activeDocument,
  onSelectPrompt,
  onUploadClick,
}: InterviewStarterCardsProps) {
  const starters = activeDocument ? DOCUMENT_STARTERS : GENERAL_STARTERS

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: 'auto',
        width: '100%',
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Centered Avatar Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
          border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent)',
          marginBottom: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </div>

      {/* Main Title & Subtitle */}
      <h2
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 6px',
          letterSpacing: '-0.01em',
        }}
      >
        Interview Preparation Agent
      </h2>
      <p
        style={{
          fontSize: '0.84rem',
          color: 'var(--text-muted)',
          margin: 0,
          maxWidth: '460px',
          lineHeight: 1.5,
        }}
      >
        Your AI coach for interview preparation. Get personalized role guidance, technical questions, STAR answers, and structured roadmaps.
      </p>

      {/* Context-Aware Badge / Status */}
      {activeDocument ? (
        <div
          style={{
            margin: '16px 0 20px',
            padding: '5px 14px',
            borderRadius: '100px',
            backgroundColor: 'var(--surface)',
            border: '1px solid color-mix(in srgb, var(--accent) 35%, var(--border))',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            {activeDocument.filename}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Document ready for Q&amp;A
          </span>
        </div>
      ) : context?.has_resume ? (
        <div
          style={{
            margin: '16px 0 20px',
            padding: '5px 14px',
            borderRadius: '100px',
            backgroundColor: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--accent-text)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontWeight: 600 }}>Resume connected</span>
          <span style={{ color: 'var(--text-muted)' }}>
            — Personalized interview preparation ready
          </span>
        </div>
      ) : (
        <div
          style={{
            margin: '16px 0 20px',
            padding: '5px 14px',
            borderRadius: '100px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>
            No resume connected yet ·{' '}
            <Link
              to="/app/resume"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Upload resume
            </Link>{' '}
            or explore general interview questions below
          </span>
        </div>
      )}

      {/* Grid of Starter Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '10px',
          width: '100%',
          maxWidth: '680px',
        }}
        className="interview-starter-grid"
      >
        {starters.map((item) => {
          const isMock = item.id === 'mock-interview'
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className={isMock ? 'interview-card-featured' : ''}
              style={{
                padding: isMock ? '14px 16px' : '12px 14px',
                borderRadius: 'var(--radius)',
                backgroundColor: isMock
                  ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-alt))'
                  : 'var(--bg-alt)',
                border: isMock
                  ? '1.5px solid color-mix(in srgb, var(--accent) 40%, transparent)'
                  : '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                gridColumn: isMock ? '1 / -1' : 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.backgroundColor = isMock
                  ? 'color-mix(in srgb, var(--accent) 16%, var(--surface))'
                  : 'var(--surface)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isMock
                  ? 'color-mix(in srgb, var(--accent) 40%, transparent)'
                  : 'var(--border)'
                e.currentTarget.style.backgroundColor = isMock
                  ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-alt))'
                  : 'var(--bg-alt)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isMock
                    ? 'color-mix(in srgb, var(--accent) 20%, var(--surface))'
                    : 'var(--surface)',
                  border: isMock
                    ? '1px solid color-mix(in srgb, var(--accent) 35%, transparent)'
                    : '1px solid var(--border)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {item.icon()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: isMock ? '0.88rem' : '0.84rem',
                    fontWeight: isMock ? 700 : 600,
                    color: 'var(--text)',
                    marginBottom: '2px',
                  }}
                >
                  {item.title}
                  {isMock && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--accent)',
                        color: '#fff',
                        letterSpacing: '0.02em',
                        verticalAlign: 'middle',
                      }}
                    >
                      Featured
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.35,
                  }}
                >
                  {item.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 620px) {
          .interview-starter-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Bottom helper prompt / Upload trigger */}
      {!activeDocument && onUploadClick && (
        <div style={{ marginTop: '18px' }}>
          <button
            type="button"
            onClick={onUploadClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius)',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <span>Have study notes or interview guides? Upload a document (PDF / DOCX)</span>
          </button>
        </div>
      )}
    </div>
  )
}
