import {
  DiagnosisResponseSchema,
  type DiagnosisResponse,
} from '../shared/diagnosis'
import {
  loadServerEnv,
  missingConfigMessage,
  resolveApiVersion,
} from './env'

const SYSTEM_PROMPT = `You are LET'S FIX IT AI — a careful repair diagnosis assistant.
Philosophy: "Before you replace it, let's understand it and see whether we can fix it."

You help users diagnose everyday product malfunctions with honesty and safety.
Infer the product from the user's words and photos — do not assume a fixed category list.
If confidence in the product type is low, say so and ask what the device is.

Rules:
1. Separate OBSERVATIONS (supported by user text or photo) from POSSIBLE CAUSES (hypotheses) from UNKNOWNS.
2. Never invent measurements, specs, prices, compatibility, success rates, or hidden damage you cannot see.
3. Do not declare a battery defective solely because a device stopped working or is unreliable — ask targeted questions and suggest simple safe checks first.
4. Ask at most 3 clarifying questions. Put a short summary in assistant_message, and also fill interactive_prompts for the UI:
   - yes_no: binary checks (vibrate? touch works?)
   - choice: a few likely options plus allow custom text in UI
   - text: open answers (brand/model)
   Prefer yes_no for closed questions. Do not re-ask information already provided.
5. Adapt questions to symptoms (e.g. short-range key vs completely dead key).
6. For lithium-ion / swollen batteries: stop use/charging, do not open or puncture, seek professional help. Set requires_professional_help true. Only ask swelling/warmth questions for rechargeable lithium devices (speakers, phones, headphones) — never for coin-cell car key fobs.
7. Do not recommend vehicle security bypass, illegal reprogramming, or unsafe electrical testing.
8. Prefer qualitative confidence explanations — never fake percentage confidence.
9. When enough evidence exists, move diagnostic_stage to diagnosis_ready or repair_plan and populate repair_tasks, youtube_search_query, and parts_search_queries.
10. Mark beginner DIY only when genuinely safe for a novice; otherwise use professional difficulty and requires_professional_help.
11. ONE active product at a time. Diagnose only the latest product the user is talking about.
12. If the user switches products (e.g. from car key to headphones), park the previous case: briefly acknowledge it, then clear prior follow-ups/hypotheses from your questions and focus only on the new product. Do not mix symptoms across products.
13. Treat messages like "Answer to \"...\": sometimes" or "Question text: my answer" as answers to prior questions — do not repeat those questions.
14. Update product_summary.category/brand/model to match the active product only.

Output rules (critical):
- Reply with ONE JSON object only.
- No markdown fences, no commentary before or after the JSON.
- No thinking tags, channel markers, or multiple JSON objects.
- Every string value must be plain text (no nested raw JSON blobs).

JSON schema to match:
{
  "assistant_message": string,
  "product_summary": { "category"?, "brand"?, "model"?, "year"?, "notes"? },
  "diagnostic_stage": "gathering" | "analyzing" | "diagnosis_ready" | "repair_plan",
  "follow_up_questions": string[],
  "interactive_prompts": [{ "id": string, "prompt": string, "input_type": "yes_no"|"choice"|"text", "choices": string[], "placeholder"? }],
  "findings": { "observations": string[], "unknowns": string[] },
  "visible_evidence": string[],
  "possible_causes": [{ "cause", "why_plausible", "how_to_confirm" }],
  "confidence_explanation": string,
  "recommended_next_step": string,
  "safety_warnings": string[],
  "repair_tasks": [{ "title", "difficulty": "beginner"|"intermediate"|"professional", "steps": string[], "tools": string[], "parts_hints": string[] }],
  "requires_professional_help": boolean,
  "youtube_search_query": string | null,
  "parts_search_queries": string[]
}`

type IncomingMessage = {
  role: 'user' | 'assistant'
  content: string
  imageBase64?: string
  imageMimeType?: string
}

type DiagnoseRequest = {
  messages: IncomingMessage[]
  productSummary?: Record<string, string>
  diagnosticStage?: string
}

function stripModelNoise(text: string): string {
  let cleaned: string = text.trim()
  cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1')
  cleaned = cleaned.replace(/<\|[^|>]+\|>[\s\S]*?(?=<\|[^|>]+\|>|$)/g, ' ')
  cleaned = cleaned.replace(/<\/?think>/gi, ' ')
  cleaned = cleaned.replace(/^\s*thought\s*\n/i, '')
  return cleaned.trim()
}

function extractBalancedJsonObject(text: string): string | null {
  const start: number = text.indexOf('{')
  if (start === -1) {
    return null
  }
  let depth = 0
  let inString = false
  let isEscaped = false
  for (let i = start; i < text.length; i += 1) {
    const char: string = text[i]
    if (inString) {
      if (isEscaped) {
        isEscaped = false
        continue
      }
      if (char === '\\') {
        isEscaped = true
        continue
      }
      if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{') {
      depth += 1
      continue
    }
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }
  return null
}

function extractJsonObject(text: string): unknown {
  const candidate: string = stripModelNoise(text)
  const directAttempt: string | null = extractBalancedJsonObject(candidate)
  if (!directAttempt) {
    throw new Error('Model response did not contain a JSON object.')
  }
  try {
    return JSON.parse(directAttempt) as unknown
  } catch (firstParseError: unknown) {
    // Fallback: try each balanced object if the model emitted more than one.
    const objects: string[] = []
    let searchFrom = 0
    while (searchFrom < candidate.length) {
      const slice: string = candidate.slice(searchFrom)
      const nextObject: string | null = extractBalancedJsonObject(slice)
      if (!nextObject) {
        break
      }
      objects.push(nextObject)
      const absoluteStart: number = candidate.indexOf(nextObject, searchFrom)
      searchFrom = absoluteStart + nextObject.length
    }
    for (let i = objects.length - 1; i >= 0; i -= 1) {
      try {
        return JSON.parse(objects[i]) as unknown
      } catch {
        // keep trying
      }
    }
    const detail: string =
      firstParseError instanceof Error
        ? firstParseError.message
        : 'Invalid JSON'
    throw new Error(detail)
  }
}

function buildGeminiContents(messages: IncomingMessage[]): unknown[] {
  return messages.map((message: IncomingMessage) => {
    const parts: Array<Record<string, unknown>> = [
      { text: message.content },
    ]
    if (message.imageBase64 && message.imageMimeType) {
      parts.unshift({
        inlineData: {
          mimeType: message.imageMimeType,
          data: message.imageBase64,
        },
      })
    }
    return {
      role: message.role === 'assistant' ? 'model' : 'user',
      parts,
    }
  })
}

function buildRequestContents(
  messages: IncomingMessage[],
  productSummary: Record<string, string> | undefined,
  diagnosticStage: string | undefined,
): unknown[] {
  const contextNote: string = [
    productSummary
      ? `Known product context: ${JSON.stringify(productSummary)}`
      : '',
    diagnosticStage ? `Current diagnostic stage: ${diagnosticStage}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const contents = buildGeminiContents(messages)
  const first = contents[0] as { parts: Array<Record<string, unknown>> }
  if (contextNote) {
    first.parts.unshift({ text: `[Session context]\n${contextNote}` })
  }
  const latestUserText: string =
    [...messages].reverse().find((message) => message.role === 'user')
      ?.content || ''
  const focusNote: string = latestUserText
    ? `\nActive user turn to prioritize: """${latestUserText.slice(0, 500)}"""\nFocus diagnosis and follow_up_questions on this product only.`
    : ''
  first.parts.unshift({
    text: `${SYSTEM_PROMPT}${focusNote}\n\nRemember: output exactly one JSON object and nothing else.`,
  })
  return contents
}

async function callModelOnce(
  model: string,
  contents: unknown[],
  apiKey: string,
  options?: { timeoutMs?: number; maxOutputTokens?: number },
): Promise<string> {
  const apiVersion: string = resolveApiVersion(model)
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const maxOutputTokens: number = options?.maxOutputTokens || 2048
  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens,
    },
  }
  // Gemini models accept JSON mime type more reliably than Gemma.
  if (!model.toLowerCase().includes('gemma')) {
    ;(requestBody.generationConfig as Record<string, unknown>).responseMimeType =
      'application/json'
  }
  const controller = new AbortController()
  const timeoutMs: number | undefined = options?.timeoutMs
  const timer =
    timeoutMs && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
    if (!response.ok) {
      const errorText: string = await response.text()
      throw new Error(
        `${model} API error (${response.status}): ${errorText.slice(0, 400)}`,
      )
    }
    return extractTextFromGemmaPayload(await response.json())
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${model} timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

export type ModelCallResult = {
  text: string
  modelUsed: string
}

async function callDiagnosisModel(
  messages: IncomingMessage[],
  productSummary: Record<string, string> | undefined,
  diagnosticStage: string | undefined,
): Promise<ModelCallResult> {
  const env = loadServerEnv()
  if (!env.geminiApiKey) {
    throw new ConfigError(
      missingConfigMessage('Gemma 4 / Gemini API', 'GEMINI_API_KEY'),
    )
  }
  const contents = buildRequestContents(
    messages,
    productSummary,
    diagnosticStage,
  )
  // Fast demo: use Flash models only (skip slow/flaky Gemma for live demos).
  // Normal mode: prefer Gemma with timeout, then fall back to Flash.
  const modelsToTry: string[] = env.isFastDemoMode
    ? [env.fallbackModel, 'gemini-3.5-flash-lite', 'gemini-flash-latest']
    : [env.gemmaModel, env.fallbackModel, 'gemini-3.5-flash-lite']
  const uniqueModels: string[] = [
    ...new Set(modelsToTry.map((model) => model.trim()).filter(Boolean)),
  ]
  const failures: string[] = []
  for (const model of uniqueModels) {
    const isGemma: boolean = model.toLowerCase().includes('gemma')
    try {
      const text: string = await callModelOnce(
        model,
        contents,
        env.geminiApiKey,
        {
          timeoutMs: isGemma ? env.gemmaTimeoutMs : 45000,
          maxOutputTokens: env.maxOutputTokens,
        },
      )
      console.warn(`[diagnose] Using model ${model}`)
      return { text, modelUsed: model }
    } catch (error: unknown) {
      const message: string =
        error instanceof Error ? error.message : String(error)
      failures.push(`${model}: ${message}`)
      console.warn(`[diagnose] Model ${model} failed:`, message)
    }
  }
  throw new Error(
    `All diagnosis models failed. ${failures.join(' | ')}`,
  )
}

function extractTextFromGemmaPayload(payload: unknown): string {
  const data = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> }
    }>
  }
  const parts = data.candidates?.[0]?.content?.parts || []
  // Prefer non-thought parts when Gemma returns thinking + answer.
  const answerParts: string[] = parts
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text || '')
  const fallbackParts: string[] = parts.map((part) => part.text || '')
  const text: string = (answerParts.length > 0 ? answerParts : fallbackParts)
    .join('\n')
    .trim()
  if (!text) {
    throw new Error('Gemma returned an empty response.')
  }
  return text
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export async function runDiagnosis(
  request: DiagnoseRequest,
): Promise<{ diagnosis: DiagnosisResponse; modelUsed: string }> {
  if (!request.messages?.length) {
    throw new Error('At least one message is required.')
  }
  const env = loadServerEnv()
  const attempt = async (
    messages: IncomingMessage[],
  ): Promise<{ diagnosis: DiagnosisResponse; modelUsed: string }> => {
    const result = await callDiagnosisModel(
      messages,
      request.productSummary,
      request.diagnosticStage,
    )
    const parsed: unknown = extractJsonObject(result.text)
    return {
      diagnosis: DiagnosisResponseSchema.parse(parsed),
      modelUsed: result.modelUsed,
    }
  }
  try {
    return await attempt(request.messages)
  } catch (firstError: unknown) {
    if (firstError instanceof ConfigError) {
      throw firstError
    }
    // In fast demo mode, skip the expensive second round-trip.
    if (env.isFastDemoMode) {
      const detail: string =
        firstError instanceof Error ? firstError.message : 'Unknown error'
      console.error('[diagnose] Parse/model failure:', detail)
      throw new Error(
        `Could not validate a structured diagnosis. ${detail}`,
      )
    }
    try {
      const repairMessages: IncomingMessage[] = [
        ...request.messages,
        {
          role: 'user',
          content:
            'Your previous reply was invalid. Respond again with a single valid JSON object only — no markdown, no extra text.',
        },
      ]
      return await attempt(repairMessages)
    } catch (secondError: unknown) {
      const detail: string =
        secondError instanceof Error ? secondError.message : 'Unknown error'
      console.error('[diagnose] Parse failure:', detail)
      throw new Error(
        `Could not validate a structured diagnosis. ${detail}`,
      )
    }
  }
}
