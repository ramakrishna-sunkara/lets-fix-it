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
  loadFunnyLoadingEnabled,
  saveFunnyLoadingEnabled,
} from '../lib/funny_loading'
import { resolveInteractivePrompts } from '../lib/interactive_prompts'
import { clearGuestSession } from '../lib/session_storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  ChatMessage,
  DiagnosisResponse,
  DiagnosticStage,
} from '../lib/types'
import { useAuth } from '../context/auth_context'
import { useLocale } from '../context/locale_context'
import { ConfigStatus } from './config_status'
import { FunnyLoadingMascot } from './funny_loading_mascot'
import {
  InteractivePrompts,
  type PromptAnswer,
} from './interactive_prompts'
import { ResultsPanel } from './results_panel'
import { StageChip } from './stage_chip'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function looksLikeNewProblem(text: string): boolean {
  return /^(my|the|this)\b.+\b(is not|isn't|stopped|won't|will not|not working|broken)/i.test(
    text.trim(),
  )
}

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
  const { t, locale, speechLang } = useLocale()
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
  const [contextNote, setContextNote] = useState<string | null>(null)
  const [isFunnyLoadingEnabled, setIsFunnyLoadingEnabled] = useState<boolean>(
    () => loadFunnyLoadingEnabled(),
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Guest localStorage sessions are not required for the POC and caused
    // stale-schema crashes — clear any leftover and keep chat in memory only.
    clearGuestSession()
  }, [])

  const toggleFunnyLoading = () => {
    setIsFunnyLoadingEnabled((prev) => {
      const next: boolean = !prev
      saveFunnyLoadingEnabled(next)
      return next
    })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const demoStarters = useMemo(
    () => [
      {
        id: 'demo-car-key',
        label: t.home.demoCar,
        text: t.home.demoCarText,
      },
      {
        id: 'demo-speaker',
        label: t.home.demoSpeaker,
        text: t.home.demoSpeakerText,
      },
    ],
    [t],
  )

  const sessionBanner = useMemo(() => {
    const summary = diagnosis?.product_summary
    const label: string = [summary?.brand, summary?.model, summary?.category]
      .filter(Boolean)
      .join(' · ')
    if (label) {
      return `Active diagnosis: ${label}. Use Start over for a different product.`
    }
    return t.home.sessionBanner
  }, [diagnosis?.product_summary, t.home.sessionBanner])

  const interactivePrompts = useMemo(
    () => resolveInteractivePrompts(diagnosis),
    [diagnosis],
  )

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

  const sendMessage = async (
    rawText: string,
    options?: {
      baseMessages?: ChatMessage[]
      resetDiagnosis?: boolean
      notice?: string | null
      imageDataUrl?: string | null
      modelContent?: string
    },
  ) => {
    const text: string = rawText.trim()
    const imageToSend: string | null =
      options?.imageDataUrl !== undefined
        ? options.imageDataUrl
        : pendingImage
    if ((!text && !imageToSend) || isSending) {
      return
    }
    setError(null)
    setSaveNote(null)
    if (options?.notice) {
      setContextNote(options.notice)
    }
    const displayContent: string = text || 'Please analyze this photo.'
    const modelContent: string = options?.modelContent || displayContent
    const userMessage = createMessage(
      'user',
      displayContent,
      imageToSend || undefined,
    )
    const historyBase: ChatMessage[] =
      options?.baseMessages !== undefined ? options.baseMessages : messages
    const nextMessages: ChatMessage[] = [...historyBase, userMessage]
    const nextStage: DiagnosticStage = options?.resetDiagnosis
      ? 'gathering'
      : stage
    const nextProductSummary = options?.resetDiagnosis
      ? undefined
      : (diagnosis?.product_summary as Record<string, string> | undefined)
    setMessages(nextMessages)
    // Clear stale diagnosis immediately so old car-key questions cannot linger.
    setDiagnosis(null)
    if (options?.resetDiagnosis) {
      setStage('gathering')
    }
    setInput('')
    setPendingImage(null)
    setIsSending(true)
    try {
      const apiMessages = nextMessages.map((message, index) => {
        const isLatestUser: boolean =
          index === nextMessages.length - 1 && message.role === 'user'
        const payload: {
          role: 'user' | 'assistant'
          content: string
          imageBase64?: string
          imageMimeType?: string
        } = {
          role: message.role,
          content: isLatestUser ? modelContent : message.content,
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
        productSummary: nextProductSummary,
        diagnosticStage: nextStage,
        locale,
      })
      setDiagnosis(result)
      setStage(result.diagnostic_stage)
      const assistantMessage = createMessage(
        'assistant',
        result.assistant_message,
      )
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

  const startFreshDiagnosis = async (
    text: string,
    notice: string,
    imageDataUrl?: string | null,
  ): Promise<void> => {
    setContextNote(notice)
    await sendMessage(text, {
      baseMessages: [],
      resetDiagnosis: true,
      notice,
      imageDataUrl: imageDataUrl ?? null,
    })
  }

  const handleUserSubmit = async (rawText: string): Promise<void> => {
    const text: string = rawText.trim()
    if (!text && !pendingImage) {
      return
    }
    // No hardcoded product taxonomy — refresh when the user clearly starts a new
    // problem statement or attaches a new photo mid-session.
    const shouldSwitch: boolean =
      messages.length > 0 &&
      (Boolean(pendingImage) || looksLikeNewProblem(text))
    if (shouldSwitch) {
      await startFreshDiagnosis(
        text || 'Please analyze this photo.',
        'Started a new diagnosis so previous context does not mix in.',
        pendingImage,
      )
      return
    }
    await sendMessage(text)
  }

  const handlePromptAnswers = (answers: PromptAnswer[]): void => {
    if (answers.length === 0) {
      return
    }
    const displayContent: string = answers
      .map((item) => `${item.prompt.prompt}\n→ ${item.answer}`)
      .join('\n\n')
    const modelContent: string = answers
      .map((item) => `Answer to "${item.prompt.prompt}": ${item.answer}`)
      .join('\n')
    void sendMessage(displayContent, { modelContent })
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void handleUserSubmit(input)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleUserSubmit(input)
    }
  }

  const toggleMic = () => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setError(t.home.voiceUnsupported)
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
    recognition.lang = speechLang
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
    setContextNote(null)
  }

  return (
    <section className="space-y-4">
      <ConfigStatus />
      {!compactHero ? null : (
        <div className="rounded-3xl border border-line bg-paper/80 p-5 shadow-soft sm:p-7">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">
            {t.home.eyebrow}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl leading-tight text-charcoal sm:text-5xl">
            {t.home.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
            {t.home.subtitle}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#workspace"
              className="rounded-xl bg-charcoal px-4 py-2.5 text-sm text-warm-white hover:bg-graphite"
            >
              {t.home.ctaDiagnose}
            </a>
            <a
              href="/shopping"
              className="rounded-xl border border-line px-4 py-2.5 text-sm text-charcoal hover:bg-line/40"
            >
              {t.home.ctaExplore}
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
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={isFunnyLoadingEnabled}
                onChange={toggleFunnyLoading}
                className="rounded border-line accent-accent"
              />
              {t.home.funnyLoading}
            </label>
            <button
              type="button"
              onClick={resetSession}
              className="text-xs text-muted underline hover:text-charcoal"
            >
              {t.home.startOver}
            </button>
          </div>
        </div>
        <p className="mb-4 rounded-xl bg-accent-soft/60 px-3 py-2 text-xs text-accent">
          {sessionBanner}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {demoStarters.map((demo) => (
            <button
              key={demo.id}
              type="button"
              onClick={() =>
                void startFreshDiagnosis(
                  demo.text,
                  `Fresh ${demo.label} session started.`,
                )
              }
              className="rounded-full border border-line px-3 py-1.5 text-xs text-graphite hover:border-accent hover:text-accent"
              disabled={isSending}
            >
              {t.home.tryDemo}: {demo.label}
            </button>
          ))}
        </div>
        {contextNote ? (
          <p className="mb-4 rounded-xl border border-line bg-warm-white px-3 py-2 text-xs text-muted">
            {contextNote}
          </p>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[28rem] flex-col rounded-2xl border border-line bg-warm-white/70">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted">{t.home.emptyChat}</p>
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
                  {t.home.analyzing}
                </div>
              ) : null}
              {!isSending && interactivePrompts.length > 0 ? (
                <InteractivePrompts
                  key={interactivePrompts.map((prompt) => prompt.id).join('|')}
                  prompts={interactivePrompts}
                  disabled={isSending}
                  onSubmitAnswers={handlePromptAnswers}
                />
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
                    aria-label={t.home.removeImage}
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
                  aria-label={t.home.uploadImage}
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
                  aria-label={
                    isListening ? t.home.stopVoice : t.home.startVoice
                  }
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
                  placeholder={t.home.placeholder}
                  className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={isSending || (!input.trim() && !pendingImage)}
                  className="rounded-xl bg-accent p-2.5 text-white disabled:opacity-50"
                  aria-label={t.home.send}
                >
                  <SendHorizontal className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>

          <ResultsPanel diagnosis={diagnosis} />
        </div>
      </div>

      <FunnyLoadingMascot
        isVisible={isSending && isFunnyLoadingEnabled}
      />
    </section>
  )
}
