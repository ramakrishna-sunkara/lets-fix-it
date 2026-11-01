# LET'S FIX IT AI — PowerPoint Content

Copy each slide into PowerPoint (or Google Slides).  
Suggested length: **10–12 slides · ~5–7 minutes** (+ live demo).

**Event:** Hacktoberfest Hack Day Vizag × AI for Vizag (MLH)  
**Prize tracks (one submission can enter both):**
- [Best Use of Gemma 4](https://www.mlh.com/events/hacktoberfest-hack-day-vizag-x-ai-for-vizag/challenges/01a03b87-be22-9180-5e2d-b3beeb66666d)
- [Best Open-Source AI Project](https://www.mlh.com/events/hacktoberfest-hack-day-vizag-x-ai-for-vizag/challenges/01a0d987-0c41-12ea-13ac-5b85755dc2f3)

**Live demo:** https://lets-fix-it.vercel.app  
**Tagline:** Before you replace it, let's understand it and see whether we can fix it.

---

## Slide 1 — Title

**Title:** LET'S FIX IT AI

**Subtitle:** Honest AI repair diagnosis — powered by **Gemma 4**

**Footer / extras:**
- Hacktoberfest Hack Day Vizag × AI for Vizag
- Tracks: Best Use of Gemma 4 · Best Open-Source AI Project
- Demo: `lets-fix-it.vercel.app`

**Speaker notes:** Open with the problem: people replace devices too fast without understanding the fault. Say early: diagnosis runs on **open-weight Gemma 4** (text + photo).

---

## Slide 2 — The problem

**Title:** People replace first. Diagnose later (or never).

**Bullets:**
- Small failures (dead key fob, speaker won’t charge) feel like “buy new”
- Online advice mixes guesses, unsafe tips, and fake confidence
- Shopping apps push products — not understanding
- Language barrier: many users think in Telugu / regional languages

**One-liner on slide:** *Replacement is easy. Understanding is hard.*

---

## Slide 3 — Our solution

**Title:** Diagnose → Evidence → Fix path

**Bullets:**
1. **Chat** about the problem (optional photo)
2. **AI follow-ups** that adapt to the product (not fixed categories)
3. **Evidence ladder** — Observed / Possible / Unknown (no fake certainty)
4. **Real repair videos** (YouTube API)
5. **Parts search links** — Amazon.in · Flipkart · Meesho
6. **EN + Telugu** UI and AI replies

**Tagline again:** Before you replace it, let’s fix it.

---

## Slide 4 — Who is it for? (Use cases)

**Title:** Simple use cases

**Bullets / cards:**
- **Home user** — “My car remote stopped locking”
- **Home user** — “Bluetooth speaker won’t charge”
- **Demo / support** — Guided questions + safety warnings
- **Regional user** — Switch to Telugu on Profile

**Optional icons:** chat · camera · video · shopping bag · language

---

## Slide 5 — Live user journey (demo story)

**Title:** What the user does (2 minutes)

**Numbered steps:**
1. Open app → try **Car remote demo** (or type in Telugu / English)
2. Answer **Quick Answers** (Yes / No / Not sure)
3. Optionally upload a photo
4. See **Evidence ladder** update
5. Open a **YouTube** repair video
6. Tap **Amazon / Flipkart / Meesho** for parts search

**Callout box:** *One product at a time — Start over when switching devices*

---

## Slide 6 — What happens when you type in chat

**Title:** Chat → Response (how it works)

**Flow (use as boxes left → right, or vertical steps):**

```
You type  →  App  →  /api/diagnose  →  Google AI (Gemma/Gemini)
                ↓
         Structured JSON
                ↓
    Chat reply + Quick Answers + Evidence
                ↓
    (when ready) YouTube + Parts links
```

**Keep it simple on slide:**
- Browser never holds API secrets
- AI returns **structured diagnosis**, not random chat only
- UI shows what is known vs still unknown

*(Paste diagram from `docs/DIAGRAMS.md` §3 if you want a visual)*

---

## Slide 7 — Why Gemma 4 (prize track)

**Title:** Best Use of Gemma 4 — how we qualify

Map to MLH challenge criteria:

| Gemma 4 ask | How LET'S FIX IT uses it |
|---|---|
| **Multimodal** | Chat text + optional product **photo** → same Gemma diagnose call |
| **Focused AI tool** | Community repair assistant (home gadgets, Vizag/India shopping + Telugu) |
| **Open model, rapid prototype** | Open-weight `gemma-4-26b-a4b-it` via Gemini API; working demo same day |

**Say out loud:** *Gemma is primary — not a side feature. Banner says “Powered by Gemma 4.”*

**Also qualifies for:** Best Open-Source AI Project (open-weight model is core to how diagnosis works).

---

## Slide 8 — Architecture (simple)

**Title:** System architecture

**Boxes:**

| Layer | What |
|---|---|
| **Frontend** | React + Vite + Tailwind (Vercel) |
| **API** | Hono `/api` (local Node or Vercel serverless) |
| **AI** | **Gemma 4** (primary) + Gemini Flash Lite fallback only |
| **Videos** | YouTube Data API v3 |
| **Parts** | Amazon.in · Flipkart · Meesho search URLs |
| **Optional** | Supabase Auth + saved repairs (RLS) |

**One sentence:** *SPA talks to our API; API talks to Gemma 4 & YouTube; shops are honest search links.*

*(Use architecture Mermaid from `docs/DIAGRAMS.md` §1 as a figure)*

---

## Slide 9 — Tech stack

**Title:** Built with

**Two columns:**

**Frontend**
- React 19 · TypeScript · Vite
- Tailwind CSS · React Router
- EN / TE i18n

**Backend & host**
- Hono API · Zod validation
- **Gemma 4** (open-weight) via Gemini API
- YouTube API
- Vercel (frontend + API)
- Optional Supabase

---

## Slide 10 — Honesty & safety (differentiation)

**Title:** We don’t invent the fix

**Bullets:**
- No fake diagnoses when keys are missing — clear config errors
- No fake YouTube video IDs
- No invented prices, stock, or “guaranteed compatible” parts
- Evidence ladder separates **facts / hypotheses / unknowns**
- Safety gates (e.g. swollen lithium batteries → stop & seek help)
- Qualitative confidence — not made-up % scores

**Badge text:** *Honest POC > impressive lies*

---

## Slide 11 — Demo highlights

**Title:** What we’ll show live

**Checklist:**
- [ ] Banner: **Powered by Gemma 4**
- [ ] Car remote (or Bluetooth speaker) demo starter
- [ ] Upload a **photo** (multimodal Gemma)
- [ ] Interactive Quick Answers
- [ ] Language switch → Telugu reply
- [ ] Evidence ladder
- [ ] Real YouTube result
- [ ] Amazon / Flipkart / Meesho links

**URL:** https://lets-fix-it.vercel.app

---

## Slide 12 — What’s next

**Title:** Roadmap (after the hackathon)

**Bullets:**
- More languages beyond EN / TE
- Deeper parts matching (still honest — no fake inventory)
- Mobile app / PWA polish
- Shop / technician partnerships (opt-in)
- Stronger offline / guest history (privacy-first)

**Close line:** *Understand first. Replace only if you must.*

---

## Slide 13 — Thank you / Q&A

**Title:** Thank you

**Body:**
- **Product:** LET'S FIX IT AI  
- **Tracks:** Best Use of Gemma 4 · Best Open-Source AI Project  
- **Demo:** https://lets-fix-it.vercel.app  
- **Docs:** `docs/ARCHITECTURE.md` · `docs/DIAGRAMS.md` · `docs/HACK_DAY.md`  
- **Repo:** GitHub `lets-fix-it`

**Footer:** Questions?

---

# Optional backup slides (if judges ask)

## B1 — Diagnose API internals

**Title:** Inside `/api/diagnose`

**Bullets:**
- Messages + optional image + `locale`
- System rules + language rule (EN/TE)
- **Gemma-first** always; Flash Lite only if Gemma times out / fails
- Zod validates one JSON object
- Returns chat text, prompts, evidence, video query, parts queries

## B2 — Local vs production

**Title:** Same code, two runtimes

**Bullets:**
- Local: Vite `:5173` proxies to Hono `:8787`
- Production: Vercel static SPA + bundled Node `api/index.js`
- Build: `tsc` → Vite → esbuild API bundle

## B3 — Data (optional Supabase)

**Title:** Profiles & repairs

**Bullets:**
- Email auth
- `profiles` + `repair_sessions` with Row Level Security
- Guest chat works without account

---

# Design tips for the PPT

| Tip | Suggestion |
|---|---|
| Theme | Material / cobalt accent (match the app) |
| Fonts | Roboto for titles + body (Material) |
| Density | Max 5–6 bullets per slide |
| Demo | Keep Slide 11 + browser tab ready; show Gemma badge on results |
| Diagrams | Screenshot Mermaid renders from `docs/DIAGRAMS.md` |

---

# 60-second pitch (if time is short)

1. **Problem:** We replace gadgets without diagnosing them.  
2. **Solution:** Chat + photo + honest evidence + real videos + India shop links + Telugu.  
3. **How:** React → Hono → **Gemma 4** (open-weight, multimodal) → structured diagnosis.  
4. **Tracks:** Best Use of Gemma 4 + Best Open-Source AI Project.  
5. **Demo:** Car key → photo/questions → evidence → YouTube → shops.

---

*Source of truth for tech: `docs/ARCHITECTURE.md`. Visual flows: `docs/DIAGRAMS.md`.*
