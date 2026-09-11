/**
 * VoiceResumePage.tsx
 *
 * AI-Driven Multilingual Voice Resume Architect — UI
 *
 * State machine:
 *   idle → recording → processing → follow-up → complete → generated
 *
 * Features:
 *   - Multilingual voice transcription (Web Speech API with continuous mode & auto-silence)
 *   - 100% English ATS resume output regardless of spoken input language (Telugu, Hindi, etc.)
 *   - Automatic grammar correction, verbal filler removal, and professional content refinement
 *   - Immediate "Build Resume Now" action — never blocks the user even if optional fields are missing
 *   - Live editable transcript display with manual tweak support
 *   - One-click executive ATS PDF download (jsPDF) & text export
 *   - Video input audio extraction via AudioContext
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { voiceResumeApi } from '../../api/voiceResume'
import { formatErrorMessage } from '../../api/client'
import { exportResumePdf } from '../../utils/resumePdf'
import type { ResumeData, ChatMessage } from '../../api/types'

// ─── Types ──────────────────────────────────────────────────────────────────

type Stage = 'idle' | 'recording' | 'processing' | 'follow-up' | 'complete' | 'generated'

interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
}

// ─── Language options ────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'es-ES', label: 'Spanish (Español)' },
  { code: 'fr-FR', label: 'French (Français)' },
  { code: 'de-DE', label: 'German (Deutsch)' },
]

// ─── SpeechRecognition shim ──────────────────────────────────────────────────

const SpeechRecognitionAPI =
  (typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
  null

// ─── TTS helper ─────────────────────────────────────────────────────────────

function speak(text: string, lang = 'en-US') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = lang
  utt.rate = 0.95
  window.speechSynthesis.speak(utt)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VoiceResumePage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [stage, setStage] = useState<Stage>('idle')
  const [language, setLanguage] = useState('en-US')
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([])
  const [extractedData, setExtractedData] = useState<ResumeData | null>(null)
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null)
  const [templateHint, setTemplateHint] = useState<'auto' | 'technical' | 'blue-collar'>('auto')
  const [generatedResume, setGeneratedResume] = useState<string | null>(null)
  const [templateUsed, setTemplateUsed] = useState<string | null>(null)
  const [generationMethod, setGenerationMethod] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Video-to-audio state
  const [videoMode, setVideoMode] = useState(false)
  const [videoSupported, setVideoSupported] = useState(true)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')
  const silenceTimerRef = useRef<any>(null)

  // Audio/video transcription via AI Whisper is supported across all browsers
  useEffect(() => {
    setVideoSupported(true)
  }, [])

  // ── Speech recognition helpers ────────────────────────────────

  const stopRecognition = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
  }, [])

  const startRecognition = useCallback(
    (onDone: (finalTranscript: string) => void) => {
      if (!SpeechRecognitionAPI) return

      stopRecognition()

      const rec = new SpeechRecognitionAPI()
      rec.lang = language
      rec.interimResults = true
      rec.continuous = true
      rec.maxAlternatives = 1

      let accumulated = transcriptRef.current ? transcriptRef.current + ' ' : ''

      rec.onresult = (event: any) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            accumulated += result[0].transcript + ' '
          } else {
            interim += result[0].transcript
          }
        }
        transcriptRef.current = accumulated
        setInterimText(interim)
        setTranscript((accumulated + interim).trim())

        // Silence timer: auto-complete if silence for 3.5s after some speech
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        if (accumulated.trim().length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecognition()
          }, 3500)
        }
      }

      rec.onend = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
        setInterimText('')
        const finalText = transcriptRef.current.trim()
        if (finalText) {
          onDone(finalText)
        } else {
          setStage(prev =>
            prev === 'recording'
              ? conversationHistory.length > 0
                ? 'follow-up'
                : 'idle'
              : prev,
          )
        }
      }

      rec.onerror = (event: any) => {
        console.error('[SpeechRecognition] error:', event.error)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        if (event.error !== 'no-speech') {
          setError(`Microphone error: ${event.error}. Please try again.`)
          setStage(conversationHistory.length > 0 ? 'follow-up' : 'idle')
        }
      }

      recognitionRef.current = rec
      rec.start()
    },
    [language, stopRecognition, conversationHistory.length],
  )

  // ── Core extraction flow ───────────────────────────────────────

  const handleTranscriptReady = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim()) {
        setError('No speech detected. Please try again.')
        setStage(conversationHistory.length === 0 ? 'idle' : 'follow-up')
        return
      }

      setTranscript(spokenText)
      setStage('processing')
      setIsProcessing(true)
      setError(null)

      const updatedHistory: ConversationTurn[] = [
        ...conversationHistory,
        { role: 'user', content: spokenText },
      ]

      try {
        const response = await voiceResumeApi.extract(
          {
            transcript: spokenText,
            conversation_history: updatedHistory.map(t => ({
              role: t.role,
              content: t.content,
            })) as ChatMessage[],
            language_hint: language.split('-')[0],
          },
          token!,
        )

        setExtractedData(prev => mergeExtractedData(prev, response.extracted_data))

        if (response.is_complete) {
          const assistantMsg = "All core profile details captured! Let's build your resume."
          setConversationHistory([
            ...updatedHistory,
            { role: 'assistant', content: assistantMsg },
          ])
          speak(assistantMsg, language)
          setFollowUpQuestion(null)
          setStage('complete')
        } else {
          const question =
            response.follow_up_question ||
            'Could you tell me more about your experience or education?'
          setFollowUpQuestion(question)
          setConversationHistory([
            ...updatedHistory,
            { role: 'assistant', content: question },
          ])
          speak(question, language)
          setStage('follow-up')
        }
      } catch (err) {
        setError(formatErrorMessage(err))
        setStage(conversationHistory.length === 0 ? 'idle' : 'follow-up')
      } finally {
        setIsProcessing(false)
      }
    },
    [conversationHistory, language, token],
  )

  // ── Manual re-extraction from editable text ───────────────────

  const handleManualExtract = useCallback(async () => {
    if (!transcript.trim()) return
    await handleTranscriptReady(transcript.trim())
  }, [transcript, handleTranscriptReady])

  // ── Record button handler ──────────────────────────────────────

  const handleRecord = useCallback(() => {
    if (stage === 'recording') {
      stopRecognition()
      return
    }
    window.speechSynthesis?.cancel()
    setInterimText('')
    setStage('recording')
    startRecognition(handleTranscriptReady)
  }, [stage, stopRecognition, startRecognition, handleTranscriptReady])

  // ── Video file handler ─────────────────────────────────────────

  const handleVideoFile = useCallback(
    async (file: File) => {
      if (!token) {
        setError('Please sign in to process video audio.')
        return
      }

      setError(null)
      setIsProcessing(true)
      setStage('processing')
      setProcessingStatus('🎬 Extracting audio track from video...')

      let blobToSend: Blob = file
      let filenameToSend = file.name

      // Step 1: Extract audio into a lightweight 16kHz mono WAV using Web Audio
      if (typeof AudioContext !== 'undefined') {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const audioCtx = new AudioContext()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
          const targetSampleRate = 16000
          const offline = new OfflineAudioContext(
            1,
            Math.ceil(audioBuffer.duration * targetSampleRate),
            targetSampleRate,
          )
          const source = offline.createBufferSource()
          source.buffer = audioBuffer
          source.connect(offline.destination)
          source.start()
          const renderedBuffer = await offline.startRendering()
          blobToSend = audioBufferToWavBlob(renderedBuffer)
          filenameToSend = 'extracted_audio.wav'
        } catch (audioErr) {
          console.warn('[video decode] AudioContext decode failed, falling back to direct upload:', audioErr)
          blobToSend = file
          filenameToSend = file.name
        }
      }

      try {
        // Step 2: Transcribe speech to text using Groq Whisper
        setProcessingStatus('🎙️ Transcribing speech with AI Whisper...')
        const transcribeRes = await voiceResumeApi.transcribe(
          blobToSend,
          filenameToSend,
          language.split('-')[0],
          token,
        )

        const speechText = (transcribeRes.transcript || '').trim()
        if (!speechText) {
          setError('No audible speech was detected in this file. Please upload a recording with clear spoken words.')
          setStage('idle')
          return
        }

        // Step 3: Populate transcript and editable text
        setTranscript(speechText)
        transcriptRef.current = speechText

        // Step 4: Extract structured resume profile
        setProcessingStatus('🧠 Extracting skills, experience, and profile details...')
        const extRes = await voiceResumeApi.extract(
          {
            transcript: speechText,
            language_hint: language.split('-')[0],
          },
          token,
        )

        const extracted = extRes.extracted_data
        setExtractedData(extracted)

        // Step 5: Automatically generate executive ATS resume from speech
        setProcessingStatus('✨ Generating your executive ATS resume...')
        const genRes = await voiceResumeApi.generate(
          {
            extracted_data: extracted,
            template_hint: templateHint,
          },
          token,
        )

        setGeneratedResume(genRes.resume_text)
        setTemplateUsed(genRes.template_used)
        setGenerationMethod(genRes.generation_method)
        setStage('generated')
        speak('Your video has been transcribed and your resume is ready!', language)
      } catch (err) {
        console.error('[video transcribe]', err)
        setError(formatErrorMessage(err))
        setStage('idle')
      } finally {
        setIsProcessing(false)
        setProcessingStatus(null)
      }
    },
    [token, language, templateHint],
  )

  // ── Generate resume (Unblocked & Flexible) ─────────────────────

  const handleGenerate = useCallback(
    async (overrideData?: ResumeData) => {
      if (!token) return

      let dataToUse = overrideData || extractedData

      // If data is empty but transcript exists, extract on the fly first
      if (
        !dataToUse ||
        Object.values(dataToUse).every(
          v => !v || (Array.isArray(v) && v.length === 0),
        )
      ) {
        if (transcript.trim()) {
          setIsProcessing(true)
          setError(null)
          try {
            const extRes = await voiceResumeApi.extract(
              {
                transcript: transcript.trim(),
                language_hint: language.split('-')[0],
              },
              token,
            )
            dataToUse = extRes.extracted_data
            setExtractedData(dataToUse)
          } catch (err) {
            setError(formatErrorMessage(err))
            setIsProcessing(false)
            return
          }
        } else {
          setError('Please speak or enter your experience details first.')
          return
        }
      }

      setIsProcessing(true)
      setError(null)
      try {
        const response = await voiceResumeApi.generate(
          { extracted_data: dataToUse, template_hint: templateHint },
          token,
        )
        setGeneratedResume(response.resume_text)
        setTemplateUsed(response.template_used)
        setGenerationMethod(response.generation_method)
        setStage('generated')
      } catch (err) {
        setError(formatErrorMessage(err))
      } finally {
        setIsProcessing(false)
      }
    },
    [extractedData, transcript, language, token, templateHint],
  )

  // ── Download handlers (PDF & Text) ─────────────────────────────

  const handleDownloadPdf = useCallback(() => {
    if (!generatedResume) return
    const candidateName = extractedData?.full_name || 'Resume'
    exportResumePdf(generatedResume, candidateName)
  }, [generatedResume, extractedData])

  const handleDownloadTxt = useCallback(() => {
    if (!generatedResume) return
    const blob = new Blob([generatedResume], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(extractedData?.full_name || 'Resume').replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [generatedResume, extractedData])

  const handleSendToAnalysis = useCallback(() => {
    if (!extractedData) return
    navigate('/app/resume', { state: { voiceResumeData: extractedData, resumeText: generatedResume } })
  }, [extractedData, generatedResume, navigate])

  const handleCopyText = useCallback(() => {
    if (!generatedResume) return
    navigator.clipboard.writeText(generatedResume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [generatedResume])

  // ── Reset ──────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    stopRecognition()
    window.speechSynthesis?.cancel()
    transcriptRef.current = ''
    setStage('idle')
    setTranscript('')
    setInterimText('')
    setConversationHistory([])
    setExtractedData(null)
    setFollowUpQuestion(null)
    setGeneratedResume(null)
    setTemplateUsed(null)
    setGenerationMethod(null)
    setError(null)
    setCopied(false)
  }, [stopRecognition])

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  const unsupported = SpeechRecognitionAPI === null
  const selectedLangLabel =
    LANGUAGE_OPTIONS.find(l => l.code === language)?.label || language

  // Can generate whenever there is any transcript or extracted data
  const canGenerate =
    Boolean(transcript.trim()) ||
    Boolean(
      extractedData &&
        Object.values(extractedData).some(
          v => v && (!Array.isArray(v) || v.length > 0),
        ),
    )

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <p className="label-accent" style={{ marginBottom: '8px' }}>
          Voice-First · Multilingual · ATS Optimized
        </p>
        <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
          Voice Resume Architect ✦
        </h1>
        <p className="body-md" style={{ color: 'var(--text-muted)' }}>
          Speak naturally in <strong>Telugu, Hindi, Tamil, English, or any language</strong>.
          The AI will transcribe your voice, refine and eliminate grammatical slips, extract your
          skills, and produce an ATS-optimised resume <strong>100% in English</strong> ready to
          download as an executive PDF.
        </p>
      </div>

      {/* ── Multilingual & English Guarantee Badge ────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          padding: '12px 18px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>🌐</span>
          <span>
            Input: <strong>{selectedLangLabel}</strong>
          </span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>➔</span>
          <span
            style={{
              fontWeight: 700,
              color: 'var(--accent-text)',
              backgroundColor: 'var(--accent-bg)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            Output: 100% English PDF
          </span>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
          }}
        >
          <span>✨ AI Content & Grammar Polish Active</span>
        </div>
      </div>

      {/* ── Browser compatibility notice ─────────────────────────── */}
      {unsupported && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
            color: 'var(--accent-text)',
            fontSize: '0.875rem',
          }}
        >
          ⚠️ <strong>Voice input requires Chrome or Edge.</strong> The Web Speech API is not
          available in this browser. Please open this page in Chrome or Microsoft Edge to use
          microphone recording.
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            marginBottom: '24px',
            fontSize: '0.875rem',
            color: 'var(--accent-text)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              flexShrink: 0,
            }}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Config row (language + template + video toggle) ──────── */}
      {stage !== 'generated' && (
        <div
          className="card"
          style={{
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'flex-end',
          }}
        >
          {/* Language selector */}
          <div style={{ flex: '1 1 200px' }}>
            <label
              htmlFor="vr-language"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Spoken Language
            </label>
            <select
              id="vr-language"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              disabled={stage === 'recording'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {LANGUAGE_OPTIONS.map(l => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Template hint */}
          <div style={{ flex: '1 1 200px' }}>
            <label
              htmlFor="vr-template"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Resume Format
            </label>
            <select
              id="vr-template"
              value={templateHint}
              onChange={e => setTemplateHint(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="auto">Auto-detect (Technical / Blue-collar)</option>
              <option value="technical">Technical / IT / Software</option>
              <option value="blue-collar">Blue-Collar / Trades / Logistics</option>
            </select>
          </div>

          {/* Video mode toggle */}
          <div style={{ flex: '0 0 auto', paddingBottom: '2px' }}>
            {videoSupported ? (
              <button
                id="vr-video-toggle"
                type="button"
                onClick={() => setVideoMode(v => !v)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${videoMode ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: videoMode ? 'var(--accent-bg)' : 'var(--surface)',
                  color: videoMode ? 'var(--accent-text)' : 'var(--text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                🎬 Video Input {videoMode ? 'On' : 'Off'}
              </button>
            ) : (
              <span
                title="Video input requires Chrome/Edge"
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-subtle)',
                  fontSize: '0.875rem',
                  cursor: 'not-allowed',
                  display: 'inline-block',
                }}
              >
                🎬 Video Input — Coming Soon
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Main interactive area ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '24px' }}>
        {stage !== 'generated' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 20px',
              gap: '20px',
            }}
          >
            {/* Animated mic circle */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: `3px solid ${stage === 'recording' ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: stage === 'recording' ? 'var(--accent-bg)' : 'var(--surface)',
                boxShadow:
                  stage === 'recording'
                    ? '0 0 0 8px rgba(196,82,42,0.15), 0 0 0 16px rgba(196,82,42,0.08)'
                    : 'none',
                transition: 'all 0.3s ease',
                animation: stage === 'recording' ? 'pulse 1.5s infinite' : 'none',
                cursor: !unsupported && !isProcessing ? 'pointer' : 'default',
                fontSize: '2.5rem',
              }}
              onClick={!unsupported && !isProcessing ? handleRecord : undefined}
              title={stage === 'recording' ? 'Click to finish' : 'Click to start speaking'}
              role={!unsupported ? 'button' : undefined}
              aria-label={stage === 'recording' ? 'Stop recording' : 'Start recording'}
            >
              {stage === 'recording' ? '🔴' : stage === 'complete' ? '✅' : '🎙️'}
            </div>

            {/* Status text */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '6px',
                }}
              >
                {stage === 'idle' && 'Ready to record'}
                {stage === 'recording' && `Listening in ${selectedLangLabel}… speak naturally`}
                {stage === 'processing' && 'Translating, refining & extracting fields…'}
                {stage === 'follow-up' && 'Follow-up question (Optional)'}
                {stage === 'complete' && 'All key details extracted!'}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  maxWidth: '520px',
                }}
              >
                {stage === 'idle' &&
                  'Click the mic and speak about your name, role, work experience, and skills.'}
                {stage === 'recording' && (
                  <span style={{ color: 'var(--accent-text)', fontWeight: 500 }}>
                    {interimText || 'Speak freely… when you finish, click stop or pause.'}
                  </span>
                )}
                {stage === 'follow-up' && (
                  <div
                    style={{
                      padding: '12px 18px',
                      backgroundColor: 'var(--accent-bg)',
                      border: '1px solid var(--accent)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--accent-text)',
                      marginTop: '6px',
                    }}
                  >
                    <strong>AI Follow-up:</strong> "{followUpQuestion}"
                  </div>
                )}
                {stage === 'complete' &&
                  'Your profile is complete. Click "Generate Resume" below to build your ATS document.'}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: '6px',
              }}
            >
              {/* Mic toggle */}
              {!unsupported && (
                <button
                  id="vr-record-btn"
                  type="button"
                  onClick={handleRecord}
                  disabled={isProcessing}
                  style={{
                    padding: '12px 26px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    backgroundColor: stage === 'recording' ? '#dc2626' : 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {stage === 'recording' ? '⏹ Finish Speaking' : '🎙 Record Voice'}
                </button>
              )}

              {/* UNBLOCKED BUILD RESUME BUTTON: Always accessible when speech/text exists */}
              {canGenerate && stage !== 'recording' && (
                <button
                  id="vr-generate-btn"
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isProcessing}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isProcessing ? 'Building ATS Resume…' : '✨ Build Resume Now'}
                </button>
              )}

              {/* Replay follow-up question audio */}
              {stage === 'follow-up' && (
                <button
                  id="vr-replay-question-btn"
                  type="button"
                  onClick={() => followUpQuestion && speak(followUpQuestion, language)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  🔊 Replay Question
                </button>
              )}
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid var(--border)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Translating & refining ATS content with AI…
              </div>
            )}
          </div>
        )}

        {/* Video file input */}
        {videoMode && stage !== 'generated' && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '24px',
              backgroundColor: 'var(--surface)',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <div style={{ maxWidth: '520px', margin: '0 auto' }}>
              <p
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '6px',
                }}
              >
                📹 Upload Video / Audio to Generate Resume
              </p>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                  lineHeight: 1.5,
                }}
              >
                Upload any video or audio clip (.mp4, .webm, .mov, .m4a, .mp3, .wav). AI Whisper transcribes your speech and automatically extracts your experience to build an ATS resume.
              </p>
              <input
                id="vr-video-input"
                ref={videoInputRef}
                type="file"
                accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.avi,.mp3,.wav,.m4a"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) void handleVideoFile(file)
                  if (e.target) e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => videoInputRef.current?.click()}
                style={{
                  padding: '11px 24px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f2ee8 0%, #3114cf 100%)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(49, 20, 207, 0.28)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>📁</span>
                <span>{isProcessing ? 'Processing Video...' : 'Choose Video or Audio File'}</span>
              </button>

              {isProcessing && processingStatus && (
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-text)' }}>
                    {processingStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Generated Resume View ─────────────────────────────────── */}
        {stage === 'generated' && generatedResume && (
          <div>
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                backgroundColor: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--accent-text)',
                    backgroundColor: 'var(--accent-bg)',
                    padding: '4px 12px',
                    borderRadius: '100px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {templateUsed} Template
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Refined & Generated in English{generationMethod ? ` · via ${generationMethod}` : ''}
                </span>
              </div>

              {/* Action Buttons: PDF, TXT, Copy, Restart */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  id="vr-download-pdf-btn"
                  type="button"
                  onClick={handleDownloadPdf}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>⬇</span> Download ATS PDF (.pdf)
                </button>

                <button
                  id="vr-download-txt-btn"
                  type="button"
                  onClick={handleDownloadTxt}
                  style={{
                    padding: '9px 15px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  📄 Download .txt
                </button>

                <button
                  id="vr-copy-btn"
                  type="button"
                  onClick={handleCopyText}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Text'}
                </button>

                {/* ── NEW: Send to Resume Analysis ── */}
                <button
                  id="vr-analyze-btn"
                  type="button"
                  onClick={handleSendToAnalysis}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f2ee8 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79,46,232,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(79,46,232,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,46,232,0.3)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Analyze Resume →
                </button>

                <button
                  id="vr-restart-btn"
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  ↺ Start Over
                </button>
              </div>
            </div>

            {/* Resume Preview */}
            <pre
              style={{
                padding: '28px',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.86rem',
                lineHeight: 1.75,
                color: 'var(--text)',
                backgroundColor: 'var(--bg)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              }}
            >
              {generatedResume}
            </pre>
          </div>
        )}
      </div>

      {/* ── Editable Live Spoken Transcript Card ─────────────────── */}
      {stage !== 'generated' && (transcript || interimText) && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              📝 Spoken Transcript (Editable)
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Language: {selectedLangLabel}
            </span>
          </div>

          <div style={{ padding: '16px 20px' }}>
            <textarea
              id="vr-transcript-textarea"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Your spoken transcript appears here. You can also edit or add text manually."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '12px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={handleManualExtract}
                disabled={isProcessing || !transcript.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isProcessing || !transcript.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                🔍 Extract / Refresh Fields
              </button>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isProcessing || !transcript.trim()}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isProcessing || !transcript.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                ✨ Build Resume from this text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extracted fields preview ──────────────────────────────── */}
      {extractedData && stage !== 'idle' && stage !== 'generated' && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              Extracted Profile Fields (Translated into English)
            </p>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isProcessing}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Generate Resume ➔
            </button>
          </div>
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {Object.entries(extractedData).map(([key, val]) => {
              if (!val || (Array.isArray(val) && val.length === 0)) return null
              const display = Array.isArray(val) ? val.join(', ') : String(val)
              return (
                <div
                  key={key}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    maxWidth: '340px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--accent-text)',
                      marginRight: '6px',
                    }}
                  >
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span style={{ color: 'var(--text)', wordBreak: 'break-word' }}>
                    {display.length > 80 ? display.slice(0, 80) + '…' : display}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Conversation history log ──────────────────────────────── */}
      {conversationHistory.length > 0 && stage !== 'generated' && (
        <div style={{ marginTop: '24px' }}>
          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            Voice Session Interaction Log
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conversationHistory.map((turn, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: turn.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 16px',
                    borderRadius:
                      turn.role === 'user'
                        ? 'var(--radius) var(--radius) 0 var(--radius)'
                        : 'var(--radius) var(--radius) var(--radius) 0',
                    backgroundColor:
                      turn.role === 'user' ? 'var(--accent-bg)' : 'var(--surface)',
                    border: `1px solid ${turn.role === 'user' ? 'var(--accent)' : 'var(--border)'}`,
                    fontSize: '0.875rem',
                    color: turn.role === 'user' ? 'var(--accent-text)' : 'var(--text)',
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: turn.role === 'user' ? 'var(--accent)' : 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    {turn.role === 'user' ? `You (${selectedLangLabel})` : 'AI Architect'}
                  </div>
                  {turn.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CSS animations ───────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0   rgba(196,82,42,0.25), 0 0 0 0   rgba(196,82,42,0.12); }
          70%  { box-shadow: 0 0 0 12px rgba(196,82,42,0),   0 0 0 24px rgba(196,82,42,0);   }
          100% { box-shadow: 0 0 0 0   rgba(196,82,42,0),   0 0 0 0   rgba(196,82,42,0);   }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ─── Utility: merge two ResumeData objects, preferring non-empty values ──────

function mergeExtractedData(prev: ResumeData | null, next: ResumeData): ResumeData {
  if (!prev) return next
  const merged: ResumeData = { ...prev }
  for (const key of Object.keys(next) as (keyof ResumeData)[]) {
    const nval = next[key]
    const pval = prev[key]
    if (Array.isArray(nval) && Array.isArray(pval)) {
      const combined = [...pval, ...nval]
      ;(merged as any)[key] = [...new Set(combined)]
    } else if (nval !== null && nval !== undefined && nval !== '') {
      ;(merged as any)[key] = nval
    }
  }
  return merged
}

// ─── Utility: AudioBuffer → WAV Blob ────────────────────────────────────────

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const channelData = buffer.getChannelData(0)
  const samples = channelData.length
  const byteRate = (sampleRate * numChannels * bitDepth) / 8
  const blockAlign = (numChannels * bitDepth) / 8
  const dataSize = samples * blockAlign
  const headerSize = 44

  const arrayBuffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(arrayBuffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}
