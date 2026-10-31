# LET'S FIX IT AI

Hackathon POC: an honest AI repair diagnosis assistant.

**Before you replace it, let's understand it and see whether we can fix it.**

## What it does

1. Describe a product problem in chat (optional photo).
2. Gemma 4 asks targeted follow-ups and returns a structured diagnosis.
3. The UI separates **Observed / Possible causes / Still unknown**.
4. Real YouTube repair-video search (when configured).
5. External parts search links (no invented prices or compatibility).
6. Optional Supabase email auth + saved repair sessions.

Primary demos: **car remote keys** and **Bluetooth speakers**.

## Stack

- Vite + React + TypeScript + Tailwind
- Hono API (`server/`) for Gemma / Gemini + YouTube + parts (secrets stay server-side)
- **Vercel** recommended host (frontend + `/api` serverless)
- Optional Supabase Auth / Postgres RLS / Storage

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts Vite on `:5173` and **auto-starts** the Hono API on `:8787` (proxied `/api`). Use that for local demos — open http://localhost:5173.

### Required for live diagnosis

| Variable | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `.env` / Vercel env (server only) | Google AI Studio key |
| `GEMMA_MODEL` | optional | Default `gemma-4-26b-a4b-it` |
| `GEMINI_FALLBACK_MODEL` | optional | Default `gemini-3.5-flash-lite` |
| `FAST_DEMO_MODE` | optional | `true` = prefer Flash Lite for snappy demos |
| `YOUTUBE_API_KEY` | `.env` / Vercel env (server only) | YouTube Data API v3 search |

Get a Gemini/Gemma key: [AI Studio](https://aistudio.google.com/) · Docs: [Gemma on Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)

### Optional auth / My Repairs

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` / Vercel env | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` / Vercel env | Anon key (safe for browser) |

1. Create a Supabase project.
2. Run `supabase/migrations/001_init.sql` in the SQL editor.
3. Enable Email auth.
4. Never put the service-role key in the frontend.

## Deploy on Vercel (recommended)

One project hosts the Vite UI and the Hono `/api` routes.

```bash
npm i -g vercel
vercel
```

Or import the GitHub repo at [vercel.com/new](https://vercel.com/new).

**Project settings**
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

**Environment variables** (Production + Preview):

```
GEMINI_API_KEY=
YOUTUBE_API_KEY=
GEMMA_MODEL=gemma-4-26b-a4b-it
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
FAST_DEMO_MODE=true
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

After the first deploy, open `https://YOUR_PROJECT.vercel.app/api/health` — it should return `"ok": true`.

`npm run build` also bundles the Hono API into `api/index.js` (required for Vercel Node ESM).

**If the UI says API unreachable on Vercel**
1. Project → **Settings → Environment Variables** — set `GEMINI_API_KEY` and `YOUTUBE_API_KEY` for Production + Preview, then redeploy.
2. Project → **Settings → Deployment Protection** — turn **Vercel Authentication** off for Production (preview SSO redirects break browser `/api` calls).
3. Prefer the Production domain (`lets-fix-it.vercel.app`) over a one-off preview URL for demos.
4. Confirm Deployments → latest → Functions includes `api/index`.

### Netlify (frontend only)

`netlify.toml` builds the static site. For full diagnose/YouTube APIs, prefer **Vercel** (API is wired there). On Netlify you’d need separate Functions or an external API host.

## Demo script (~3 minutes)

1. Open Home → tap **Try: Car remote demo**.
2. Answer 2–3 follow-ups (range vs dead, spare key, moisture).
3. Upload a real key-fob photo if available.
4. Show the evidence ladder (Observed / Possible / Unknown).
5. Open a real YouTube result; note match-quality label.
6. Optional: Bluetooth speaker path + safety gate for battery issues.

## Honesty rules

- Missing API keys show clear configuration errors — no fake diagnoses or fake YouTube IDs.
- Parts results are **search links**, not verified inventory.
- No confidence percentages unless the model can justify qualitative confidence.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local demo (Vite + auto-started API) |
| `npm run demo` | Same as `dev`, bound to LAN (`--host`) |
| `npm run dev:api` | API only (`:8787`) |
| `npm run dev:all` | Explicit concurrently API + Vite |
| `npm run build` | Typecheck + production build |
| `npm run lint` | Oxlint |
| `npm run preview` | Production build preview (also auto-starts API) |

## Project layout

```
src/                 React UI
server/              Hono API app + local Node server
api/                 Vercel serverless entry for /api/*
shared/              Shared Zod diagnosis schema
supabase/            SQL migration + Edge Function mirrors
vercel.json          Vercel build + SPA/API routing
```
