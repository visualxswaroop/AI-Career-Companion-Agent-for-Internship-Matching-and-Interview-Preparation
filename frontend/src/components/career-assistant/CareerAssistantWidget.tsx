import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { careerAssistantApi } from '../../api/careerAssistant'
import { formatErrorMessage } from '../../api/client'
import type { MessageItem } from './ChatMessage'
import ChatWindow from './ChatWindow'
import ChatbotIcon from './ChatbotIcon'

let widgetMsgCounter = 0
function generateWidgetMsgId(): string {
  return `widget-msg-${++widgetMsgCounter}-${Date.now()}`
}

const MAX_CONVERSATION_HISTORY = 10

export default function CareerAssistantWidget() {
  const { token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const buildHistory = useCallback(() => {
    return messages
      .filter((m) => !m.isLoading && !m.isError)
      .slice(-MAX_CONVERSATION_HISTORY)
      .map((m) => ({ role: m.role, content: m.content }))
  }, [messages])

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!token) return

      const userMsg: MessageItem = {
        id: generateWidgetMsgId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      }

      const loadingMsg: MessageItem = {
        id: generateWidgetMsgId(),
        role: 'assistant',
        content: '',
        isLoading: true,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, loadingMsg])
      setIsLoading(true)

      try {
        const history = buildHistory()
        const response = await careerAssistantApi.chat(
          {
            message: text,
            conversation_history: history,
          },
          token,
        )

        const assistantMsg: MessageItem = {
          id: generateWidgetMsgId(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          timestamp: new Date(),
        }

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== loadingMsg.id)
          return [...filtered, assistantMsg]
        })
      } catch (err) {
        const errorText = formatErrorMessage(err)
        const errorMsg: MessageItem = {
          id: generateWidgetMsgId(),
          role: 'assistant',
          content: `⚠️ ${errorText || 'Career Assistant is temporarily unavailable. Please try again.'}`,
          isError: true,
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
    [token, buildHistory],
  )

  const handleClearChat = useCallback(() => {
    setMessages([])
  }, [])

  return (
    <>
      {/* Floating Chatbot Window with Glassmorphism */}
      {isOpen && (
        <div
          id="career-assistant-floating-window"
          className="career-assistant-floating-window glass-ai-window"
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: isExpanded ? 'min(680px, calc(100vw - 32px))' : '390px',
            height: isExpanded ? 'min(650px, calc(100vh - 110px))' : '530px',
            maxHeight: 'calc(100vh - 100px)',
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'widgetPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transition: 'width 0.25s ease, height 0.25s ease',
          }}
        >
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            isExpanded={isExpanded}
            onSendMessage={handleSendMessage}
            onToggleExpand={() => setIsExpanded((v) => !v)}
            onClose={() => setIsOpen(false)}
            onClearChat={handleClearChat}
          />
        </div>
      )}

      {/* Floating Chatbot Launcher Button */}
      <button
        type="button"
        id="career-assistant-launcher"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close Career Assistant' : 'Open Career Assistant'}
        aria-expanded={isOpen}
        title={isOpen ? 'Close Career Assistant' : 'Chat with Career Assistant'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f2ee8 0%, #3114cf 100%)',
          color: '#fff',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 24px rgba(49, 20, 207, 0.45), 0 2px 8px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 10px 28px rgba(49, 20, 207, 0.55), 0 3px 10px rgba(0, 0, 0, 0.16)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(49, 20, 207, 0.45), 0 2px 8px rgba(0, 0, 0, 0.12)'
        }}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <ChatbotIcon size={26} />
        )}
      </button>

      <style>{`
        @keyframes widgetPopIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @media (max-width: 640px) {
          .career-assistant-floating-window {
            bottom: 80px !important;
            right: 16px !important;
            width: calc(100vw - 32px) !important;
            height: calc(100vh - 100px) !important;
          }
          #career-assistant-launcher {
            bottom: 16px !important;
            right: 16px !important;
          }
        }
      `}</style>
    </>
  )
}
