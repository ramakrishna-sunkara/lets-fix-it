// Deployable Supabase Edge Function mirror of server/youtube.ts
// Secret: YOUTUBE_API_KEY

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
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      return Response.json(
        {
          error:
            'YouTube Data API is not configured. Set YOUTUBE_API_KEY secret.',
          code: 'MISSING_CONFIG',
        },
        { status: 503 },
      )
    }
    const body = await req.json()
    const query = String(body.query || '').trim()
    if (!query) {
      return Response.json(
        { error: 'A search query is required.', code: 'YOUTUBE_ERROR' },
        { status: 400 },
      )
    }
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '6',
      q: query,
      safeSearch: 'moderate',
      key: youtubeApiKey,
    })
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    )
    const payload = await response.json()
    if (!response.ok) {
      return Response.json(
        {
          error: payload.error?.message || 'YouTube search failed',
          code: 'YOUTUBE_ERROR',
        },
        { status: 502 },
      )
    }
    const videos = (payload.items || [])
      .filter((item: { id?: { videoId?: string } }) => item.id?.videoId)
      .map(
        (item: {
          id: { videoId: string }
          snippet: {
            title: string
            channelTitle: string
            thumbnails?: { medium?: { url: string } }
          }
        }) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnailUrl:
            item.snippet.thumbnails?.medium?.url ||
            `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          relevanceExplanation: `Result for query “${query}”. Verify model match before following.`,
          matchQuality: 'broadly_relevant',
        }),
      )
    return Response.json({
      query,
      videos,
      empty: videos.length === 0,
      message:
        videos.length === 0
          ? 'No suitable YouTube results were found for this query.'
          : undefined,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'YouTube search failed',
        code: 'YOUTUBE_ERROR',
      },
      { status: 502 },
    )
  }
})
