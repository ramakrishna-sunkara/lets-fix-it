import {
  DiagnosisResponseSchema,
  type DiagnosisResponse,
} from '../shared/diagnosis.ts'
import { loadServerEnv, missingConfigMessage } from './env.ts'

const SYSTEM_PROMPT = `You are LET'S FIX IT AI — a careful repair diagnosis assistant.
Philosophy: "Before you replace it, let's understand it and see whether we can fix it."

You help users diagnose everyday product malfunctions with honesty and safety.
Primary demo categories: car remote keys and Bluetooth speakers. Other categories may receive limited support — say so clearly.

Rules:
1. Separate OBSERVATIONS (supported by user text or photo) from POSSIBLE CAUSES (hypotheses) from UNKNOWNS.
2. Never invent measurements, specs, prices, compatibility, success rates, or hidden damage you cannot see.
3. Do not declare a battery defective solely because a device stopped working or is unreliable — ask targeted questions and suggest simple safe checks first.
4. Ask at most 3 follow-up questions at a time. Do not re-ask information already provided.
5. Adapt questions to symptoms (e.g. short-range key vs completely dead key).
6. For lithium-ion / swollen batteries: stop use/charging, do not open or puncture, seek professional help. Set requires_professional_help true.
7. Do not recommend vehicle security bypass, illegal reprogramming, or unsafe electrical testing.
8. Prefer qualitative confidence explanations — never fake percentage confidence.
9. When enough evidence exists, move diagnostic_stage to diagnosis_ready or repair_plan and populate repair_tasks, youtube_search_query, and parts_search_queries.
10. Mark beginner DIY only when genuinely safe for a novice; otherwise use professional difficulty and requires_professional_help.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "assistant_message": string,
  "product_summary": { "category"?, "brand"?, "model"?, "year"?, "notes"? },
  "diagnostic_stage": "gathering" | "analyzing" | "diagnosis_ready" | "repair_plan",
  "follow_up_questions": string[],
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

function extractJsonObject(text: string): unknown {
  const trimmed: string = text.trim()
  const fenceMatch: RegExpMatchArray | null = trimmed.match(
    /```(?:json)?\s*([\s\S]*?)```/i,
  )
  const candidate: string = fenceMatch ? fenceMatch[1].trim() : trimmed
  const start: number = candidate.indexOf('{')
  const end: number = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response did not contain a JSON object.')
  }
  return JSON.parse(candidate.slice(start, end + 1)) as unknown
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

async function callGemma(
  messages: IncomingMessage[],
  productSummary: Record<string, string> | undefined,
  diagnosticStage: string | undefined,
): Promise<string> {
  const env = loadServerEnv()
  if (!env.geminiApiKey) {
    throw new ConfigError(
      missingConfigMessage('Gemma 4 / Gemini API', 'GEMINI_API_KEY'),
    )
  }
  const contextNote: string = [
    productSummary
      ? `Known product context: ${JSON.stringify(productSummary)}`
      : '',
    diagnosticStage ? `Current diagnostic stage: ${diagnosticStage}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const contents = buildGeminiContents(messages)
  if (contextNote) {
    const first = contents[0] as { parts: Array<Record<string, unknown>> }
    first.parts.unshift({ text: `[Session context]\n${contextNote}` })
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.gemmaModel}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  })
  if (!response.ok) {
    const errorText: string = await response.text()
    throw new Error(
      `Gemma API error (${response.status}): ${errorText.slice(0, 500)}`,
    )
  }
  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }
  const text: string | undefined =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
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
): Promise<DiagnosisResponse> {
  if (!request.messages?.length) {
    throw new Error('At least one message is required.')
  }
  const attempt = async (): Promise<DiagnosisResponse> => {
    const rawText: string = await callGemma(
      request.messages,
      request.productSummary,
      request.diagnosticStage,
    )
    const parsed: unknown = extractJsonObject(rawText)
    return DiagnosisResponseSchema.parse(parsed)
  }
  try {
    return await attempt()
  } catch (firstError: unknown) {
    if (firstError instanceof ConfigError) {
      throw firstError
    }
    try {
      return await attempt()
    } catch (secondError: unknown) {
      const detail: string =
        secondError instanceof Error ? secondError.message : 'Unknown error'
      throw new Error(
        `Could not validate a structured diagnosis from Gemma. ${detail}`,
      )
    }
  }
}
