import { useState } from 'react'
import type { ChatSource } from '../../api/types'
import ChatbotIcon from './ChatbotIcon'

export interface MessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  isLoading?: boolean
  isError?: boolean
  timestamp: Date
}

function renderMarkdown(text: string): string {
  return text
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface);padding:2px 5px;border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>')
    // Unordered list items: lines starting with - or *
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Ordered list items: lines starting with 1. 2. etc.
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul style="margin:6px 0 6px 16px;display:flex;flex-direction:column;gap:3px">${match}</ul>`)
    // H3 ### heading
    .replace(/^###\s+(.+)$/gm, '<h4 style="font-size:0.9rem;font-weight:600;margin:8px 0 3px;color:var(--text)">$1</h4>')
    // H2 ## heading
    .replace(/^##\s+(.+)$/gm, '<h3 style="font-size:0.95rem;font-weight:600;margin:10px 0 4px;color:var(--text)">$1</h3>')
    // H1 # heading
    .replace(/^#\s+(.+)$/gm, '<h2 style="font-size:1rem;font-weight:600;margin:10px 0 4px;color:var(--text)">$1</h2>')
    // Paragraphs: double newline -> paragraph break
    .replace(/\n\n/g, '</p><p style="margin:0 0 6px">')
    // Single newlines inside paragraphs -> <br>
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph
    .replace(/^/, '<p style="margin:0 0 6px">')
    .replace(/$/, '</p>')
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--text-muted)',
            animation: `typing 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function SourcesBadge({ sources }: { sources: ChatSource[] }) {
  const [expanded, setExpanded] = useState(false)
  const uniqueSections = [...new Set(sources.map((s) => s.section).filter(Boolean))].slice(0, 3)

  if (uniqueSections.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          fontFamily: 'inherit',
          width: 'fit-content',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>Knowledge grounded ({uniqueSections.length}) · {expanded ? 'Hide' : 'Sources'}</span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
          {uniqueSections.map((sec) => (
            <span
              key={sec}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 7px',
                borderRadius: '100px',
                fontSize: '0.68rem',
                fontWeight: 500,
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--accent-text)',
                border: '1px solid transparent',
              }}
            >
              {sec}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ChatMessage({ message }: { message: MessageItem }) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '8px',
        alignItems: 'flex-start',
        marginBottom: '12px',
        animation: 'fadeIn 0.2s ease forwards',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          backgroundColor: isUser ? 'var(--accent)' : 'var(--accent)',
          border: '1px solid var(--accent)',
          color: '#fff',
        }}
      >
        {isUser ? '👤' : <ChatbotIcon size={16} />}
      </div>

      {/* Bubble Container */}
      <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          className={isUser ? 'glass-bubble-user' : 'glass-bubble-bot'}
          style={{
            padding: '10px 14px',
            fontSize: '0.86rem',
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {message.isLoading ? (
            <TypingIndicator />
          ) : message.isError ? (
            <span style={{ color: isUser ? '#fff' : 'var(--accent-text)' }}>{message.content}</span>
          ) : isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              style={{ overflowWrap: 'break-word' }}
            />
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && !message.isLoading && (
          <SourcesBadge sources={message.sources} />
        )}

        {/* Timestamp */}
        <div
          style={{
            fontSize: '0.66rem',
            color: 'var(--text-subtle)',
            textAlign: isUser ? 'right' : 'left',
            padding: '0 2px',
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
