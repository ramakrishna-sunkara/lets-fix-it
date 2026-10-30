import { DiagnosticWorkspace } from '../components/diagnostic_workspace'

export function DiagnosePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Diagnose</h1>
        <p className="mt-1 text-sm text-muted">
          Continue or start a repair investigation with the diagnostic agent.
        </p>
      </div>
      <DiagnosticWorkspace />
    </div>
  )
}
