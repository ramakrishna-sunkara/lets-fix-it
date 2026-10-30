import type { DiagnosticStage } from '../lib/types'

const LABELS: Record<DiagnosticStage, string> = {
  gathering: 'Gathering',
  analyzing: 'Analyzing',
  diagnosis_ready: 'Diagnosis ready',
  repair_plan: 'Repair plan',
}

const ORDER: DiagnosticStage[] = [
  'gathering',
  'analyzing',
  'diagnosis_ready',
  'repair_plan',
]

export function StageChip({ stage }: { stage: DiagnosticStage }) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Diagnostic stage">
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
            {LABELS[item]}
          </span>
        )
      })}
    </div>
  )
}
