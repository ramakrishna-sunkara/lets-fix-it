import { useMemo, useState } from 'react'
import { useLocale } from '../context/locale_context'
import type { InteractivePrompt } from '../lib/types'

export type PromptAnswer = {
  prompt: InteractivePrompt
  answer: string
}

type InteractivePromptsProps = {
  prompts: InteractivePrompt[]
  disabled?: boolean
  onSubmitAnswers: (answers: PromptAnswer[]) => void
}

export function InteractivePrompts({
  prompts,
  disabled = false,
  onSubmitAnswers,
}: InteractivePromptsProps) {
  const { t } = useLocale()
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({})
  const yesNoOptions: string[] = [
    t.prompts.yes,
    t.prompts.no,
    t.prompts.notSure,
  ]

  const draftAnswers = useMemo(() => {
    return prompts
      .map((prompt) => {
        const selected: string = (selections[prompt.id] || '').trim()
        const typed: string = (textDrafts[prompt.id] || '').trim()
        const answer: string =
          prompt.input_type === 'text' ? typed : typed || selected
        if (!answer) {
          return null
        }
        return { prompt, answer }
      })
      .filter((item): item is PromptAnswer => item !== null)
  }, [prompts, selections, textDrafts])

  if (prompts.length === 0) {
    return null
  }

  const setSelection = (promptId: string, value: string) => {
    setSelections((prev) => ({ ...prev, [promptId]: value }))
    setTextDrafts((prev) => {
      if (!prev[promptId]) {
        return prev
      }
      const next = { ...prev }
      delete next[promptId]
      return next
    })
  }

  const handleSubmitAll = () => {
    if (disabled || draftAnswers.length === 0) {
      return
    }
    onSubmitAnswers(draftAnswers)
  }

  const answeredLabel: string = t.prompts.answeredCount
    .replace('{answered}', String(draftAnswers.length))
    .replace('{total}', String(prompts.length))

  return (
    <div className="space-y-3 rounded-2xl border border-accent/20 bg-accent-soft/40 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {t.prompts.title}
        </p>
        <p className="mt-1 text-xs text-muted">{t.prompts.hint}</p>
      </div>
      {prompts.map((prompt) => {
        const selected: string = selections[prompt.id] || ''
        const typed: string = textDrafts[prompt.id] || ''
        return (
          <div
            key={prompt.id}
            className="rounded-xl border border-line bg-paper p-3 shadow-soft"
          >
            <p className="text-sm font-medium text-charcoal">{prompt.prompt}</p>
            {prompt.input_type === 'yes_no' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {yesNoOptions.map((option) => {
                  const isActive: boolean = selected === option && !typed
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelection(prompt.id, option)}
                      className={`rounded-full border px-4 py-2 text-sm transition disabled:opacity-50 ${
                        isActive
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line text-graphite hover:border-accent hover:bg-accent-soft hover:text-accent'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            ) : null}
            {prompt.input_type === 'choice' ? (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {prompt.choices.map((option) => {
                    const isActive: boolean = selected === option && !typed
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelection(prompt.id, option)}
                        className={`rounded-full border px-3 py-2 text-sm transition disabled:opacity-50 ${
                          isActive
                            ? 'border-accent bg-accent-soft text-accent'
                            : 'border-line text-graphite hover:border-accent hover:bg-accent-soft hover:text-accent'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                <input
                  value={typed}
                  disabled={disabled}
                  onChange={(event) => {
                    const value: string = event.target.value
                    setTextDrafts((prev) => ({
                      ...prev,
                      [prompt.id]: value,
                    }))
                    if (value.trim()) {
                      setSelections((prev) => {
                        if (!prev[prompt.id]) {
                          return prev
                        }
                        const next = { ...prev }
                        delete next[prompt.id]
                        return next
                      })
                    }
                  }}
                  placeholder={prompt.placeholder || t.prompts.orTypeOwn}
                  className="w-full rounded-xl border border-line bg-warm-white px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
                />
              </div>
            ) : null}
            {prompt.input_type === 'text' ? (
              <input
                value={typed}
                disabled={disabled}
                onChange={(event) =>
                  setTextDrafts((prev) => ({
                    ...prev,
                    [prompt.id]: event.target.value,
                  }))
                }
                placeholder={prompt.placeholder || t.prompts.typeAnswer}
                className="mt-3 w-full rounded-xl border border-line bg-warm-white px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
              />
            ) : null}
          </div>
        )
      })}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-xs text-muted">{answeredLabel}</p>
        <button
          type="button"
          disabled={disabled || draftAnswers.length === 0}
          onClick={handleSubmitAll}
          className="rounded-xl bg-charcoal px-4 py-2 text-sm text-warm-white disabled:opacity-50"
        >
          {t.prompts.sendAnswers}
        </button>
      </div>
    </div>
  )
}
