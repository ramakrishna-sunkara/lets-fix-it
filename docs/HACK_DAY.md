# Hacktoberfest Hack Day Vizag × AI for Vizag

Event theme: learning, building, and contributing through **open-source AI tools**, **open-weight models**, agents, and developer workflows.

## Prize tracks (enter both)

One submission can enter every category it qualifies for.

| Track | Link | How this project qualifies |
|---|---|---|
| **Best Use of Gemma 4** | [MLH challenge](https://www.mlh.com/events/hacktoberfest-hack-day-vizag-x-ai-for-vizag/challenges/01a03b87-be22-9180-5e2d-b3beeb66666d) | Primary diagnosis model is `gemma-4-26b-a4b-it`. Multimodal (text + image). Focused community repair tool. Built via Gemini API for rapid prototype. |
| **Best Open-Source AI Project** | [MLH challenge](https://www.mlh.com/events/hacktoberfest-hack-day-vizag-x-ai-for-vizag/challenges/01a0d987-0c41-12ea-13ac-5b85755dc2f3) | Open-weight Gemma is an **important** part of how the product works (not a bolt-on). Original repair-diagnosis agent harness with structured JSON + evidence UI. |

### Official Gemma 4 challenge cues

- **Multimodal experience** — text and images in one assistant  
- **Focused AI tool** — learning / creativity / productivity / **community**  
- **Rapid prototyping** — open model + Gemini API → working demo  

### Official Open-Source AI challenge cues

- Original project  
- Open-source or **open-weight** AI as a core part of how it works  
- Agent skill, open-weight LLM, or open-source model harness  

## Demo script (judges)

1. Open app → status banner: **Powered by Gemma 4**.  
2. Run **Car remote** or **Bluetooth speaker** starter.  
3. Optionally upload a product photo (multimodal).  
4. Answer Quick Answers; show Evidence ladder.  
5. Point to results line: **Diagnosed with Gemma · gemma-4-…**  
6. Open YouTube + Amazon.in / Flipkart / Meesho.  
7. Switch Profile language to Telugu; send one message (localized Gemma replies).

## Config for judging day

```bash
# .env / Vercel — Gemma must be primary
GEMMA_MODEL=gemma-4-26b-a4b-it
FAST_DEMO_MODE=false
GEMMA_TIMEOUT_MS=25000
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
```

Flash Lite is **fallback only** if Gemma times out or fails. Do not demo with Flash-only mode.

## Pitch one-liner

**LET'S FIX IT AI** is a multimodal, open-weight **Gemma 4** repair agent: honest evidence, real videos, India parts links, and Telugu — built for Vizag Hack Day.
