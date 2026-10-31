import { useLocale } from '../context/locale_context'
import type { DiagnosticStage } from '../lib/types'

const ORDER: DiagnosticStage[] = [
  'gathering',
  'analyzing',
  'diagnosis_ready',
  'repair_plan',
]

export function StageChip({ stage }: { stage: DiagnosticStage }) {
  const { t } = useLocale()
  const labels: Record<DiagnosticStage, string> = {
    gathering: t.stages.gathering,
    analyzing: t.stages.analyzing,
    diagnosis_ready: t.stages.diagnosisReady,
    repair_plan: t.stages.repairPlan,
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label={t.stages.label}
    >
      {ORDER.map((item) => {
        const isActive: boolean = item === stage
        const isPast: boolean = ORDER.indexOf(item) < ORDER.indexOf(stage)
        return (
          <span
            key={item}
            className={`rounded-full border px-3 py-1 text-xs tracking-wide ${
              isActive
                ? 'border-accent bg-accent-soft text-accent'
                : isPast
                  ? 'border-line bg-paper text-charcoal'
                  : 'border-line/70 text-muted'
            }`}
          >
            {labels[item]}
          </span>
        )
      })}
    </div>
  )
}
