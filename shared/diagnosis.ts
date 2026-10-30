import { z } from 'zod'

export const ProductSummarySchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  notes: z.string().optional(),
})

export const PossibleCauseSchema = z.object({
  cause: z.string(),
  why_plausible: z.string(),
  how_to_confirm: z.string(),
})

export const RepairTaskSchema = z.object({
  title: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'professional']),
  steps: z.array(z.string()),
  tools: z.array(z.string()),
  parts_hints: z.array(z.string()),
})

export const DiagnosisResponseSchema = z.object({
  assistant_message: z.string(),
  product_summary: ProductSummarySchema.default({}),
  diagnostic_stage: z.enum([
    'gathering',
    'analyzing',
    'diagnosis_ready',
    'repair_plan',
  ]),
  follow_up_questions: z.array(z.string()).max(5).default([]),
  findings: z
    .object({
      observations: z.array(z.string()).default([]),
      unknowns: z.array(z.string()).default([]),
    })
    .default({ observations: [], unknowns: [] }),
  visible_evidence: z.array(z.string()).default([]),
  possible_causes: z.array(PossibleCauseSchema).default([]),
  confidence_explanation: z.string().default(''),
  recommended_next_step: z.string().default(''),
  safety_warnings: z.array(z.string()).default([]),
  repair_tasks: z.array(RepairTaskSchema).default([]),
  requires_professional_help: z.boolean().default(false),
  youtube_search_query: z.string().nullable().default(null),
  parts_search_queries: z.array(z.string()).default([]),
})

export type ProductSummary = z.infer<typeof ProductSummarySchema>
export type PossibleCause = z.infer<typeof PossibleCauseSchema>
export type RepairTask = z.infer<typeof RepairTaskSchema>
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

export const SUPPORTED_CATEGORIES = [
  'car_remote',
  'bluetooth_speaker',
] as const

export type SupportedCategory = (typeof SUPPORTED_CATEGORIES)[number]

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
