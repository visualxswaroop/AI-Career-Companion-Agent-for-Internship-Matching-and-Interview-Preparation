import { useState, useRef, useEffect, useCallback } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 110)}px`
  }, [input])

  const handleSend = useCallback(() => {
    const msg = input.trim()
    if (!msg || isLoading) return
    onSend(msg)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, isLoading, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{
        padding: '10px 14px 12px',
        borderTop: '1px solid rgba(228, 230, 242, 0.5)',
        backgroundColor: 'transparent',
        flexShrink: 0,
      }}
    >
      <div
        className="glass-input-bar"
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
          padding: '8px 12px',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-bg)'
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = 'rgba(228, 230, 242, 0.9)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <textarea
          ref={textareaRef}
          id="floating-career-assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Career Assistant..."
          disabled={isLoading}
          rows={1}
          aria-label="Type your message to Career Assistant"
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.84rem',
            color: 'var(--text)',
            lineHeight: 1.4,
            minHeight: '20px',
            maxHeight: '110px',
            overflowY: 'auto',
            padding: '2px 0',
          }}
        />

        <button
          type="button"
          id="floating-career-assistant-send"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          title="Send message (Enter)"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: input.trim() && !isLoading ? 'var(--accent)' : 'var(--surface)',
            color: input.trim() && !isLoading ? '#fff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            border: 'none',
            padding: 0,
          }}
        >
          {isLoading ? (
            <div
              style={{
                width: '13px',
                height: '13px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid currentColor',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '4px',
          padding: '0 2px',
        }}
      >
        <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>
          Grounded on Career Companion knowledge
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>
          Enter ↵ to send
        </span>
      </div>
    </div>
  )
}
