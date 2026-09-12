import { useState, useEffect, useCallback, useRef } from 'react'
import RoadmapVisualCard from './RoadmapVisualCard'
import type { InterviewRoadmapData } from '../../api/types'

export interface InterviewMessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
  isError?: boolean
  target_role?: string
  roadmap_data?: InterviewRoadmapData | null
  failedPrompt?: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderInterviewMarkdown(text: string): string {
  if (!text) return ''

  const codeBlocks: string[] = []

  // 1. Extract and preserve code blocks
  let s = text.replace(/```([a-zA-Z0-9_-]*)\s*\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length
    const cleanLang = lang ? lang.trim() : ''
    const escapedCode = escapeHtml(code.trimEnd())
    const langBadge = cleanLang
      ? `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 12px;background:color-mix(in srgb, var(--surface) 80%, black);border-bottom:1px solid var(--border);font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;font-weight:600"><span>${escapeHtml(cleanLang)}</span></div>`
      : ''
    codeBlocks.push(
      `<div style="margin:12px 0;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);background:var(--bg)">${langBadge}<pre style="margin:0;padding:12px 14px;overflow-x:auto;font-family:ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:0.83rem;line-height:1.45;color:var(--text)"><code>${escapedCode}</code></pre></div>`
    )
    return `%%%CODEBLOCK_${idx}%%%`
  })

  // 2. Extract and preserve Markdown Tables
  const tableBlocks: string[] = []
  s = s.replace(/((?:^[ \t]*\|[^\n]+\|[ \t]*(?:\r?\n|$))+)/gm, (match) => {
    const lines = match.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) return match
    const isDelim = /^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[1])
    if (!isDelim) return match

    const headerCells = lines[0].split('|').slice(1, -1).map((c) => c.trim())
    const bodyRows = lines.slice(2).map((row) => row.split('|').slice(1, -1).map((c) => c.trim()))

    let tableHtml = '<div style="overflow-x:auto;margin:12px 0;border-radius:var(--radius);border:1px solid var(--border)"><table style="width:100%;border-collapse:collapse;font-size:0.82rem;line-height:1.4">'
    tableHtml += '<thead style="background:var(--surface)"><tr>'
    headerCells.forEach((cell) => {
      const formattedHeader = cell.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      tableHtml += `<th style="padding:8px 12px;text-align:left;font-weight:600;border-bottom:2px solid var(--border);color:var(--text)">${formattedHeader}</th>`
    })
    tableHtml += '</tr></thead><tbody>'
    bodyRows.forEach((row, rIdx) => {
      const rowBg = rIdx % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--surface) 35%, transparent)'
      tableHtml += `<tr style="background:${rowBg}">`
      row.forEach((cell) => {
        const formattedCell = cell
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code style="background:var(--surface);padding:1px 4px;border-radius:3px;font-size:0.85em;font-family:monospace;border:1px solid var(--border)">$1</code>')
        tableHtml += `<td style="padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:top">${formattedCell}</td>`
      })
      tableHtml += '</tr>'
    })
    tableHtml += '</tbody></table></div>'

    const tIdx = tableBlocks.length
    tableBlocks.push(tableHtml)
    return `%%%TABLEBLOCK_${tIdx}%%%\n\n`
  })

  // 3. Inline formatting
  // Bold **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>')
  // Italic *text*
  s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  // Inline code `code`
  s = s.replace(/`([^`]+)`/g, '<code style="background:var(--surface);padding:2px 5px;border-radius:4px;font-size:0.85em;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;border:1px solid var(--border);color:var(--accent-text)">$1</code>')

  // 4. Headings with appropriate spacing and hierarchy
  s = s.replace(/^####\s+(.+)$/gm, '<h5 style="font-size:0.88rem;font-weight:600;margin:14px 0 6px;color:var(--text)">$1</h5>')
  s = s.replace(/^###\s+(.+)$/gm, '<h4 style="font-size:0.95rem;font-weight:600;margin:16px 0 6px;color:var(--text);border-bottom:1px solid color-mix(in srgb, var(--border) 60%, transparent);padding-bottom:4px">$1</h4>')
  s = s.replace(/^##\s+(.+)$/gm, '<h3 style="font-size:1.05rem;font-weight:600;margin:18px 0 8px;color:var(--text)">$1</h3>')
  s = s.replace(/^#\s+(.+)$/gm, '<h2 style="font-size:1.18rem;font-weight:700;margin:20px 0 10px;color:var(--text)">$1</h2>')

  // 5. Horizontal rule
  s = s.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0"/>')

  // 6. Blockquote
  s = s.replace(/^>\s+(.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding:6px 14px;margin:10px 0;background:var(--surface);border-radius:0 var(--radius) var(--radius) 0;color:var(--text);font-style:italic">$1</blockquote>')

  // 7. Ordered Lists (Preserve Numbers 1., 2., etc.)
  s = s.replace(/((?:^\s*\d+\.\s+[^\n]+(?:\r?\n|$))+)/gm, (match) => {
    const items = match
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const content = line.replace(/^\s*\d+\.\s+/, '')
        return `<li style="margin-bottom:5px;padding-left:2px">${content}</li>`
      })
      .join('')
    return `<ol style="margin:8px 0 12px 22px;padding:0;line-height:1.55">${items}</ol>\n\n`
  })

  // 8. Unordered Lists
  s = s.replace(/((?:^\s*[-*]\s+[^\n]+(?:\r?\n|$))+)/gm, (match) => {
    const items = match
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const content = line.replace(/^\s*[-*]\s+/, '')
        return `<li style="margin-bottom:5px;padding-left:2px">${content}</li>`
      })
      .join('')
    return `<ul style="margin:8px 0 12px 18px;padding:0;line-height:1.55">${items}</ul>\n\n`
  })

  // 9. Paragraphs: split by double newlines
  const paragraphs = s.split(/\n\n+/)
  s = paragraphs
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      // If block starts with a block-level element, do not wrap in <p>
      if (
        /^<(h[1-6]|ul|ol|blockquote|div|hr|table|pre)/i.test(trimmed) ||
        trimmed.startsWith('%%%CODEBLOCK_') ||
        trimmed.startsWith('%%%TABLEBLOCK_')
      ) {
        return trimmed
      }
      return `<p style="margin:0 0 10px;line-height:1.6">${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .filter(Boolean)
    .join('\n')

  // 10. Restore code blocks & table blocks
  codeBlocks.forEach((codeHtml, idx) => {
    s = s.replace(`%%%CODEBLOCK_${idx}%%%`, codeHtml)
  })
  tableBlocks.forEach((tblHtml, idx) => {
    s = s.replace(`%%%TABLEBLOCK_${idx}%%%`, tblHtml)
  })

  return s
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            animation: `interviewTyping 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes interviewTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // strip code blocks
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~>]/g, '')
    .replace(/\|[^\n]+\|/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

interface InterviewChatMessageProps {
  message: InterviewMessageItem
  onRetry?: (prompt: string) => void
}

export default function InterviewChatMessage({ message, onRetry }: InterviewChatMessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Speak / Mute toggle — always mute by default until user explicitly clicks Speak
  const handleToggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Text-to-speech is not supported in this browser.')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // Cancel any active speech before starting
    window.speechSynthesis.cancel()

    const textToSpeak = cleanTextForSpeech(message.content)
    if (!textToSpeak) return

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'en-US'
    utterance.rate = 1.0

    utterance.onend = () => {
      setIsSpeaking(false)
      utteranceRef.current = null
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      utteranceRef.current = null
    }

    utteranceRef.current = utterance
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [isSpeaking, message.content])

  // Cleanup speech if component unmounts while speaking
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // ───────────────────────────────────────────────
  // User Message (Aligned Right)
  // ───────────────────────────────────────────────
  if (isUser) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          marginBottom: '18px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
            paddingRight: '4px',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            You
          </span>
        </div>

        <div
          style={{
            maxWidth: '78%',
            padding: '12px 18px',
            borderRadius: '16px 16px 4px 16px',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontSize: '0.88rem',
            lineHeight: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>

        <span
          style={{
            fontSize: '0.66rem',
            color: 'var(--text-subtle)',
            marginTop: '4px',
            paddingRight: '4px',
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    )
  }

  // ───────────────────────────────────────────────
  // Assistant Message (Aligned Left with Icon & Avatar)
  // ───────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        marginBottom: '20px',
        width: '100%',
      }}
    >
      {/* Icon / Avatar (SVG Coach Icon) */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          color: 'var(--accent)',
          marginTop: '2px',
        }}
        aria-hidden="true"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </div>

      {/* Message Content Area */}
      <div
        style={{
          maxWidth: '88%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
            Interview Agent
          </span>
          {message.target_role && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--surface)',
                color: 'var(--accent)',
                border: '1px solid var(--border)',
                fontWeight: 500,
              }}
            >
              {message.target_role}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '4px 16px 16px 16px',
            backgroundColor: 'var(--bg-alt)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: '0.88rem',
            lineHeight: 1.55,
            boxShadow: 'var(--shadow-sm)',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {message.isLoading ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Thinking</span>
              <TypingIndicator />
            </div>
          ) : message.isError ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: '0.85rem' }}>{message.content}</span>
              </div>
              {message.failedPrompt && onRetry && (
                <div>
                  <button
                    type="button"
                    onClick={() => onRetry(message.failedPrompt!)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--accent)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--text)'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span>Try again</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div
                dangerouslySetInnerHTML={{ __html: renderInterviewMarkdown(message.content) }}
                style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
              />

              {/* Render Structured Roadmap Card if present */}
              {message.roadmap_data && (
                <RoadmapVisualCard roadmap={message.roadmap_data} />
              )}
            </div>
          )}
        </div>

        {/* Footer info & Copy button */}
        {!message.isLoading && !message.isError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
              marginTop: '2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy message to clipboard"
                aria-label="Copy message to clipboard"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Speak button - ALWAYS MUTED by default, user explicitly triggers speech */}
              <button
                type="button"
                onClick={handleToggleSpeech}
                title={isSpeaking ? 'Stop speaking (Mute)' : 'Listen to response'}
                aria-label={isSpeaking ? 'Stop speaking' : 'Speak response'}
                style={{
                  background: isSpeaking ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'none',
                  border: isSpeaking ? '1px solid var(--accent)' : 'none',
                  color: isSpeaking ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSpeaking) e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={(e) => {
                  if (!isSpeaking) e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                {isSpeaking ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                    <span style={{ fontWeight: 600 }}>Stop</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                    <span>Speak</span>
                  </>
                )}
              </button>
            </div>

            <span style={{ fontSize: '0.66rem', color: 'var(--text-subtle)' }}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
