# LET'S FIX IT AI — Architecture & Technical Documentation

Hackathon POC: an honest AI repair diagnosis assistant.  
Tagline: **Before you replace it, let's understand it and see whether we can fix it.**

Live demo (when deployed): [https://lets-fix-it.vercel.app](https://lets-fix-it.vercel.app)

**Simple diagrams (use cases, chat flow, architecture):** [DIAGRAMS.md](./DIAGRAMS.md)

---

## 1. Product overview

| Capability | Behavior |
|---|---|
| Chat diagnosis | User describes a product problem (optional photo); server calls Gemma/Gemini and returns structured JSON |
| Evidence ladder | UI separates **Observed / Possible causes / Still unknown** |
| Interactive follow-ups | Yes/No, choice, and text prompts batch-submitted as answers |
| YouTube repair videos | Real YouTube Data API v3 search (no fabricated video IDs) |
| Parts search | External **Amazon.in / Flipkart / Meesho** search links only |
| Nearby repairs | Geolocation + Google Maps search links (client-side) |
| Auth / My Repairs | Optional Supabase email auth + RLS-backed session history |
| i18n | English (default) and Telugu for UI + diagnose locale |

Primary demos: **car remote keys** and **Bluetooth speakers**.

### Honesty rules

- Missing API keys → clear config errors; no fake diagnoses or fake YouTube IDs.
- Parts results are **search links**, not inventory/prices/compatibility claims.
- Confidence is qualitative text, not invented percentages.

---

## 2. High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                            │
│  React 19 + Vite + Tailwind + React Router                      │
│  LocaleProvider · AuthProvider · DiagnosticWorkspace            │
└────────────────────────────┬────────────────────────────────────┘
                             │  fetch('/api/*')
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API layer (Hono)                            │
│  Local: Node on :8787 (Vite proxies /api)                       │
│  Prod:  Vercel Node serverless (bundled api/index.js)           │
│  Routes: /api/health · /api/diagnose · /api/youtube-search ·    │
│          /api/parts-search                                      │
└───────┬──────────────────┬──────────────────┬───────────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────────────────┐
│ Google AI     │  │ YouTube Data  │  │ Merchant search URLs     │
│ Gemma / Gemini│  │ API v3        │  │ Amazon.in · Flipkart ·   │
│ (server key)  │  │ (server key)  │  │ Meesho (no API keys)     │
└───────────────┘  └───────────────┘  └──────────────────────────┘

Optional (browser → Supabase directly with anon key + RLS):
┌─────────────────────────────────────────────────────────────────┐
│ Supabase: Auth · Postgres (profiles, repair_sessions) · Storage │
└─────────────────────────────────────────────────────────────────┘
```

**Secrets never ship to the browser.** Only `VITE_*` vars are client-visible. `GEMINI_API_KEY` and `YOUTUBE_API_KEY` stay on the server / Vercel env.

---

## 3. Technology stack

### Frontend

| Tech | Role |
|---|---|
| React 19 | UI |
| TypeScript | Types across app / server / shared |
| Vite 8 | Dev server, SPA build |
| Tailwind CSS 4 | Styling (`@tailwindcss/vite`) |
| React Router 7 | Client routes |
| Lucide React | Icons |
| `@supabase/supabase-js` | Optional auth + My Repairs |

### Backend / API

| Tech | Role |
|---|---|
| Hono 4 | HTTP app (`server/app.ts`) |
| `@hono/node-server` | Local serve + Vercel Node request listener |
| Zod 4 | Diagnosis response schema (`shared/diagnosis.ts`) |
| Google Generative Language API | Gemma 4 + Gemini Flash Lite fallback |
| YouTube Data API v3 | Video search |
| esbuild | Bundle Hono app → `api/index.js` for Vercel |

### Data / auth (optional)

| Tech | Role |
|---|---|
| Supabase Auth | Email/password |
| Postgres + RLS | `profiles`, `repair_sessions` |
| Storage (migration) | Private repair images bucket (if enabled) |

### Hosting & tooling

| Tech | Role |
|---|---|
| Vercel | Primary host (static SPA + Node `/api`) |
| Netlify | Frontend-only fallback (`netlify.toml`) |
| GitHub Actions | `npm ci` + `npm run build` on push |
| Oxlint | Lint |
| tsx | Local API watch |

---

## 4. Repository layout

```
Lets Fix It/
├── api/
│   ├── index.js              # Generated CJS bundle for Vercel (build:api)
│   └── package.json          # { "type": "commonjs" } for Node function
├── docs/
│   └── ARCHITECTURE.md       # This document
├── public/
│   └── loading/              # Funny loading mascot video
├── scripts/
│   └── bundle_api.mjs        # esbuild entry for Vercel API
├── server/
│   ├── app.ts                # Hono routes (shared local + Vercel)
│   ├── diagnose.ts           # Gemma/Gemini diagnosis + locale rules
│   ├── env.ts                # Server env loading
│   ├── index.ts              # Local Node listener (:8787) + .env loader
│   ├── parts.ts              # Amazon / Flipkart / Meesho search links
│   ├── youtube.ts            # YouTube search + ranking labels
│   └── vercel_entry.ts       # getRequestListener(app.fetch) for Vercel
├── shared/
│   └── diagnosis.ts          # Zod schemas + shared types
├── src/
│   ├── App.tsx               # Providers + routes
│   ├── components/           # Workspace, results, prompts, layout, …
│   ├── context/              # auth_context, locale_context
│   ├── lib/                  # api, i18n, supabase, types, helpers
│   └── pages/                # home, diagnose, shopping, my-repairs, profile, auth
├── supabase/
│   ├── migrations/001_init.sql
│   └── functions/            # Edge Function mirrors (optional deploy)
├── vercel.json
├── netlify.toml
├── vite.config.ts            # Proxy /api → :8787; auto-start API in dev
└── package.json
```

---

## 5. Frontend architecture

### Routing

| Path | Page | Purpose |
|---|---|---|
| `/` | Home | Diagnostic workspace (compact hero) |
| `/diagnose` | Diagnose | Full workspace |
| `/shopping` | Shopping | Manual parts query → merchant links |
| `/my-repairs` | My Repairs | Saved sessions (signed-in + Supabase) |
| `/profile` | Profile | Language EN/TE + account fields |
| `/auth` | Auth | Sign in / sign up / reset (redirects to profile when signed in) |

Providers wrap the tree: `LocaleProvider` → `AuthProvider` → `BrowserRouter` → `Layout`.

### Key UI modules

| Module | Responsibility |
|---|---|
| `diagnostic_workspace.tsx` | Chat, demos, photo upload, voice input, diagnose calls |
| `interactive_prompts.tsx` | Batch Quick Answers (yes/no, choice, text) |
| `results_panel.tsx` | Evidence ladder, YouTube, parts, nearby shops |
| `evidence_ladder.tsx` | Observed / hypotheses / unknowns |
| `nearby_repair_panel.tsx` | Geolocation + Maps search links |
| `funny_loading_mascot.tsx` | Optional loading video overlay |
| `config_status.tsx` | `/api/health` banner + missing-key warnings |

### Client → API

`src/lib/api.ts` calls same-origin `/api/*`:

- `GET /api/health`
- `POST /api/diagnose` — body includes `messages`, optional `productSummary`, `diagnosticStage`, **`locale`**
- `POST /api/youtube-search` — `{ query }`
- `POST /api/parts-search` — `{ queries: string[] }`

Locally Vite proxies `/api` → `http://127.0.0.1:8787`. On Vercel, rewrites send `/api/*` to the Node function.

### Internationalization (i18n)

- Locales: `en` (default), `te` (Telugu)
- Dictionaries: `src/lib/i18n/en.ts`, `te.ts`
- Persistence: `localStorage` key `lets-fix-it.locale`
- `document.documentElement.lang` updated on change
- Voice recognition language: `en-US` / `te-IN`
- Diagnose API receives `locale`; model is instructed to write user-facing strings in that language (search queries stay English)

---

## 6. Backend architecture

### Hono app (`server/app.ts`)

| Method | Path | Handler |
|---|---|---|
| GET | `/api/health` | Config flags (gemini/youtube/models/fastDemo) — no secrets |
| POST | `/api/diagnose` | `runDiagnosis(body)` |
| POST | `/api/youtube-search` | `searchYoutubeVideos(query)` |
| POST | `/api/parts-search` | `buildPartsSearchLinks(queries)` |

CORS allows localhost, `*.vercel.app`, `*.netlify.app`, plus `FRONTEND_ORIGIN` allowlist.

### Diagnosis pipeline (`server/diagnose.ts`)

1. Validate request has messages.
2. Build Gemini contents: system prompt + **language rule** + session context + chat (+ optional image inline data).
3. Model cascade (depends on `FAST_DEMO_MODE`):
   - **Fast demo (`true`)**: Flash Lite first (skip slow Gemma for live demos).
   - **Normal**: Gemma first (with `GEMMA_TIMEOUT_MS`), then Flash fallbacks.
4. Strip model noise; extract JSON object; validate with Zod (`DiagnosisResponseSchema`).
5. Return `{ diagnosis, modelUsed }`.

Structured diagnosis fields (summary): `assistant_message`, `product_summary`, `diagnostic_stage`, `follow_up_questions`, `interactive_prompts`, `findings`, `possible_causes`, `repair_tasks`, `youtube_search_query`, `parts_search_queries`, safety flags, etc.

### YouTube (`server/youtube.ts`)

- Calls YouTube Data API `search.list`
- Returns real video IDs/titles/channels
- Applies simple ranking labels for UI (e.g. match quality)

### Parts (`server/parts.ts`)

For each query (max 5 unique), emits three **external search URLs**:

| Merchant | URL pattern |
|---|---|
| Amazon | `https://www.amazon.in/s?k={query}` |
| Flipkart | `https://www.flipkart.com/search?q={query}` |
| Meesho | `https://www.meesho.com/search?q={query}` |

No prices, stock, or verified compatibility.

### Environment (`server/env.ts`)

| Variable | Default / notes |
|---|---|
| `GEMINI_API_KEY` | Required for diagnose |
| `GEMMA_MODEL` | `gemma-4-26b-a4b-it` |
| `GEMINI_FALLBACK_MODEL` | `gemini-3.5-flash-lite` |
| `FAST_DEMO_MODE` | `true` |
| `GEMMA_TIMEOUT_MS` | `8000` in fast demo |
| `YOUTUBE_API_KEY` | Required for videos |
| `API_PORT` | `8787` (local only) |
| `FRONTEND_ORIGIN` | Optional CORS extras |

---

## 7. Data model (Supabase)

From `supabase/migrations/001_init.sql`:

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text | |
| `phone` | text | Optional, private |
| `display_name` | text | |
| timestamps | timestamptz | |

RLS: users can read/upsert/update **own** row only.

### `repair_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | Owner |
| `title` | text | |
| `category` | text | |
| `status` | text | e.g. gathering → repair_plan |
| `product_summary` | jsonb | |
| `messages` | jsonb | Chat transcript |
| `diagnosis` | jsonb | Last structured diagnosis |
| timestamps | timestamptz | |

RLS: CRUD **own** sessions only.

Guest chat works **without** Supabase; cloud save requires sign-in.

---

## 8. Local development

```bash
cp .env.example .env   # add GEMINI_API_KEY, YOUTUBE_API_KEY, optional VITE_SUPABASE_*
npm install
npm run dev            # Vite :5173 + auto-starts API :8787
```

Open [http://localhost:5173](http://localhost:5173).

| Script | Purpose |
|---|---|
| `npm run dev` | Vite; plugin starts API if port free |
| `npm run demo` | Vite with `--host` (LAN) |
| `npm run dev:api` | API only |
| `npm run build` | `tsc -b` + Vite build + `build:api` |
| `npm run preview` | Production preview (+ API auto-start) |
| `npm run lint` | Oxlint |

---

## 9. Production deployment (Vercel)

### Why a bundled `api/index.js`?

Vercel Node + root `"type": "module"` failed to resolve extensionless/`../server` imports (`FUNCTION_INVOCATION_FAILED`). Build step:

1. `tsc -b && vite build` → static `dist/`
2. `node scripts/bundle_api.mjs` → single CJS `api/index.js` via esbuild
3. Footer forces `module.exports = handler` (not `{ default: fn }`)
4. Handler = `getRequestListener(app.fetch)` so classic Node `(req, res)` works

### `vercel.json`

- Framework: Vite, output `dist`
- Function: `api/index.js` — `maxDuration: 60`, memory 1024 MB
- Rewrites: `/api/*` → `/api`; SPA fallback to `index.html`

### Required Vercel env

```
GEMINI_API_KEY
YOUTUBE_API_KEY
FAST_DEMO_MODE=true
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
# optional:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Disable **Deployment Protection / Vercel Authentication** for Production so browser `/api` calls are not redirected to SSO.

Health check: `GET https://lets-fix-it.vercel.app/api/health` → `{ "ok": true, ... }`.

### Netlify

Static SPA only. Full diagnose/YouTube need Vercel (or another API host).

---

## 10. End-to-end diagnose flow

```
User opens Home / Diagnose
        │
        ├─ Optional: set language on /profile (en|te)
        │
        ▼
User message / demo starter / photo / Quick Answers
        │
        ▼
POST /api/diagnose { messages, locale, productSummary?, diagnosticStage? }
        │
        ▼
Hono → runDiagnosis → Google AI (Flash/Gemma) → Zod-validated JSON
        │
        ├─ assistant_message → chat bubble
        ├─ interactive_prompts → Quick Answers UI
        ├─ findings / possible_causes → Evidence ladder
        ├─ youtube_search_query → POST /api/youtube-search
        └─ parts_search_queries → POST /api/parts-search
                │
                ▼
         Amazon · Flipkart · Meesho links in Results panel
```

If signed in + Supabase configured, completed diagnoses can persist to `repair_sessions`.

---

## 11. Security & privacy notes

- Server secrets only in `.env` / Vercel project env (never `VITE_*`).
- Supabase anon key is public by design; **RLS** enforces per-user access.
- Never put the Supabase **service role** key in the frontend.
- Parts/YouTube are outbound search/API integrations — results are not claimed as verified repairs.
- Images for diagnosis are sent to the Google API as base64 in the diagnose request (size-capped in UI).

---

## 12. Known operational quirks

| Topic | Detail |
|---|---|
| Cold start | First `/api` call after idle may be slower on Vercel |
| Fast demo | Prefer Flash Lite for snappy hackathon demos; Gemma available when `FAST_DEMO_MODE=false` |
| Locale mid-chat | Switch language on Profile, then **Start over** for a clean localized session |
| Preview SSO | Protected preview URLs can break `/api` fetches; use Production URL for demos |

---

## 13. Version snapshot (package.json)

- App: `lets-fix-it@0.1.0`
- React `^19.3`, Vite `^8.3`, Hono `^4.13`, Zod `^4.6`, Tailwind `^4.3`, TypeScript `~7.0`

---

*Generated for the LET'S FIX IT AI hackathon POC. For day-to-day setup commands, see the root [README.md](../README.md).*
