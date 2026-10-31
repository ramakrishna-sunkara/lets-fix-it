import type { DiagnosisResponse, InteractivePrompt } from './types'

function inferInputType(prompt: string): InteractivePrompt['input_type'] {
  const lower: string = prompt.toLowerCase()
  if (
    /\b(brand|model|make|which|what kind|what type)\b/.test(lower) ||
    /\btell me the\b/.test(lower) ||
    /(బ్రాండ్|మోడల్|ఏ రకం)/.test(prompt)
  ) {
    return 'text'
  }
  if (
    /^(does|do|is|are|can|could|has|have|will|would|did)\b/.test(lower) ||
    /\byes\b.+\bno\b|\bno\b.+\byes\b/.test(lower) ||
    /^(ఏమైనా|ఏదైనా|ఉందా|ఉన్నాయా|వస్తుందా|పని చేస్తుందా|చేస్తుందా)/.test(
      prompt,
    ) ||
    /(అవును|కాదు)/.test(prompt)
  ) {
    return 'yes_no'
  }
  return 'text'
}

export function resolveInteractivePrompts(
  diagnosis: DiagnosisResponse | null,
): InteractivePrompt[] {
  if (!diagnosis) {
    return []
  }
  const structured: InteractivePrompt[] = Array.isArray(
    diagnosis.interactive_prompts,
  )
    ? diagnosis.interactive_prompts
    : []
  if (structured.length > 0) {
    return structured.map((prompt, index) => ({
      id: prompt.id || `prompt-${index + 1}`,
      prompt: prompt.prompt || '',
      input_type: prompt.input_type || 'text',
      choices: Array.isArray(prompt.choices) ? prompt.choices : [],
      placeholder: prompt.placeholder,
    }))
  }
  const legacyQuestions: string[] = Array.isArray(
    diagnosis.follow_up_questions,
  )
    ? diagnosis.follow_up_questions
    : []
  return legacyQuestions.slice(0, 3).map((prompt, index) => {
    const inputType = inferInputType(prompt)
    return {
      id: `legacy-${index + 1}`,
      prompt,
      input_type: inputType,
      choices: [],
      placeholder: undefined,
    }
  })
}
