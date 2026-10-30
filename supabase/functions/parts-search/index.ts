// Deployable Supabase Edge Function mirror of server/parts.ts

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
    const body = await req.json()
    const queries: string[] = Array.isArray(body.queries) ? body.queries : []
    const unique = [
      ...new Set(
        queries.map((q: string) => String(q).trim()).filter(Boolean),
      ),
    ].slice(0, 5)
    const results = unique.flatMap((query: string) => {
      const encoded = encodeURIComponent(query)
      return [
        {
          title: `Search: ${query}`,
          merchant: 'Amazon',
          url: `https://www.amazon.com/s?k=${encoded}`,
          note: 'External search link only. Compatibility is not verified.',
          isVerifiedCompatibility: false,
        },
        {
          title: `Search: ${query}`,
          merchant: 'eBay',
          url: `https://www.ebay.com/sch/i.html?_nkw=${encoded}`,
          note: 'External search link only. Verify fitment yourself.',
          isVerifiedCompatibility: false,
        },
        {
          title: `Search guides: ${query}`,
          merchant: 'iFixit',
          url: `https://www.ifixit.com/Search?query=${encoded}`,
          note: 'Repair guides reference — not guaranteed model-specific.',
          isVerifiedCompatibility: false,
        },
      ]
    })
    return Response.json({
      results,
      disclaimer:
        'These are external merchant search links only. No invented prices or verified compatibility.',
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Parts search failed',
        code: 'PARTS_ERROR',
      },
      { status: 502 },
    )
  }
})
