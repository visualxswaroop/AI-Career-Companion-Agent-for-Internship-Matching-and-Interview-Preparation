import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { interviewAgentApi } from '../../api/interviewAgent'
import { formatErrorMessage } from '../../api/client'
import InterviewChatMessage, {
  type InterviewMessageItem,
} from '../../components/interview-agent/InterviewChatMessage'
import InterviewStarterCards from '../../components/interview-agent/InterviewStarterCards'
import type { InterviewAgentContextResponse, InterviewDocumentResponse } from '../../api/types'

let msgIdCounter = 0
function generateId(): string {
  return `interview-msg-${++msgIdCounter}-${Date.now()}`
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx']
const MAX_DOC_SIZE_MB = 10

const DOC_QUICK_ACTIONS = [
  { label: 'Summarize', prompt: 'Summarize this document.' },
  { label: 'Interview Questions', prompt: 'Generate 10 interview questions from this document.' },
  { label: 'Q&A Pairs', prompt: 'Generate questions and answers from this document.' },
  { label: 'Important Topics', prompt: 'What are the most important topics in this document?' },
  { label: 'Study Roadmap', prompt: 'Create a study roadmap from this document.' },
]

export default function InterviewAgentPage() {
  const { token } = useAuth()
  const [context, setContext] = useState<InterviewAgentContextResponse | null>(null)
  const [targetRole, setTargetRole] = useState<string>('')
  const [messages, setMessages] = useState<InterviewMessageItem[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditingRole, setIsEditingRole] = useState(false)
  const [customRoleInput, setCustomRoleInput] = useState('')

  // Popover confirmations
  const [showNewSessionPopover, setShowNewSessionPopover] = useState(false)
  const [showRemoveDocConfirm, setShowRemoveDocConfirm] = useState(false)

  // Document state
  const [activeDocument, setActiveDocument] = useState<InterviewDocumentResponse | null>(null)
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isRemovingDoc, setIsRemovingDoc] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const roleInputRef = useRef<HTMLInputElement>(null)
  const prevMessagesLengthRef = useRef(messages.length)

  // Auto-scroll to bottom on new messages or generation completion
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current || isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessagesLengthRef.current = messages.length
  }, [messages, isLoading])

  // Focus role input when editing starts
  useEffect(() => {
    if (isEditingRole) {
      roleInputRef.current?.focus()
    }
  }, [isEditingRole])

  // Load candidate interview readiness context (+ active document)
  useEffect(() => {
    if (!token) return

    interviewAgentApi
      .getContext(token)
      .then((data) => {
        setContext(data)
        if (data.target_role) {
          setTargetRole(data.target_role)
          setCustomRoleInput(data.target_role)
        } else if (data.recommended_roles && data.recommended_roles.length > 0) {
          setTargetRole(data.recommended_roles[0])
          setCustomRoleInput(data.recommended_roles[0])
        }
        if (data.active_document) {
          setActiveDocument(data.active_document)
        }
      })
      .catch((err) => {
        console.warn('Failed to load interview context:', err)
      })
  }, [token])

  // ───────────────────────────────────────────────
  // Document Upload Handler
  // ───────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !token || isUploading) return

      // Reset file input so same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = ''

      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadError(`Unsupported file type '${ext}'. Only PDF and DOCX files are allowed.`)
        return
      }

      if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
        setUploadError(`File too large. Maximum allowed size is ${MAX_DOC_SIZE_MB} MB.`)
        return
      }

      setUploadError(null)
      setUploadingFileName(file.name)
      setIsUploading(true)

      try {
        const doc = await interviewAgentApi.uploadDocument(file, token)
        setActiveDocument(doc)

        // Inject a clean welcome message in the chat
        const welcomeMsg: InterviewMessageItem = {
          id: generateId(),
          role: 'assistant',
          content: `**Document uploaded successfully!**\n\n**${doc.filename}** (${doc.file_type.toUpperCase()}) has been indexed with ${doc.chunk_count} semantic segments.\n\nYou can now:\n- **Summarize** the document\n- **Generate interview questions**\n- **Generate Q&A pairs**\n- Find **important topics**\n- Build a **study roadmap**\n- Ask any specific technical question from the document`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, welcomeMsg])
      } catch (err) {
        setUploadError(formatErrorMessage(err) || 'Failed to upload document. Please try again.')
      } finally {
        setIsUploading(false)
        setUploadingFileName(null)
      }
    },
    [token, isUploading],
  )

  const handleConfirmRemoveDocument = useCallback(async () => {
    if (!token || !activeDocument || isRemovingDoc) return

    setIsRemovingDoc(true)
    setShowRemoveDocConfirm(false)

    try {
      await interviewAgentApi.removeActiveDocument(token)
      setActiveDocument(null)
      setUploadError(null)
      const removedMsg: InterviewMessageItem = {
        id: generateId(),
        role: 'assistant',
        content: `**Document removed.** Your interview preparation context has been reset to resume-only mode. You can upload a new study document at any time.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, removedMsg])
    } catch (err) {
      setUploadError(formatErrorMessage(err) || 'Failed to remove document.')
    } finally {
      setIsRemovingDoc(false)
    }
  }, [token, activeDocument, isRemovingDoc])

  // ───────────────────────────────────────────────
  // Chat Handlers
  // ───────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const messageText = (textToSend || input).trim()
      if (!messageText || isLoading || !token) return

      const userMsg: InterviewMessageItem = {
        id: generateId(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      }

      const loadingMsg: InterviewMessageItem = {
        id: generateId(),
        role: 'assistant',
        content: '',
        isLoading: true,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, loadingMsg])
      setInput('')
      setIsLoading(true)

      // Build history for multi-turn coach continuity
      const history = messages
        .filter((m) => !m.isLoading && !m.isError)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      try {
        const response = await interviewAgentApi.chat(
          {
            message: messageText,
            target_role: targetRole || undefined,
            conversation_history: history,
          },
          token,
        )

        if (response.target_role && !targetRole) {
          setTargetRole(response.target_role)
          setCustomRoleInput(response.target_role)
        }

        // Sync active document from response if updated
        if (response.active_document) {
          setActiveDocument(response.active_document)
        }

        const assistantMsg: InterviewMessageItem = {
          id: generateId(),
          role: 'assistant',
          content: response.answer,
          target_role: response.target_role || targetRole,
          roadmap_data: response.roadmap_data,
          timestamp: new Date(),
        }

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== loadingMsg.id)
          return [...filtered, assistantMsg]
        })
      } catch (err) {
        const errorText = formatErrorMessage(err)
        const errorMsg: InterviewMessageItem = {
          id: generateId(),
          role: 'assistant',
          content: errorText || 'Interview Agent is temporarily unavailable. Please try again.',
          isError: true,
          failedPrompt: messageText,
          timestamp: new Date(),
        }

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== loadingMsg.id)
          return [...filtered, errorMsg]
        })
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, token, messages, targetRole],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && input.trim()) {
        handleSendMessage()
      }
    }
  }

  // Handle New Session
  const handleNewSessionClick = () => {
    if (messages.length === 0) {
      return
    }
    setShowNewSessionPopover(true)
  }

  const handleConfirmNewSession = () => {
    setMessages([])
    setShowNewSessionPopover(false)
  }

  const handleApplyCustomRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (customRoleInput.trim()) {
      setTargetRole(customRoleInput.trim())
      setIsEditingRole(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '1040px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px)',
        minHeight: '480px',
      }}
    >
      {/* Top Header Card */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-alt)',
          border: '1px solid var(--border)',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          </div>
          <div>
            <h1 className="headline-lg" style={{ margin: 0, fontSize: '1.25rem' }}>
              Interview Preparation Agent
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              Interactive interview coaching grounded in your candidate resume and uploaded materials.
            </p>
          </div>
        </div>

        {/* Right Controls: Target Role & New Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Target Role Badge / Editor */}
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {!isEditingRole ? (
              <div
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Target Role:
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-text)' }}>
                  {targetRole || 'Not Selected'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomRoleInput(targetRole)
                    setIsEditingRole(true)
                  }}
                  title="Edit target role"
                  aria-label="Edit target role"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <form onSubmit={handleApplyCustomRole} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="target-role-input" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Target Role
                  </label>
                  <input
                    ref={roleInputRef}
                    id="target-role-input"
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="e.g. Python Developer"
                    style={{
                      fontSize: '0.8rem',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--accent)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      width: '150px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingRole(false)}
                    style={{
                      fontSize: '0.74rem',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      fontSize: '0.74rem',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* New Session Button with Confirmation Popover */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={handleNewSessionClick}
              title="New session"
              aria-label="New session"
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                color: messages.length > 0 ? 'var(--text)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = messages.length > 0 ? 'var(--text)' : 'var(--text-muted)'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>New Session</span>
            </button>

            {/* Popover confirmation */}
            {showNewSessionPopover && (
              <>
                <div
                  onClick={() => setShowNewSessionPopover(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 90,
                  }}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="new-session-heading"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    backgroundColor: 'var(--bg-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '14px',
                    boxShadow: 'var(--shadow)',
                    zIndex: 100,
                  }}
                >
                  <h4 id="new-session-heading" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    Start a new session?
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
                    Your current conversation will be cleared.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowNewSessionPopover(false)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmNewSession}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--accent)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      New Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '12px',
        }}
      >
        {messages.length === 0 ? (
          <InterviewStarterCards
            context={context}
            activeDocument={activeDocument}
            onSelectPrompt={(prompt) => handleSendMessage(prompt)}
            onUploadClick={() => fileInputRef.current?.click()}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {messages.map((msg) => (
              <InterviewChatMessage
                key={msg.id}
                message={msg}
                onRetry={(prompt) => handleSendMessage(prompt)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Follow-up Pills when conversation is active */}
      {messages.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '6px',
            flexShrink: 0,
          }}
        >
          {(activeDocument
            ? [
                'Summarize this document',
                'Generate interview questions',
                'Create a revision roadmap',
                'What are the important interview topics?',
                'Explain the most complex concept',
              ]
            : [
                'Which role suits my resume?',
                'What are my strongest technical skills?',
                'Give me interview questions for my role',
                'Create a preparation roadmap',
                'What should I learn next?',
                'Take my mock interview',
              ]
          ).map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleSendMessage(pill)}
              disabled={isLoading}
              style={{
                whiteSpace: 'nowrap',
                padding: '5px 12px',
                borderRadius: '100px',
                backgroundColor: 'var(--bg-alt)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }
              }}
            >
              {pill}
            </button>
          ))}
        </div>
      )}

      {/* Upload Error Banner if present */}
      {uploadError && (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.82rem',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            title="Dismiss error"
            aria-label="Dismiss error"
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Chat Input Container */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-alt)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flexShrink: 0,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Upper row: Textarea + Send button */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeDocument
                ? `Ask about '${activeDocument.filename}': summarize, test concepts, generate questions...`
                : targetRole
                ? `Ask your Interview Coach about ${targetRole}, request questions, a roadmap, or say 'Take my mock interview'...`
                : "Ask for role recommendations, interview questions, preparation roadmaps, or mock interviews..."
            }
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '0.88rem',
              lineHeight: 1.45,
              resize: 'none',
              fontFamily: 'inherit',
              maxHeight: '120px',
              padding: '6px 4px',
            }}
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            title="Send message"
            aria-label="Send message"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius)',
              backgroundColor: input.trim() && !isLoading ? 'var(--accent)' : 'var(--border)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            {isLoading ? (
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Lower row: Document Upload, Status Chip & Quick Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid color-mix(in srgb, var(--border) 60%, transparent)',
          }}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            id="interview-doc-upload"
            type="file"
            accept=".pdf,.docx"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            disabled={isUploading || isRemovingDoc}
          />

          {/* Left: Attachment trigger OR Compact Active Document Chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isUploading ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Processing {uploadingFileName || 'document'}...</span>
              </div>
            ) : !activeDocument ? (
              <label
                htmlFor="interview-doc-upload"
                title="Upload PDF or DOCX (max 10MB)"
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
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span>Upload PDF / DOCX</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(max 10MB)</span>
              </label>
            ) : (
              <div
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px 3px 10px',
                    borderRadius: '100px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid color-mix(in srgb, var(--accent) 35%, var(--border))',
                    fontSize: '0.78rem',
                    color: 'var(--text)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span
                    style={{
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                    }}
                    title={activeDocument.filename}
                  >
                    {activeDocument.filename}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    ({activeDocument.chunk_count} chunks)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRemoveDocConfirm(true)}
                    disabled={isRemovingDoc}
                    title="Remove document"
                    aria-label="Remove document"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: isRemovingDoc ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px',
                      borderRadius: '50%',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                  >
                    {isRemovingDoc ? (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          border: '1.5px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#ef4444',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Remove Document Confirmation Popover */}
                {showRemoveDocConfirm && (
                  <>
                    <div
                      onClick={() => setShowRemoveDocConfirm(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                    />
                    <div
                      role="dialog"
                      aria-modal="true"
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: 0,
                        width: '260px',
                        backgroundColor: 'var(--bg-alt)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '12px 14px',
                        boxShadow: 'var(--shadow)',
                        zIndex: 100,
                      }}
                    >
                      <h5 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>
                        Remove document?
                      </h5>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.35 }}>
                        This will remove &ldquo;{activeDocument.filename}&rdquo; from your preparation context.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setShowRemoveDocConfirm(false)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmRemoveDocument}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#ef4444',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Quick Action Chips when document is active */}
          {activeDocument && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              {DOC_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleSendMessage(action.prompt)}
                  disabled={isLoading || isUploading}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '100px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    cursor: isLoading || isUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && !isUploading) {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--accent)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && !isUploading) {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global CSS for spinner and focus rings */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
