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
- Local Hono API (`server/`) for Gemma 4 + YouTube + parts (keeps secrets off the browser)
- Optional Supabase Auth / Postgres RLS / Storage
- Deployable Supabase Edge Function mirrors under `supabase/functions/`

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts the API on `:8787` and Vite on `:5173` (proxied `/api`).

### Required for live diagnosis

| Variable | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `.env` (server only) | Google AI Studio key for Gemma 4 via Gemini API |
| `GEMMA_MODEL` | `.env` (optional) | Default `gemma-4-26b-a4b-it` (alt: `gemma-4-31b-it`) |
| `YOUTUBE_API_KEY` | `.env` (server only) | YouTube Data API v3 search |

Get a Gemini/Gemma key: [AI Studio](https://aistudio.google.com/) · Docs: [Gemma on Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)

### Optional auth / My Repairs

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` | Anon key (safe for browser) |

1. Create a Supabase project.
2. Run `supabase/migrations/001_init.sql` in the SQL editor.
3. Enable Email auth.
4. Never put the service-role key in the frontend.

Guest sessions still save in `localStorage` without Supabase.

### Deploying Edge Functions (optional)

```bash
supabase secrets set GEMINI_API_KEY=... YOUTUBE_API_KEY=...
supabase functions deploy diagnose
supabase functions deploy youtube-search
supabase functions deploy parts-search
```

Local `server/` is the default for the POC demo.

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
| `npm run dev` | API + Vite together |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | API only |
| `npm run build` | Typecheck + production build |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview production build |

## Project layout

```
src/                 React UI
server/              Hono API (diagnose / youtube / parts)
shared/              Shared Zod diagnosis schema
supabase/            SQL migration + Edge Function mirrors
```
