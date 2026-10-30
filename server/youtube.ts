import type { YoutubeVideoResult } from '../shared/diagnosis.ts'
import { loadServerEnv, missingConfigMessage } from './env.ts'
import { ConfigError } from './diagnose.ts'

type YoutubeSearchItem = {
  id: { videoId?: string }
  snippet: {
    title: string
    channelTitle: string
    description: string
    thumbnails?: {
      medium?: { url: string }
      high?: { url: string }
      default?: { url: string }
    }
  }
}

type YoutubeSearchResponse = {
  items?: YoutubeSearchItem[]
  error?: { message?: string; errors?: Array<{ reason?: string }> }
}

function scoreMatch(
  query: string,
  title: string,
): 'model_specific' | 'broadly_relevant' {
  const tokens: string[] = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token: string) => token.length > 2)
  const titleLower: string = title.toLowerCase()
  const hits: number = tokens.filter((token: string) =>
    titleLower.includes(token),
  ).length
  const ratio: number = tokens.length === 0 ? 0 : hits / tokens.length
  return ratio >= 0.55 ? 'model_specific' : 'broadly_relevant'
}

function buildRelevance(
  query: string,
  title: string,
  matchQuality: 'model_specific' | 'broadly_relevant',
): string {
  if (matchQuality === 'model_specific') {
    return `Title closely matches the repair query “${query}”. Treat as a strong candidate, not a guaranteed exact procedure.`
  }
  return `Broadly related to “${query}” via “${title}”. Verify model and steps before following.`
}

export async function searchYoutubeVideos(
  query: string,
): Promise<YoutubeVideoResult[]> {
  const env = loadServerEnv()
  if (!env.youtubeApiKey) {
    throw new ConfigError(
      missingConfigMessage('YouTube Data API', 'YOUTUBE_API_KEY'),
    )
  }
  const trimmedQuery: string = query.trim()
  if (!trimmedQuery) {
    throw new Error('A search query is required.')
  }
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '6',
    q: trimmedQuery,
    safeSearch: 'moderate',
    key: env.youtubeApiKey,
  })
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
  )
  const payload = (await response.json()) as YoutubeSearchResponse
  if (!response.ok) {
    const reason: string =
      payload.error?.errors?.[0]?.reason ||
      payload.error?.message ||
      `HTTP ${response.status}`
    if (reason.toLowerCase().includes('quota')) {
      throw new Error(
        'YouTube API quota exceeded. Try again later or use a different API key.',
      )
    }
    throw new Error(`YouTube search failed: ${reason}`)
  }
  const items: YoutubeSearchItem[] = payload.items || []
  return items
    .filter((item: YoutubeSearchItem) => Boolean(item.id.videoId))
    .map((item: YoutubeSearchItem) => {
      const videoId: string = item.id.videoId as string
      const title: string = item.snippet.title
      const matchQuality = scoreMatch(trimmedQuery, title)
      const thumbnailUrl: string =
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      return {
        videoId,
        title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        relevanceExplanation: buildRelevance(
          trimmedQuery,
          title,
          matchQuality,
        ),
        matchQuality,
      }
    })
}
