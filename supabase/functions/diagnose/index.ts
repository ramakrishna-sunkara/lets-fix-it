// Deployable Supabase Edge Function mirror of server/diagnose.ts
// Secrets: GEMINI_API_KEY, optional GEMMA_MODEL

import { DiagnosisResponseSchema } from '../../../shared/diagnosis.ts'

const SYSTEM_PROMPT = `You are LET'S FIX IT AI — a careful repair diagnosis assistant.
Return ONLY valid JSON matching the diagnosis schema. Separate observations, possible causes, and unknowns. Never invent evidence.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const gemmaModel = Deno.env.get('GEMMA_MODEL') || 'gemma-4-26b-a4b-it'
    if (!geminiApiKey) {
      return Response.json(
        {
          error:
            'Gemma 4 / Gemini API is not configured. Set GEMINI_API_KEY secret.',
          code: 'MISSING_CONFIG',
        },
        { status: 503 },
      )
    }

    const body = await req.json()
    const messages = body.messages || []
    const contents = messages.map(
      (message: {
        role: string
        content: string
        imageBase64?: string
        imageMimeType?: string
      }) => {
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
      },
    )

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${gemmaModel}:generateContent?key=${encodeURIComponent(geminiApiKey)}`
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
      const errorText = await response.text()
      return Response.json(
        { error: `Gemma API error: ${errorText.slice(0, 400)}`, code: 'DIAGNOSIS_ERROR' },
        { status: 502 },
      )
    }
    const payload = await response.json()
    const text =
      payload.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('\n') || ''
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    const parsed = JSON.parse(text.slice(start, end + 1))
    const diagnosis = DiagnosisResponseSchema.parse(parsed)
    return Response.json({ diagnosis })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Diagnosis failed',
        code: 'DIAGNOSIS_ERROR',
      },
      { status: 502 },
    )
  }
})
