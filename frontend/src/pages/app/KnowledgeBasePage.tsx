import { useState, useEffect, useRef, useCallback } from 'react'
import { knowledgeBaseApi, type KBInternship } from '../../api/features'
import { useAuth } from '../../context/AuthContext'

// ── Voice / TTS helpers ─────────────────────────────────────────
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
let recognition: any = null
if (typeof window !== 'undefined') {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (SpeechRecognition) recognition = new SpeechRecognition()
  if (recognition) {
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
  }
}

function speak(text: string) {
  if (!synth) return
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 400))
  utterance.rate = 1.05
  synth.speak(utterance)
}

// ── Domain pill colors ──────────────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  'Software Engineering': '#4F46E5',
  'Data Science': '#06B6D4',
  'Machine Learning': '#8B5CF6',
  'Web Development': '#10B981',
  'Product Management': '#F97316',
  'UI/UX Design': '#EC4899',
  'Cybersecurity': '#EF4444',
  'Cloud Computing': '#0EA5E9',
  'DevOps': '#F59E0B',
  'Marketing': '#84CC16',
}
const getDomainColor = (d: string) => DOMAIN_COLORS[d] || '#6448F0'

// ── Mode badge ──────────────────────────────────────────────────
const MODE_BADGE: Record<string, { bg: string; fg: string }> = {
  Remote: { bg: 'rgba(16,185,129,0.15)', fg: '#10B981' },
  Hybrid: { bg: 'rgba(245,158,11,0.15)', fg: '#F59E0B' },
  'On-site': { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' },
}

export default function KnowledgeBasePage() {
  const { } = useAuth()
  const [internships, setInternships] = useState<KBInternship[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMode, setSelectedMode] = useState('')
  const [selected, setSelected] = useState<KBInternship | null>(null)

  // Q&A
  const [qaOpen, setQaOpen] = useState(false)
  const [qaInput, setQaInput] = useState('')
  const [qaHistory, setQaHistory] = useState<{ role: string; content: string }[]>([])
  const [qaLoading, setQaLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const qaRef = useRef<HTMLDivElement>(null)

  const fetchInternships = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await knowledgeBaseApi.listInternships({
        domain: selectedDomain || undefined,
        search: search || undefined,
        mode: selectedMode || undefined,
        limit: 60,
      })
      setInternships(data.internships)
      setDomains(data.domains)
      setTotal(data.total)
    } catch (e: any) {
      setError(e.message || 'Failed to load internships')
    } finally {
      setLoading(false)
    }
  }, [selectedDomain, search, selectedMode])

  useEffect(() => { fetchInternships() }, [fetchInternships])

  useEffect(() => {
    if (qaRef.current) {
      qaRef.current.scrollTop = qaRef.current.scrollHeight
    }
  }, [qaHistory])

  const handleQaSubmit = async (q?: string) => {
    const question = (q || qaInput).trim()
    if (!question) return
    setQaInput('')
    const newHistory = [...qaHistory, { role: 'user', content: question }]
    setQaHistory(newHistory)
    setQaLoading(true)
    try {
      const res = await knowledgeBaseApi.query(question, qaHistory)
      const answerMsg = { role: 'assistant', content: res.answer }
      setQaHistory([...newHistory, answerMsg])
      speak(res.answer)
    } catch {
      setQaHistory([...newHistory, { role: 'assistant', content: 'Unable to get answer. Please try again.' }])
    } finally {
      setQaLoading(false)
    }
  }

  const startListening = () => {
    if (!recognition) return
    setIsListening(true)
    recognition.start()
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setQaInput(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
  }

  const stopTTS = () => synth?.cancel()

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '6px' }}>
          Internship Directory
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
          Knowledge Base
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Browse {total} verified internship listings · Filter by domain · Ask AI questions with voice
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies, roles, skills..."
            style={{ width: '100%', paddingLeft: '38px', paddingRight: '12px', height: '40px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Mode filter */}
        <select
          value={selectedMode}
          onChange={e => setSelectedMode(e.target.value)}
          style={{ height: '40px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.875rem', padding: '0 12px', cursor: 'pointer' }}
        >
          <option value="">All Modes</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="On-site">On-site</option>
        </select>

        {/* Q&A toggle */}
        <button
          onClick={() => setQaOpen(v => !v)}
          style={{ height: '40px', padding: '0 16px', borderRadius: 'var(--radius)', background: qaOpen ? 'var(--accent)' : 'var(--surface)', color: qaOpen ? '#fff' : 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          AI Q&A
        </button>

        {/* TTS stop */}
        <button
          onClick={stopTTS}
          title="Stop speaking"
          style={{ height: '40px', width: '40px', borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        </button>
      </div>

      {/* Domain Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          onClick={() => setSelectedDomain('')}
          style={{ padding: '5px 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: !selectedDomain ? 'var(--accent)' : 'var(--surface)', color: !selectedDomain ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s' }}
        >
          All
        </button>
        {domains.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDomain(selectedDomain === d ? '' : d)}
            style={{ padding: '5px 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: selectedDomain === d ? getDomainColor(d) : 'var(--surface)', color: selectedDomain === d ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s', boxShadow: selectedDomain === d ? `0 2px 8px ${getDomainColor(d)}40` : 'none' }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Q&A Panel */}
      {qaOpen && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              🧠 Ask the Knowledge Base
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Voice enabled · TTS feedback</span>
          </div>

          {/* Suggested Questions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {['What are the best remote internships?', 'Which internships require Python?', 'Show me data science opportunities'].map(q => (
              <button key={q} onClick={() => handleQaSubmit(q)} style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Chat history */}
          <div ref={qaRef} style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', padding: '4px' }}>
            {qaHistory.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '24px' }}>
                Ask a question about internships, skills, or career paths…
              </p>
            )}
            {qaHistory.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 'var(--radius-lg)', fontSize: '0.875rem', lineHeight: '1.6',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text)',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                }}>
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <button onClick={() => speak(msg.content)} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.78rem' }}>
                      🔊
                    </button>
                  )}
                </div>
              </div>
            ))}
            {qaLoading && (
              <div style={{ display: 'flex', gap: '4px', padding: '10px 14px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out` }} />
                ))}
              </div>
            )}
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={qaInput}
              onChange={e => setQaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleQaSubmit()}
              placeholder="Type or use voice…"
              style={{ flex: 1, height: '40px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', padding: '0 14px', fontSize: '0.875rem', outline: 'none' }}
            />
            <button
              onClick={startListening}
              title="Voice input"
              style={{ width: '40px', height: '40px', borderRadius: 'var(--radius)', background: isListening ? '#EF4444' : 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isListening ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>
            <button
              onClick={() => handleQaSubmit()}
              disabled={!qaInput.trim() || qaLoading}
              style={{ padding: '0 16px', height: '40px', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', border: 'none', cursor: qaInput.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.875rem', opacity: qaInput.trim() ? 1 : 0.5 }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Internship Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelected(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '28px', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>{selected.role_title}</h2>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{selected.company}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: getDomainColor(selected.domain) + '20', color: getDomainColor(selected.domain), fontSize: '0.78rem', fontWeight: 700 }}>{selected.domain}</span>
              {MODE_BADGE[selected.mode] && (
                <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: MODE_BADGE[selected.mode].bg, color: MODE_BADGE[selected.mode].fg, fontSize: '0.78rem', fontWeight: 700 }}>{selected.mode}</span>
              )}
              <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>📍 {selected.location}</span>
              <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>⏱ {selected.duration_weeks}w</span>
              <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: '0.78rem', fontWeight: 700 }}>₹{selected.stipend_inr_per_month.toLocaleString()}/mo</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: '1.7', marginBottom: '16px' }}>{selected.description}</p>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Required Skills</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selected.required_skills.map(s => (
                  <span key={s} style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: '0.78rem', fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>

            {selected.preferred_skills.length > 0 && (
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Preferred Skills</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selected.preferred_skills.map(s => (
                    <span key={s} style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { speak(`Applying to ${selected.role_title} at ${selected.company}`); setSelected(null) }}
              style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}
            >
              ⚡ 1-Click Apply
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', height: '180px', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>⚠️ {error}</p>
          <button onClick={fetchInternships} style={{ padding: '10px 20px', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      ) : internships.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem' }}>No internships found. Try adjusting filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {internships.map(item => {
            const modeBadge = MODE_BADGE[item.mode]
            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                  e.currentTarget.style.borderColor = getDomainColor(item.domain) + '60'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                {/* Accent top border */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: getDomainColor(item.domain) }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: getDomainColor(item.domain), marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.domain}</p>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.role_title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.company}</p>
                  </div>
                  {modeBadge && (
                    <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-pill)', background: modeBadge.bg, color: modeBadge.fg, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>{item.mode}</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>📍 {item.location}</span>
                  <span>⏱ {item.duration_weeks}w</span>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>₹{item.stipend_inr_per_month.toLocaleString()}/mo</span>
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {item.required_skills.slice(0, 4).map(s => (
                    <span key={s} style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: '0.72rem', fontWeight: 600 }}>{s}</span>
                  ))}
                  {item.required_skills.length > 4 && (
                    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>+{item.required_skills.length - 4}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
    </div>
  )
}
