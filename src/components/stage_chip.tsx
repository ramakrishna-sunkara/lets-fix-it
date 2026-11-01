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
            className={`md-chip ${
              isActive
                ? 'md-chip-filter-active'
                : isPast
                  ? 'md-chip-selected'
                  : ''
            }`}
          >
            {labels[item]}
          </span>
        )
      })}
    </div>
  )
}
