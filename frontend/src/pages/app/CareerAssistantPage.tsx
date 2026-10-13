import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { careerAssistantApi } from '../../api/careerAssistant'
import { formatErrorMessage } from '../../api/client'
import Button from '../../components/Button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
  isError?: boolean
}

const STARTER_PROMPTS = [
  'How do I tailor my resume for a Software Engineering Internship?',
  'What are the most common behavioral interview questions and how should I use the STAR method?',
  'Can you analyze the top high-demand tech skills for 2025/2026 internships?',
  'How do I write an impactful cold email or LinkedIn message to a recruiter?',
  'What should I ask an interviewer at the end of a technical internship interview?',
  'How can I optimize my resume bullet points for ATS scanners?',
]

export default function CareerAssistantPage() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your **AI Career Companion** 🤖. I can help you with resume optimization, technical & behavioral interview preparation, internship matching strategy, cover letters, and salary/offer negotiation.\n\nAsk me anything or choose one of the suggested prompts below to get started!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Web Speech API - Voice Dictation
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
        setInput(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
    }
  }

  // Web Speech API - Text to Speech
  const toggleSpeak = (id: string, text: string) => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported in this browser.')
      return
    }

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel()
      setSpeakingMsgId(null)
      return
    }

    window.speechSynthesis.cancel()
    // Clean markdown characters for smoother voice narration
    const cleanText = text
      .replace(/[*#_`~>-]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onend = () => {
      setSpeakingMsgId(null)
    }

    utterance.onerror = () => {
      setSpeakingMsgId(null)
    }

    setSpeakingMsgId(id)
    window.speechSynthesis.speak(utterance)
  }

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? input).trim()
    if (!textToSend || loading) return

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const conversationHistory = messages
      .filter(m => !m.isError && m.id !== 'welcome')
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await careerAssistantApi.chat(
        {
          message: textToSend,
          conversation_history: conversationHistory,
        },
        token || ''
      )

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Failed to get answer: ${formatErrorMessage(err) || 'Internal server error'}`,
        timestamp: new Date(),
        isError: true,
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const exportConversation = (format: 'md' | 'txt' | 'json') => {
    let content = ''
    let mime = 'text/plain'
    const timestamp = new Date().toISOString().slice(0, 10)

    if (format === 'json') {
      content = JSON.stringify(messages, null, 2)
      mime = 'application/json'
    } else if (format === 'md') {
      content = `# AI Career Companion — Chat Export\n*Exported on ${new Date().toLocaleString()}*\n\n`
      messages.forEach(m => {
        const sender = m.role === 'user' ? '👤 **You**' : '🤖 **Career Assistant**'
        content += `### ${sender} (${m.timestamp.toLocaleTimeString()})\n\n${m.content}\n\n`
        if (m.sources && m.sources.length > 0) {
          content += `*Sources: ${m.sources.join(', ')}*\n\n`
        }
        content += `---\n\n`
      })
      mime = 'text/markdown'
    } else {
      content = `AI Career Companion — Chat Export (${new Date().toLocaleString()})\n\n`
      messages.forEach(m => {
        const sender = m.role === 'user' ? 'YOU' : 'AI CAREER ASSISTANT'
        content += `[${m.timestamp.toLocaleTimeString()}] ${sender}:\n${m.content}\n\n`
      })
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `career-chat-${timestamp}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearChat = () => {
    if (window.confirm('Clear all conversation history?')) {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      setSpeakingMsgId(null)
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Chat history cleared. What career or interview topic would you like to explore next?",
          timestamp: new Date(),
        },
      ])
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 100px)',
        maxWidth: '1100px',
        margin: '0 auto',
        gap: '16px',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              AI Career Assistant Studio
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(79, 70, 229, 0.15)',
                color: '#6366F1',
                fontWeight: 600,
              }}
            >
              RAG + Groq LLM
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time career guidance, resume review, internship search strategy & mock Q&A
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button
              onClick={() => exportConversation('md')}
              title="Export as Markdown"
              style={{
                padding: '6px 10px',
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
                borderRight: '1px solid var(--border)',
              }}
            >
              MD
            </button>
            <button
              onClick={() => exportConversation('json')}
              title="Export as JSON"
              style={{
                padding: '6px 10px',
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
                borderRight: '1px solid var(--border)',
              }}
            >
              JSON
            </button>
            <button
              onClick={() => exportConversation('txt')}
              title="Export as Text"
              style={{
                padding: '6px 10px',
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              TXT
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={clearChat} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingRight: '6px',
        }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.role === 'user' ? '75%' : '85%',
              gap: '4px',
            }}
          >
            {/* Sender Label & Timestamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                paddingLeft: '4px',
                paddingRight: '4px',
              }}
            >
              <span>{msg.role === 'user' ? 'You' : 'AI Companion'}</span>
              <span>•</span>
              <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Bubble */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius:
                  msg.role === 'user'
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                backgroundColor:
                  msg.role === 'user'
                    ? 'var(--accent)'
                    : msg.isError
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'var(--card-bg)',
                color: msg.role === 'user' ? '#FFFFFF' : 'var(--text)',
                border:
                  msg.role === 'user'
                    ? '1px solid transparent'
                    : msg.isError
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid var(--border)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                lineHeight: 1.6,
                fontSize: '0.92rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}

              {/* Citations if available */}
              {msg.sources && msg.sources.length > 0 && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent)' }}>
                    📚 Verified References:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {msg.sources.map((src, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: 'var(--surface)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Message Actions (TTS + Copy) for assistant responses */}
            {msg.role === 'assistant' && !msg.isError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  alignSelf: 'flex-start',
                  marginTop: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSpeak(msg.id, msg.content)}
                  title={speakingMsgId === msg.id ? 'Stop readout' : 'Read aloud with Text-to-Speech'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: speakingMsgId === msg.id ? '#6366F1' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {speakingMsgId === msg.id ? (
                    <>
                      <span style={{ animation: 'pulse 1s infinite' }}>🔊</span> Speaking...
                    </>
                  ) : (
                    <>🔈 Listen</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(msg.id, msg.content)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedId === msg.id ? '#10B981' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {copiedId === msg.id ? '✓ Copied' : '⧉ Copy'}
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 18px',
              borderRadius: '16px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              width: 'fit-content',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                animation: 'bounce 1s infinite alternate',
              }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              AI is formulating response...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingBottom: '4px' }}>
          {STARTER_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              style={{
                fontSize: '0.8rem',
                padding: '8px 14px',
                borderRadius: '100px',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
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
              ✦ {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box Area */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '10px 14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <textarea
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for resume feedback, interview advice, or internship strategies... (Press Enter to send)"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: '0.92rem',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Speech Recognition Toggle Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Start voice dictation'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '100px',
                border: isListening ? '1px solid #EF4444' : '1px solid var(--border)',
                backgroundColor: isListening ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface)',
                color: isListening ? '#EF4444' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{isListening ? '🔴' : '🎙️'}</span>
              <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Shift + Enter for new line
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled={loading || !input.trim()}
              onClick={() => handleSend()}
              style={{ padding: '6px 16px', borderRadius: '100px' }}
            >
              Send ➔
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
