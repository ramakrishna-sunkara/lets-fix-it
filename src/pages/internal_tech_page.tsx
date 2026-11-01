import type { ReactNode } from 'react'

/**
 * Hidden briefing page — not linked in nav.
 * Open via address bar: /internal/tech
 * For judges: architecture + minimal flows.
 */

function Arrow() {
  return (
    <span className="flex shrink-0 items-center justify-center px-1 text-accent" aria-hidden>
      →
    </span>
  )
}

function DownArrow() {
  return (
    <div className="flex justify-center py-1 text-accent" aria-hidden>
      ↓
    </div>
  )
}

function FlowBox({
  title,
  subtitle,
  tone = 'default',
}: {
  title: string
  subtitle?: string
  tone?: 'default' | 'primary' | 'soft'
}) {
  const toneClass: string =
    tone === 'primary'
      ? 'bg-accent text-on-primary border-transparent'
      : tone === 'soft'
        ? 'bg-accent-soft text-on-primary-container border-transparent'
        : 'bg-paper text-charcoal border-line'
  return (
    <div
      className={`min-w-[7.5rem] flex-1 rounded-xl border px-3 py-2 text-center shadow-soft ${toneClass}`}
    >
      <p className="text-xs font-medium sm:text-sm">{title}</p>
      {subtitle ? (
        <p className="mt-0.5 text-[10px] opacity-80 sm:text-xs">{subtitle}</p>
      ) : null}
    </div>
  )
}

function FlowRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-y-2">
      {children}
    </div>
  )
}

export function InternalTechPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-12">
      <header className="md-card space-y-2 p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">
          Internal · not linked in nav
        </p>
        <h1 className="text-3xl font-normal tracking-tight text-charcoal">
          Architecture &amp; flows (judges)
        </h1>
        <p className="text-sm text-muted">
          Minimal diagrams for “how it works.” Open{' '}
          <code className="rounded bg-surface-container px-1.5 py-0.5 text-xs">
            /internal/tech
          </code>{' '}
          from the address bar only.
        </p>
      </header>

      <section className="md-card space-y-4 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          1. System architecture (one glance)
        </h2>
        <p className="text-sm text-muted">
          Browser never holds AI secrets. API talks to Gemma / YouTube; shops are
          search links only.
        </p>
        <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <FlowRow>
            <FlowBox title="React UI" subtitle="Vite + Tailwind" />
            <Arrow />
            <FlowBox title="Hono API" subtitle="/api/*" tone="soft" />
            <Arrow />
            <FlowBox title="Gemma 4" subtitle="via Gemini API" tone="primary" />
          </FlowRow>
          <DownArrow />
          <FlowRow>
            <FlowBox title="YouTube API" subtitle="real videos" />
            <Arrow />
            <FlowBox title="Parts links" subtitle="Amazon · Flipkart · Meesho" />
            <Arrow />
            <FlowBox title="Supabase" subtitle="optional auth" />
          </FlowRow>
        </div>
      </section>

      <section className="md-card space-y-4 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          2. Minimal request flow
        </h2>
        <p className="text-sm text-muted">
          What happens when the user sends a chat message (or photo).
        </p>
        <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <FlowRow>
            <FlowBox title="User" subtitle="text + photo" />
            <Arrow />
            <FlowBox title="POST /api/diagnose" subtitle="Hono" tone="soft" />
          </FlowRow>
          <DownArrow />
          <FlowRow>
            <FlowBox title="diagnose.ts" subtitle="prompt + history" />
            <Arrow />
            <FlowBox title="Gemma 4" subtitle="JSON only" tone="primary" />
            <Arrow />
            <FlowBox title="Zod" subtitle="validate" />
          </FlowRow>
          <DownArrow />
          <FlowRow>
            <FlowBox
              title="UI updates"
              subtitle="chat · prompts · evidence · videos · parts"
              tone="soft"
            />
          </FlowRow>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-charcoal px-4 py-3 text-[11px] leading-relaxed text-warm-white sm:text-xs">
{`User → /api/diagnose → Gemma 4 → Zod JSON → UI
         (Flash Lite only if Gemma times out)`}
        </pre>
      </section>

      <section className="md-card space-y-4 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          3. Car key demo — user journey
        </h2>
        <p className="text-sm text-muted">
          Same product path judges will see in the live demo.
        </p>
        <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <FlowRow>
            <FlowBox title="1. Symptom" subtitle="Car remote demo" />
            <Arrow />
            <FlowBox title="2. Questions" subtitle="Quick Answers" tone="soft" />
            <Arrow />
            <FlowBox title="3. Evidence" subtitle="Observed / Possible / Unknown" />
          </FlowRow>
          <DownArrow />
          <FlowRow>
            <FlowBox title="4. Plan" subtitle="CR2032 battery DIY" tone="primary" />
            <Arrow />
            <FlowBox title="5. Videos" subtitle="YouTube API" />
            <Arrow />
            <FlowBox title="6. Parts" subtitle="India shop links" />
          </FlowRow>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-graphite">
          <li>
            Start: <em>“My car remote key is not locking…”</em>
          </li>
          <li>
            API returns gathering JSON — LED? range? physical key?
          </li>
          <li>
            User answers → likely flat coin cell → beginner repair steps
          </li>
          <li>
            YouTube + Amazon.in / Flipkart / Meesho from search queries (no fake
            prices)
          </li>
        </ol>
      </section>

      <section className="md-card space-y-4 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          4. Inside diagnose.ts
        </h2>
        <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <FlowRow>
            <FlowBox title="System rules" subtitle="honesty + safety" />
            <Arrow />
            <FlowBox title="Locale" subtitle="EN or TE strings" />
            <Arrow />
            <FlowBox title="Multimodal" subtitle="inline image" />
          </FlowRow>
          <DownArrow />
          <FlowRow>
            <FlowBox title="Call Gemma" subtitle="gemma-4-26b-a4b-it" tone="primary" />
            <Arrow />
            <FlowBox title="Parse JSON" subtitle="strip noise" />
            <Arrow />
            <FlowBox title="Zod schema" subtitle="DiagnosisResponse" tone="soft" />
          </FlowRow>
        </div>
      </section>

      <section className="md-card space-y-4 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          5. Tech — what &amp; why
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">Technology</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-graphite">
              <TechRow
                name="React 19 + TypeScript"
                role="Frontend"
                purpose="Chat UI, evidence panels, profile, shopping"
              />
              <TechRow
                name="Vite 8"
                role="Build"
                purpose="Local HMR + SPA build for Vercel"
              />
              <TechRow
                name="Tailwind CSS 4"
                role="Styling"
                purpose="Material Design 3 tokens and layout"
              />
              <TechRow
                name="Hono 4"
                role="API"
                purpose="/api/diagnose, youtube, parts, health"
              />
              <TechRow
                name="Gemma 4"
                role="AI (primary)"
                purpose="Open-weight multimodal diagnosis → JSON"
              />
              <TechRow
                name="Gemini API"
                role="Access"
                purpose="Call Gemma; key stays on server"
              />
              <TechRow
                name="Zod 4"
                role="Validation"
                purpose="Trust structured diagnosis only"
              />
              <TechRow
                name="YouTube Data API"
                role="Videos"
                purpose="Real repair videos, no fake IDs"
              />
              <TechRow
                name="Shop search URLs"
                role="Parts"
                purpose="Amazon.in / Flipkart / Meesho links only"
              />
              <TechRow
                name="Supabase"
                role="Optional"
                purpose="Auth + saved repairs (RLS)"
              />
              <TechRow
                name="Vercel + esbuild"
                role="Host"
                purpose="SPA + bundled Node API"
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="md-card space-y-3 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">6. API map</h2>
        <ul className="space-y-2 text-sm text-graphite">
          <li>
            <code className="text-xs text-accent">GET /api/health</code> —
            config check · Gemma preferred
          </li>
          <li>
            <code className="text-xs text-accent">POST /api/diagnose</code> —
            core AI loop
          </li>
          <li>
            <code className="text-xs text-accent">POST /api/youtube-search</code>{' '}
            — videos
          </li>
          <li>
            <code className="text-xs text-accent">POST /api/parts-search</code> —
            shop links
          </li>
        </ul>
      </section>

      <p className="text-center text-xs text-muted">
        Local preview:{' '}
        <span className="font-medium text-charcoal">
          http://localhost:5173/internal/tech
        </span>
      </p>
    </article>
  )
}

function TechRow({
  name,
  role,
  purpose,
}: {
  name: string
  role: string
  purpose: string
}) {
  return (
    <tr className="border-b border-line/70 align-top">
      <td className="py-3 pr-3 font-medium text-charcoal">{name}</td>
      <td className="py-3 pr-3 text-muted">{role}</td>
      <td className="py-3">{purpose}</td>
    </tr>
  )
}
