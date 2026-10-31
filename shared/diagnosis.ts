import { z } from 'zod'

/** Models often return null for unknown optional fields — coerce to undefined. */
const optionalString = z.preprocess(
  (value: unknown) => (value === null || value === '' ? undefined : value),
  z.string().optional(),
)

const stringArray = z.preprocess(
  (value: unknown) => (value === null || value === undefined ? [] : value),
  z.array(z.string()),
)

export const ProductSummarySchema = z.object({
  category: optionalString,
  brand: optionalString,
  model: optionalString,
  year: optionalString,
  notes: optionalString,
})

export const PossibleCauseSchema = z.object({
  cause: z.string(),
  why_plausible: z.string().default(''),
  how_to_confirm: z.string().default(''),
})

export const RepairTaskSchema = z.object({
  title: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'professional']),
  steps: stringArray.default([]),
  tools: stringArray.default([]),
  parts_hints: stringArray.default([]),
})

export const InteractivePromptSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  input_type: z.enum(['yes_no', 'choice', 'text']),
  choices: stringArray.default([]),
  placeholder: optionalString,
})

export const DiagnosisResponseSchema = z.object({
  assistant_message: z.string(),
  product_summary: z.preprocess(
    (value: unknown) => (value === null ? {} : value),
    ProductSummarySchema.default({}),
  ),
  diagnostic_stage: z.enum([
    'gathering',
    'analyzing',
    'diagnosis_ready',
    'repair_plan',
  ]),
  follow_up_questions: z.preprocess(
    (value: unknown) => (value === null || value === undefined ? [] : value),
    z.array(z.string()).max(5).default([]),
  ),
  interactive_prompts: z.preprocess(
    (value: unknown) => (value === null ? [] : value),
    z.array(InteractivePromptSchema).max(5).default([]),
  ),
  findings: z.preprocess(
    (value: unknown) =>
      value === null
        ? { observations: [], unknowns: [] }
        : value,
    z
      .object({
        observations: stringArray.default([]),
        unknowns: stringArray.default([]),
      })
      .default({ observations: [], unknowns: [] }),
  ),
  visible_evidence: stringArray.default([]),
  possible_causes: z.preprocess(
    (value: unknown) => (value === null ? [] : value),
    z.array(PossibleCauseSchema).default([]),
  ),
  confidence_explanation: z.preprocess(
    (value: unknown) => (value === null ? '' : value),
    z.string().default(''),
  ),
  recommended_next_step: z.preprocess(
    (value: unknown) => (value === null ? '' : value),
    z.string().default(''),
  ),
  safety_warnings: stringArray.default([]),
  repair_tasks: z.preprocess(
    (value: unknown) => (value === null ? [] : value),
    z.array(RepairTaskSchema).default([]),
  ),
  requires_professional_help: z.boolean().default(false),
  youtube_search_query: z.string().nullable().default(null),
  parts_search_queries: stringArray.default([]),
})

export type ProductSummary = z.infer<typeof ProductSummarySchema>
export type PossibleCause = z.infer<typeof PossibleCauseSchema>
export type RepairTask = z.infer<typeof RepairTaskSchema>
export type InteractivePrompt = z.infer<typeof InteractivePromptSchema>
export type DiagnosisResponse = z.infer<typeof DiagnosisResponseSchema>

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  imageDataUrl?: string
  createdAt: string
}

export type DiagnosticStage = DiagnosisResponse['diagnostic_stage']

export type YoutubeVideoResult = {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
  url: string
  duration?: string
  relevanceExplanation: string
  matchQuality: 'model_specific' | 'broadly_relevant'
}

export type PartsSearchResult = {
  title: string
  merchant: string
  url: string
  note: string
  isVerifiedCompatibility: false
}
