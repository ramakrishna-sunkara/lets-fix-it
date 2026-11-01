# LET'S FIX IT AI — Simple Diagrams

Easy pictures of **who uses the app**, **how the system is built**, and **what happens when you type in chat**.

Open this file in GitHub / VS Code / Cursor to render the Mermaid diagrams.

---

## 1. Architecture (big picture)

What talks to what:

```mermaid
flowchart LR
  U[You / Browser] --> W[React App]
  W --> A[Hono API /api]
  A --> G[Google AI<br/>Gemma or Gemini]
  A --> Y[YouTube API]
  A --> P[Amazon · Flipkart · Meesho<br/>search links only]
  W -.-> S[Supabase<br/>optional sign-in]
```

**In plain words**

1. You use the website (React).
2. Chat and searches go to our API (`/api/...`).
3. The API asks Google AI for a diagnosis, YouTube for videos, and builds shopping search links.
4. Sign-in / saved repairs (optional) go to Supabase.

Secrets (`GEMINI_API_KEY`, `YOUTUBE_API_KEY`) stay on the server — not in the browser.

---

## 2. Use cases (what you can do)

```mermaid
flowchart TB
  Actor([User])

  Actor --> UC1[Describe a problem in chat]
  Actor --> UC2[Upload a photo]
  Actor --> UC3[Answer Quick Answers]
  Actor --> UC4[Watch repair videos]
  Actor --> UC5[Open parts search links]
  Actor --> UC6[Change language EN / TE]
  Actor --> UC7[Sign in and save repairs]

  UC1 --> SYS[LET'S FIX IT AI]
  UC2 --> SYS
  UC3 --> SYS
  UC4 --> SYS
  UC5 --> SYS
  UC6 --> SYS
  UC7 --> SYS
```

| Use case | What happens |
|---|---|
| Chat diagnosis | AI asks follow-ups and builds a structured diagnosis |
| Photo | Sent with the message to help the model see the device |
| Quick Answers | Tap Yes / No / choices, then Send answers |
| Videos | Real YouTube results for the repair query |
| Parts | Opens Amazon.in / Flipkart / Meesho search pages |
| Language | UI + AI replies follow English or Telugu |
| Sign in | Optional; saves sessions under My Repairs |

---

## 3. Chat → response (main flow)

**This is the important one:** what happens after you type in the chat box.

```mermaid
sequenceDiagram
  actor You
  participant UI as App UI
  participant API as Hono API
  participant AI as Google AI
  participant YT as YouTube
  participant Shop as Amazon Flipkart Meesho

  You->>UI: Type problem / Send
  UI->>API: POST /api/diagnose<br/>messages + language
  API->>AI: Prompt + chat history
  AI-->>API: JSON diagnosis
  API-->>UI: assistant message + questions + evidence

  UI-->>You: Show chat reply
  UI-->>You: Show Quick Answers
  UI-->>You: Show Observed / Possible / Unknown

  opt When diagnosis is ready
    UI->>API: POST /api/youtube-search
    API->>YT: Search videos
    YT-->>API: Real video list
    API-->>UI: Videos
    UI->>API: POST /api/parts-search
    API-->>UI: Shop search links
    UI-->>You: Videos + Amazon / Flipkart / Meesho
  end
```

### Step-by-step (same story, as a list)

```mermaid
flowchart TD
  A[1. You type in chat<br/>and press Send] --> B[2. App sends message<br/>to /api/diagnose]
  B --> C[3. API builds a prompt<br/>with your language EN or TE]
  C --> D[4. Google AI returns<br/>one JSON diagnosis]
  D --> E[5. API checks JSON<br/>with Zod schema]
  E --> F[6. App shows reply<br/>in the chat]
  F --> G[7. App shows Quick Answers<br/>if more questions needed]
  G --> H{Enough info?}
  H -->|No| I[You answer → Send answers<br/>back to step 2]
  H -->|Yes| J[8. Fetch YouTube videos]
  J --> K[9. Build parts search links]
  K --> L[10. You see results panel<br/>evidence · videos · shops]
```

---

## 4. Inside one diagnose request

What the **API** does for a single Send:

```mermaid
flowchart LR
  subgraph Request
    M[Chat messages]
    L[locale en or te]
  end

  subgraph API
    P[Add system rules<br/>+ language rule]
    C[Call Flash Lite<br/>or Gemma]
    Z[Validate JSON]
  end

  subgraph Response
    AM[assistant_message]
    QA[interactive_prompts]
    EV[findings / causes]
    YQ[youtube_search_query]
    PQ[parts_search_queries]
  end

  M --> P
  L --> P
  P --> C --> Z
  Z --> AM
  Z --> QA
  Z --> EV
  Z --> YQ
  Z --> PQ
```

---

## 5. Local vs Vercel

```mermaid
flowchart TB
  subgraph Local demo
    V[Vite :5173] -->|proxy /api| H[Hono :8787]
  end

  subgraph Production
    S[Static site on Vercel] -->|/api/*| F[Bundled Node function<br/>api/index.js]
  end

  H --> Same[Same Hono app<br/>server/app.ts]
  F --> Same
```

Same API code runs locally and on Vercel. Production bundles it with esbuild so Node can load it reliably.

---

## 6. Language (EN / TE) in the chat path

```mermaid
flowchart LR
  P[Profile: pick English or Telugu] --> Store[Saved in browser]
  Store --> Chat[Chat Send]
  Chat --> API["/api/diagnose locale=en|te"]
  API --> AI[AI writes reply<br/>in that language]
  AI --> UI[Chat + Quick Answers<br/>in that language]
```

Tip: after changing language, tap **Start over**, then try a demo so the whole session matches.

---

## Related docs

- Full tech detail: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Setup & deploy: [../README.md](../README.md)
