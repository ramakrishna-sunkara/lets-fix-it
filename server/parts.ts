import type { PartsSearchResult } from '../shared/diagnosis'

type MerchantSearch = {
  merchant: string
  buildUrl: (encodedQuery: string) => string
  note: string
}

const MERCHANTS: MerchantSearch[] = [
  {
    merchant: 'Amazon',
    buildUrl: (encodedQuery: string) =>
      `https://www.amazon.in/s?k=${encodedQuery}`,
    note: 'External Amazon.in search link only. Compatibility is not verified by LET\'S FIX IT AI. Confirm voltage, size, and connector before buying.',
  },
  {
    merchant: 'Flipkart',
    buildUrl: (encodedQuery: string) =>
      `https://www.flipkart.com/search?q=${encodedQuery}`,
    note: 'External Flipkart search link only. Listing details vary — verify part fitment and seller ratings yourself.',
  },
  {
    merchant: 'Meesho',
    buildUrl: (encodedQuery: string) =>
      `https://www.meesho.com/search?q=${encodedQuery}`,
    note: 'External Meesho search link only. Confirm model compatibility and return policy before ordering.',
  },
]

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
    for (const merchant of MERCHANTS) {
      results.push({
        title: `Search: ${query}`,
        merchant: merchant.merchant,
        url: merchant.buildUrl(encoded),
        note: merchant.note,
        isVerifiedCompatibility: false,
      })
    }
  }
  return results
}
