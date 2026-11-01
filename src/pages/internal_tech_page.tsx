/**
 * Hidden briefing page — not linked in nav.
 * Open via address bar: /internal/tech
 */
export function InternalTechPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-12">
      <header className="md-card space-y-2 p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">
          Internal · not linked in nav
        </p>
        <h1 className="text-3xl font-normal tracking-tight text-charcoal">
          LET&apos;S FIX IT — tech &amp; example flow
        </h1>
        <p className="text-sm text-muted">
          Type <code className="rounded bg-surface-container px-1.5 py-0.5 text-xs">/internal/tech</code>{' '}
          in the address bar when you need this page. Judges and users will not see a menu link.
        </p>
      </header>

      <section className="md-card space-y-4 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          Example flow — car key not working
        </h2>
        <ol className="list-decimal space-y-4 pl-5 text-sm text-graphite">
          <li>
            <p className="font-medium text-charcoal">User starts</p>
            <p className="mt-1">
              Taps <strong>Try: Car remote demo</strong> or types:{' '}
              <em>
                “My car remote key is not locking and unlocking the car
                properly. I bought the car about three years ago.”
              </em>
            </p>
          </li>
          <li>
            <p className="font-medium text-charcoal">App → API</p>
            <p className="mt-1">
              Browser calls <code className="text-xs">POST /api/diagnose</code>{' '}
              with the message, stage <code className="text-xs">gathering</code>,
              and locale (<code className="text-xs">en</code> /{' '}
              <code className="text-xs">te</code>).
            </p>
          </li>
          <li>
            <p className="font-medium text-charcoal">
              <code className="text-xs">server/diagnose.ts</code>
            </p>
            <p className="mt-1">
              Builds system rules + chat (+ optional photo) → calls{' '}
              <strong>Gemma 4</strong> via Gemini API → model must return{' '}
              <strong>one JSON object</strong> → Zod validates it.
            </p>
          </li>
          <li>
            <p className="font-medium text-charcoal">First AI reply (gathering)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>assistant_message</strong> — short chat reply
              </li>
              <li>
                <strong>product_summary</strong> — e.g. car remote / key fob
              </li>
              <li>
                <strong>interactive_prompts</strong> — Yes/No chips (LED blink?
                works closer to car? physical key still opens door?)
              </li>
              <li>
                <strong>findings</strong> — observations vs unknowns
              </li>
              <li>
                <strong>possible_causes</strong> — weak coin cell, button wear,
                interference (hypotheses, not facts)
              </li>
            </ul>
          </li>
          <li>
            <p className="font-medium text-charcoal">User answers Quick Answers</p>
            <p className="mt-1">
              e.g. LED is dim / only works next to the car → another{' '}
              <code className="text-xs">/api/diagnose</code> turn.
            </p>
          </li>
          <li>
            <p className="font-medium text-charcoal">
              Diagnosis ready / repair plan
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Likely cause: flat <strong>CR2032</strong> coin cell</li>
              <li>
                <strong>repair_tasks</strong> — open fob → swap battery → test
                (beginner)
              </li>
              <li>
                <strong>youtube_search_query</strong> → real YouTube API search
              </li>
              <li>
                <strong>parts_search_queries</strong> → Amazon.in / Flipkart /
                Meesho search links (no fake prices)
              </li>
              <li>
                Safety rule: no lithium-swelling questions for coin-cell fobs
              </li>
            </ul>
          </li>
          <li>
            <p className="font-medium text-charcoal">UI outcome</p>
            <p className="mt-1">
              Evidence ladder updates → DIY steps → repair videos → parts
              search links.
            </p>
          </li>
        </ol>
        <p className="rounded-xl bg-surface-container-low px-3 py-2 text-xs text-muted">
          Full loop: symptom → questions → evidence → DIY battery fix → real
          videos &amp; shop links.
        </p>
      </section>

      <section className="md-card space-y-4 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          Technical stack — what &amp; why
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">Technology</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 font-medium">Purpose in this project</th>
              </tr>
            </thead>
            <tbody className="text-graphite">
              <TechRow
                name="React 19 + TypeScript"
                role="Frontend UI"
                purpose="Build the chat workspace, evidence panels, profile, and shopping pages with typed components."
              />
              <TechRow
                name="Vite 8"
                role="Dev server & build"
                purpose="Fast local HMR; bundles the SPA for Vercel static hosting."
              />
              <TechRow
                name="Tailwind CSS 4"
                role="Styling"
                purpose="Utility classes + Material Design 3 tokens in index.css (surfaces, chips, buttons)."
              />
              <TechRow
                name="React Router 7"
                role="Client routing"
                purpose="SPA routes (/diagnose, /shopping, …). This page is /internal/tech with no nav link."
              />
              <TechRow
                name="Hono 4"
                role="API framework"
                purpose="Lightweight HTTP app for /api/diagnose, /api/youtube-search, /api/parts-search, /api/health."
              />
              <TechRow
                name="Gemma 4 (open-weight)"
                role="Primary AI model"
                purpose="Multimodal repair diagnosis (text + photo) → structured JSON. Accessed via Gemini API."
              />
              <TechRow
                name="Gemini API"
                role="Model access"
                purpose="Host/call Gemma (and Flash Lite fallback) with GEMINI_API_KEY kept server-side only."
              />
              <TechRow
                name="Zod 4"
                role="Schema validation"
                purpose="shared/diagnosis.ts validates model JSON so the UI never trusts raw free-form output."
              />
              <TechRow
                name="YouTube Data API v3"
                role="Video search"
                purpose="Real repair video IDs/titles for youtube_search_query — never invent video links."
              />
              <TechRow
                name="Amazon / Flipkart / Meesho URLs"
                role="Parts discovery"
                purpose="Honest search links only; no invented prices, stock, or compatibility claims."
              />
              <TechRow
                name="Supabase (optional)"
                role="Auth & storage"
                purpose="Email sign-in + RLS-backed repair_sessions for My Repairs; guest chat works without it."
              />
              <TechRow
                name="Vercel"
                role="Hosting"
                purpose="Static SPA + Node serverless api/index.js (esbuild-bundled Hono) for production demos."
              />
              <TechRow
                name="esbuild"
                role="API bundler"
                purpose="Compile server entry to CommonJS api/index.js that Vercel’s Node runtime can load."
              />
              <TechRow
                name="EN / TE i18n"
                role="Locale"
                purpose="UI strings + diagnose locale so Gemma replies in English or Telugu user-facing fields."
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="md-card space-y-3 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          Key API endpoints
        </h2>
        <ul className="space-y-2 text-sm text-graphite">
          <li>
            <code className="text-xs text-accent">GET /api/health</code> — keys
            present? preferred Gemma model name
          </li>
          <li>
            <code className="text-xs text-accent">POST /api/diagnose</code> —
            chat + optional image → structured diagnosis (
            <code className="text-xs">server/diagnose.ts</code>)
          </li>
          <li>
            <code className="text-xs text-accent">POST /api/youtube-search</code>{' '}
            — real YouTube results for a repair query
          </li>
          <li>
            <code className="text-xs text-accent">POST /api/parts-search</code> —
            merchant search URL list for part queries
          </li>
        </ul>
      </section>

      <section className="md-card space-y-3 p-5 sm:p-6">
        <h2 className="text-xl font-medium text-charcoal">
          Diagnose pipeline (short)
        </h2>
        <pre className="overflow-x-auto rounded-xl bg-surface-container-low p-4 text-xs leading-relaxed text-graphite">
{`UI chat (+ optional photo)
  → POST /api/diagnose
  → buildRequestContents (system rules + history + locale)
  → Gemma 4 first (Flash Lite only if timeout/fail)
  → extract JSON object
  → Zod DiagnosisResponseSchema
  → chat + Quick Answers + Evidence + video/parts queries`}
        </pre>
      </section>

      <p className="text-center text-xs text-muted">
        Bookmark:{' '}
        <span className="font-medium text-charcoal">/internal/tech</span>
        {' · '}
        Local: http://localhost:5173/internal/tech
        {' · '}
        Prod: https://lets-fix-it.vercel.app/internal/tech
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
