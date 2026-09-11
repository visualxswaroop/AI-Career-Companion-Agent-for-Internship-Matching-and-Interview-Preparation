import ChatbotIcon from './ChatbotIcon'

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void
}

const DEFAULT_SUGGESTIONS = [
  'How does internship matching work?',
  'How do I upload my resume?',
  'How can I improve my resume?',
  'How do I generate a cover letter?',
]

export default function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        textAlign: 'center',
        gap: '18px',
        flex: 1,
      }}
    >
      {/* Bot Icon */}
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          border: '1px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <ChatbotIcon size={26} />
      </div>

      {/* Greeting */}
      <div style={{ maxWidth: '340px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '6px',
          }}
        >
          Career Assistant
        </h3>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Hi! 👋 I'm your Career Companion assistant. Ask me about resumes, internships, cover letters, interviews, or how to use the platform.
        </p>
      </div>

      {/* Suggestions List */}
      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-subtle)',
            textAlign: 'left',
            marginBottom: '2px',
          }}
        >
          Suggested Questions
        </p>
        {DEFAULT_SUGGESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            style={{
              padding: '9px 12px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--bg-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '0.82rem',
              lineHeight: 1.35,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.backgroundColor = 'var(--accent-bg)'
              e.currentTarget.style.color = 'var(--accent-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.backgroundColor = 'var(--bg-alt)'
              e.currentTarget.style.color = 'var(--text)'
            }}
          >
            <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>💬</span>
            <span style={{ flex: 1 }}>{question}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
