import type { DiagnosisResponse } from '../lib/types'

export function EvidenceLadder({
  diagnosis,
}: {
  diagnosis: DiagnosisResponse
}) {
  const observations: string[] = Array.isArray(
    diagnosis.findings?.observations,
  )
    ? diagnosis.findings.observations
    : []
  const unknowns: string[] = Array.isArray(diagnosis.findings?.unknowns)
    ? diagnosis.findings.unknowns
    : []
  const visibleEvidence: string[] = Array.isArray(diagnosis.visible_evidence)
    ? diagnosis.visible_evidence
    : []
  const possibleCauses = Array.isArray(diagnosis.possible_causes)
    ? diagnosis.possible_causes
    : []
  const observedItems: string[] = [...observations, ...visibleEvidence]

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <section className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
        <h3 className="text-sm font-semibold text-charcoal">Observed</h3>
        <p className="mt-1 text-xs text-muted">
          Supported by your description or photograph
        </p>
        <ul className="mt-3 space-y-2 text-sm text-graphite">
          {observedItems.length === 0 ? (
            <li className="text-muted">No confirmed observations yet.</li>
          ) : (
            observedItems.map((item) => <li key={item}>• {item}</li>)
          )}
        </ul>
      </section>
      <section className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
        <h3 className="text-sm font-semibold text-charcoal">Possible causes</h3>
        <p className="mt-1 text-xs text-muted">Hypotheses — not confirmed faults</p>
        <ul className="mt-3 space-y-3 text-sm text-graphite">
          {possibleCauses.length === 0 ? (
            <li className="text-muted">Still gathering context.</li>
          ) : (
            possibleCauses.map((cause) => (
              <li key={cause.cause}>
                <p className="font-medium">{cause.cause}</p>
                <p className="text-xs text-muted">{cause.why_plausible}</p>
                <p className="mt-1 text-xs text-accent">
                  Confirm: {cause.how_to_confirm}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
      <section className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
        <h3 className="text-sm font-semibold text-charcoal">Still unknown</h3>
        <p className="mt-1 text-xs text-muted">Needs checks or clearer evidence</p>
        <ul className="mt-3 space-y-2 text-sm text-graphite">
          {unknowns.length === 0 ? (
            <li className="text-muted">No open unknowns listed.</li>
          ) : (
            unknowns.map((item) => <li key={item}>• {item}</li>)
          )}
        </ul>
      </section>
    </div>
  )
}
