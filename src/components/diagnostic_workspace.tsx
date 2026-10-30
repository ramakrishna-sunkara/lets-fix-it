import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  ImagePlus,
  LoaderCircle,
  Mic,
  MicOff,
  SendHorizontal,
  X,
} from 'lucide-react'
import { diagnoseProblem, splitDataUrl } from '../lib/api'
import {
  clearGuestSession,
  loadGuestSession,
  saveGuestSession,
} from '../lib/session_storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { ChatMessage, DiagnosisResponse, DiagnosticStage } from '../lib/types'
import { useAuth } from '../context/auth_context'
import { ConfigStatus } from './config_status'
import { ResultsPanel } from './results_panel'
import { StageChip } from './stage_chip'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const DEMO_STARTERS = [
  {
    id: 'car_remote',
    label: 'Car remote demo',
    text: 'My car remote key is not locking and unlocking the car properly. I bought the car about three years ago.',
  },
  {
    id: 'speaker',
    label: 'Bluetooth speaker demo',
    text: 'My Bluetooth speaker stopped working and will not charge. The charging light behaviour changed recently.',
  },
]

function createMessage(
  role: 'user' | 'assistant',
  content: string,
  imageDataUrl?: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    imageDataUrl,
    createdAt: new Date().toISOString(),
  }
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function DiagnosticWorkspace({
  compactHero = false,
}: {
  compactHero?: boolean
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null)
  const [stage, setStage] = useState<DiagnosticStage>('gathering')
  const [input, setInput] = useState<string>('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [saveNote, setSaveNote] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const guest = loadGuestSession()
    if (guest) {
      setMessages(guest.messages)
      setDiagnosis(guest.diagnosis)
      if (guest.diagnosis?.diagnostic_stage) {
        setStage(guest.diagnosis.diagnostic_stage)
      }
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  useEffect(() => {
    if (messages.length === 0 && !diagnosis) {
      return
    }
    saveGuestSession({
      title: diagnosis?.product_summary.model
        ? `${diagnosis.product_summary.brand || ''} ${diagnosis.product_summary.model}`.trim()
        : 'Guest diagnosis',
      messages,
      diagnosis,
      updatedAt: new Date().toISOString(),
    })
  }, [messages, diagnosis])

  const categoryBanner = useMemo(() => {
    const category: string | undefined = diagnosis?.product_summary.category
    if (!category) {
      return 'Soft-supported demos: car remotes and Bluetooth speakers. Other categories get limited guidance.'
    }
    const normalized: string = category.toLowerCase()
    if (
      normalized.includes('remote') ||
      normalized.includes('key') ||
      normalized.includes('speaker') ||
      normalized.includes('bluetooth')
    ) {
      return 'This session matches a primary demo category.'
    }
    return 'Limited support category — advice may be more generic. Confirm with a specialist when unsure.'
  }, [diagnosis?.product_summary.category])

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file: File | undefined = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError('Image must be 5MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPendingImage(String(reader.result))
      setUploadError(null)
    }
    reader.onerror = () => {
      setUploadError('Could not read that image. Try another file.')
    }
    reader.readAsDataURL(file)
  }

  const persistToSupabase = useCallback(
    async (
      nextMessages: ChatMessage[],
      nextDiagnosis: DiagnosisResponse | null,
    ) => {
      if (!user || !supabase || !isSupabaseConfigured) {
        return
      }
      const title: string =
        [
          nextDiagnosis?.product_summary.brand,
          nextDiagnosis?.product_summary.model,
        ]
          .filter(Boolean)
          .join(' ') || nextMessages[0]?.content.slice(0, 60) || 'Repair session'
      const { error: upsertError } = await supabase.from('repair_sessions').insert({
        user_id: user.id,
        title,
        category: nextDiagnosis?.product_summary.category || null,
        status: nextDiagnosis?.diagnostic_stage || 'gathering',
        product_summary: nextDiagnosis?.product_summary || {},
        messages: nextMessages,
        diagnosis: nextDiagnosis,
      })
      if (upsertError) {
        setSaveNote(`Could not save to My Repairs: ${upsertError.message}`)
      } else {
        setSaveNote('Session saved to My Repairs.')
      }
    },
    [user],
  )

  const sendMessage = async (rawText: string) => {
    const text: string = rawText.trim()
    if ((!text && !pendingImage) || isSending) {
      return
    }
    setError(null)
    setSaveNote(null)
    const userMessage = createMessage('user', text || 'Please analyze this photo.', pendingImage || undefined)
    const nextMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setPendingImage(null)
    setIsSending(true)
    try {
      const apiMessages = nextMessages.map((message) => {
        const payload: {
          role: 'user' | 'assistant'
          content: string
          imageBase64?: string
          imageMimeType?: string
        } = {
          role: message.role,
          content: message.content,
        }
        if (message.imageDataUrl) {
          const split = splitDataUrl(message.imageDataUrl)
          if (split) {
            payload.imageBase64 = split.base64
            payload.imageMimeType = split.mimeType
          }
        }
        return payload
      })
      const result = await diagnoseProblem({
        messages: apiMessages,
        productSummary: diagnosis?.product_summary as Record<string, string> | undefined,
        diagnosticStage: stage,
      })
      setDiagnosis(result)
      setStage(result.diagnostic_stage)
      const assistantMessage = createMessage('assistant', result.assistant_message)
      const withAssistant: ChatMessage[] = [...nextMessages, assistantMessage]
      setMessages(withAssistant)
      if (
        result.diagnostic_stage === 'diagnosis_ready' ||
        result.diagnostic_stage === 'repair_plan'
      ) {
        await persistToSupabase(withAssistant, result)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Diagnosis request failed')
    } finally {
      setIsSending(false)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void sendMessage(input)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage(input)
    }
  }

  const toggleMic = () => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setError('Voice input is not supported in this browser.')
      return
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }
    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript: string = event.results[0]?.[0]?.transcript || ''
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
      }
    }
    recognition.onerror = (event) => {
      setError(`Voice input error: ${event.error}`)
      setIsListening(false)
    }
    recognition.onend = () => {
      setIsListening(false)
    }
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const resetSession = () => {
    setMessages([])
    setDiagnosis(null)
    setStage('gathering')
    setError(null)
    setSaveNote(null)
    clearGuestSession()
  }

  return (
    <section className="space-y-4">
      <ConfigStatus />
      {!compactHero ? null : (
        <div className="rounded-3xl border border-line bg-paper/80 p-5 shadow-soft sm:p-7">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">
            Diagnostic workspace
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl leading-tight text-charcoal sm:text-5xl">
            Before You Replace It, Let&apos;s Fix It.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
            Understand what&apos;s broken, discover how to repair it, and find
            the right parts or professionals.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#workspace"
              className="rounded-xl bg-charcoal px-4 py-2.5 text-sm text-warm-white hover:bg-graphite"
            >
              Diagnose a Problem
            </a>
            <a
              href="/shopping"
              className="rounded-xl border border-line px-4 py-2.5 text-sm text-charcoal hover:bg-line/40"
            >
              Explore Repairs
            </a>
          </div>
        </div>
      )}

      <div
        id="workspace"
        className="rounded-3xl border border-line bg-paper p-4 shadow-soft sm:p-5"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <StageChip stage={stage} />
          <button
            type="button"
            onClick={resetSession}
            className="text-xs text-muted underline hover:text-charcoal"
          >
            Start over
          </button>
        </div>
        <p className="mb-4 rounded-xl bg-accent-soft/60 px-3 py-2 text-xs text-accent">
          {categoryBanner}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {DEMO_STARTERS.map((demo) => (
            <button
              key={demo.id}
              type="button"
              onClick={() => void sendMessage(demo.text)}
              className="rounded-full border border-line px-3 py-1.5 text-xs text-graphite hover:border-accent hover:text-accent"
              disabled={isSending}
            >
              Try: {demo.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[28rem] flex-col rounded-2xl border border-line bg-warm-white/70">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted">
                  Describe the malfunction in ordinary language. Add a photo if
                  you have one. The assistant will ask a few targeted follow-ups.
                </p>
              ) : null}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      message.role === 'user'
                        ? 'bg-charcoal text-warm-white'
                        : 'border border-line bg-paper text-graphite'
                    }`}
                  >
                    {message.imageDataUrl ? (
                      <img
                        src={message.imageDataUrl}
                        alt="Uploaded product"
                        className="mb-2 max-h-40 rounded-xl object-cover"
                      />
                    ) : null}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isSending ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Analyzing with Gemma 4…
                </div>
              ) : null}
              {diagnosis?.follow_up_questions?.length ? (
                <div className="rounded-xl border border-dashed border-line bg-paper p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Follow-ups
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-graphite">
                    {diagnosis.follow_up_questions.map((question) => (
                      <li key={question}>
                        <button
                          type="button"
                          className="text-left hover:text-accent"
                          onClick={() => setInput(question.replace(/\?$/, '') + ': ')}
                        >
                          • {question}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={onSubmit} className="border-t border-line p-3">
              {pendingImage ? (
                <div className="mb-2 flex items-center gap-2">
                  <img
                    src={pendingImage}
                    alt="Pending upload"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingImage(null)}
                    className="rounded-lg border border-line p-1 text-muted hover:text-charcoal"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              {uploadError ? (
                <p className="mb-2 text-xs text-danger">{uploadError}</p>
              ) : null}
              {error ? (
                <p className="mb-2 text-xs text-danger">{error}</p>
              ) : null}
              {saveNote ? (
                <p className="mb-2 text-xs text-accent">{saveNote}</p>
              ) : null}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  className="hidden"
                  onChange={handleFile}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-line p-2.5 text-muted hover:bg-line/40 hover:text-charcoal"
                  aria-label="Upload image"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`rounded-xl border p-2.5 ${
                    isListening
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-muted hover:bg-line/40 hover:text-charcoal'
                  }`}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onKeyDown}
                  rows={2}
                  placeholder="Tell me what's wrong with your product..."
                  className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={isSending || (!input.trim() && !pendingImage)}
                  className="rounded-xl bg-accent p-2.5 text-white disabled:opacity-50"
                  aria-label="Send"
                >
                  <SendHorizontal className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>

          <ResultsPanel diagnosis={diagnosis} />
        </div>
      </div>
    </section>
  )
}
