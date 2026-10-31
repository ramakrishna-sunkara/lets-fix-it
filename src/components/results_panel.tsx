import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ExternalLink,
  PlayCircle,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import { searchParts, searchYoutube } from '../lib/api'
import type {
  DiagnosisResponse,
  PartsSearchResult,
  YoutubeVideoResult,
} from '../lib/types'
import { EvidenceLadder } from './evidence_ladder'
import { NearbyRepairPanel } from './nearby_repair_panel'
import { StageChip } from './stage_chip'
import { shouldShowNearbyRepairs } from '../lib/nearby_repairs'

export function ResultsPanel({
  diagnosis,
}: {
  diagnosis: DiagnosisResponse | null
}) {
  const [videos, setVideos] = useState<YoutubeVideoResult[]>([])
  const [parts, setParts] = useState<PartsSearchResult[]>([])
  const [videoError, setVideoError] = useState<string | null>(null)
  const [partsNote, setPartsNote] = useState<string | null>(null)
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  useEffect(() => {
    if (!diagnosis?.youtube_search_query) {
      setVideos([])
      setVideoError(null)
      setActiveVideoId(null)
      return
    }
    let cancelled = false
    setIsLoadingVideos(true)
    setVideoError(null)
    void searchYoutube(diagnosis.youtube_search_query)
      .then((result) => {
        if (cancelled) {
          return
        }
        setVideos(result.videos)
        setActiveVideoId(result.videos[0]?.videoId || null)
        if (result.empty) {
          setVideoError(
            result.message ||
              'No suitable YouTube results were found for this repair query.',
          )
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        setVideos([])
        setVideoError(
          error instanceof Error ? error.message : 'YouTube search failed',
        )
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingVideos(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [diagnosis?.youtube_search_query])

  useEffect(() => {
    if (!diagnosis?.parts_search_queries?.length) {
      setParts([])
      setPartsNote(null)
      return
    }
    let cancelled = false
    void searchParts(diagnosis.parts_search_queries)
      .then((result) => {
        if (cancelled) {
          return
        }
        setParts(result.results)
        setPartsNote(result.disclaimer || null)
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        setParts([])
        setPartsNote(
          error instanceof Error ? error.message : 'Parts search failed',
        )
      })
    return () => {
      cancelled = true
    }
  }, [diagnosis?.parts_search_queries])

  if (!diagnosis) {
    return (
      <aside className="rounded-3xl border border-dashed border-line bg-paper/70 p-6 text-sm text-muted">
        Diagnosis results will appear here after the assistant gathers enough
        context. Observations, hypotheses, and unknowns stay clearly separated.
      </aside>
    )
  }

  const repairTasks = Array.isArray(diagnosis.repair_tasks)
    ? diagnosis.repair_tasks
    : []
  const safetyWarnings = Array.isArray(diagnosis.safety_warnings)
    ? diagnosis.safety_warnings
    : []
  const productSummary = diagnosis.product_summary || {}
  const showDiy: boolean =
    !diagnosis.requires_professional_help &&
    repairTasks.some((task) => task.difficulty === 'beginner')

  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-line bg-paper p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Results
            </p>
            <h2 className="mt-1 font-display text-2xl text-charcoal">
              Structured diagnosis
            </h2>
          </div>
          <StageChip stage={diagnosis.diagnostic_stage || 'gathering'} />
        </div>
        <p className="mt-3 text-sm text-graphite">
          {productSummary.brand ||
          productSummary.model ||
          productSummary.category
            ? [
                productSummary.brand,
                productSummary.model,
                productSummary.year,
                productSummary.category,
              ]
                .filter(Boolean)
                .join(' · ')
            : 'Product details still incomplete'}
        </p>
        {diagnosis.confidence_explanation ? (
          <p className="mt-3 rounded-xl bg-warm-white px-3 py-2 text-sm text-muted">
            {diagnosis.confidence_explanation}
          </p>
        ) : null}
      </div>

      <EvidenceLadder diagnosis={diagnosis} />

      {safetyWarnings.length > 0 || diagnosis.requires_professional_help ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-danger">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Safety first
          </div>
          {diagnosis.requires_professional_help ? (
            <p className="mb-2">
              Professional help is recommended before continuing DIY work.
            </p>
          ) : null}
          <ul className="space-y-1">
            {safetyWarnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {shouldShowNearbyRepairs(diagnosis) ? (
        <NearbyRepairPanel diagnosis={diagnosis} />
      ) : null}

      <div className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Wrench className="h-4 w-4 text-accent" />
          Recommended next action
        </h3>
        <p className="mt-2 text-sm text-graphite">
          {diagnosis.recommended_next_step || 'Continue answering follow-ups.'}
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <PlayCircle className="h-4 w-4 text-accent" />
          Repair videos
        </h3>
        {diagnosis.youtube_search_query ? (
          <p className="mb-3 text-xs text-muted">
            Query: {diagnosis.youtube_search_query}
          </p>
        ) : (
          <p className="text-sm text-muted">
            A YouTube search query will appear once a repair direction is clear.
          </p>
        )}
        {isLoadingVideos ? (
          <p className="text-sm text-muted">Searching YouTube…</p>
        ) : null}
        {videoError ? (
          <p className="flex items-start gap-2 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {videoError}
          </p>
        ) : null}
        {activeVideoId ? (
          <div className="mb-3 overflow-hidden rounded-xl border border-line">
            <iframe
              title="Repair video"
              className="aspect-video w-full"
              src={`https://www.youtube.com/embed/${activeVideoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}
        <ul className="space-y-3">
          {videos.map((video) => (
            <li
              key={video.videoId}
              className="flex gap-3 rounded-xl border border-line/80 p-2"
            >
              <button
                type="button"
                onClick={() => setActiveVideoId(video.videoId)}
                className="shrink-0"
              >
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="h-16 w-28 rounded-lg object-cover"
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{video.title}</p>
                <p className="text-xs text-muted">{video.channelTitle}</p>
                <p className="mt-1 text-xs text-accent">
                  {video.matchQuality === 'model_specific'
                    ? 'Strong query match'
                    : 'Broadly relevant'}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {video.relevanceExplanation}
                </p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-accent underline"
                >
                  Open on YouTube <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
        <h3 className="text-sm font-semibold">Repair instructions</h3>
        {!showDiy && diagnosis.requires_professional_help ? (
          <p className="mt-2 text-sm text-muted">
            DIY steps are hidden because professional assistance is safer for
            this case.
          </p>
        ) : null}
        <div className="mt-3 space-y-3">
          {repairTasks.map((task) => (
            <details
              key={task.title}
              className="rounded-xl border border-line px-3 py-2"
              open={task.difficulty === 'beginner' && showDiy}
            >
              <summary className="cursor-pointer text-sm font-medium">
                {task.title}{' '}
                <span className="text-xs font-normal text-muted">
                  ({task.difficulty})
                </span>
              </summary>
              {task.difficulty !== 'beginner' || !showDiy ? (
                <p className="mt-2 text-xs text-warning">
                  Not presented as a beginner-friendly procedure.
                </p>
              ) : null}
              {task.tools.length > 0 ? (
                <p className="mt-2 text-xs text-muted">
                  Tools: {task.tools.join(', ')}
                </p>
              ) : null}
              {task.parts_hints.length > 0 ? (
                <p className="mt-1 text-xs text-muted">
                  Parts hints: {task.parts_hints.join(', ')}
                </p>
              ) : null}
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-graphite">
                {task.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </details>
          ))}
          {repairTasks.length === 0 ? (
            <p className="text-sm text-muted">
              Instructions appear when a repair direction is clear.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
        <h3 className="text-sm font-semibold">Replacement part searches</h3>
        <p className="mt-1 text-xs text-muted">
          Search links only — no invented prices or compatibility claims.
        </p>
        {partsNote ? (
          <p className="mt-2 text-xs text-muted">{partsNote}</p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {parts.map((part) => (
            <li
              key={`${part.merchant}-${part.url}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-line/80 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{part.title}</p>
                <p className="text-xs text-muted">{part.merchant}</p>
                <p className="mt-1 text-xs text-warning">{part.note}</p>
              </div>
              <a
                href={part.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs text-accent underline"
              >
                Open
              </a>
            </li>
          ))}
          {parts.length === 0 ? (
            <li className="text-sm text-muted">
              Parts links appear when the diagnosis suggests specific searches.
            </li>
          ) : null}
        </ul>
      </div>
    </aside>
  )
}
