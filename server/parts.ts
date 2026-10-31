import type { PartsSearchResult } from '../shared/diagnosis'

export function buildPartsSearchLinks(
  queries: string[],
): PartsSearchResult[] {
  const uniqueQueries: string[] = [
    ...new Set(
      queries
        .map((query: string) => query.trim())
        .filter((query: string) => query.length > 0),
    ),
  ].slice(0, 5)
  const results: PartsSearchResult[] = []
  for (const query of uniqueQueries) {
    const encoded: string = encodeURIComponent(query)
    results.push({
      title: `Search: ${query}`,
      merchant: 'Amazon',
      url: `https://www.amazon.com/s?k=${encoded}`,
      note: 'External search link only. Compatibility is not verified by LET\'S FIX IT AI. Confirm voltage, size, and connector before buying.',
      isVerifiedCompatibility: false,
    })
    results.push({
      title: `Search: ${query}`,
      merchant: 'eBay',
      url: `https://www.ebay.com/sch/i.html?_nkw=${encoded}`,
      note: 'External search link only. Seller listings vary — verify part fitment yourself.',
      isVerifiedCompatibility: false,
    })
    results.push({
      title: `Search guides: ${query}`,
      merchant: 'iFixit',
      url: `https://www.ifixit.com/Search?query=${encoded}`,
      note: 'Repair guides and community parts references. Not a guarantee of model-specific coverage.',
      isVerifiedCompatibility: false,
    })
  }
  return results
}
