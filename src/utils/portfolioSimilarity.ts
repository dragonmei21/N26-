import type { Holding, PoolPortfolio, RankedPoolPortfolio } from "@/types/poolPortfolio";

/**
 * Weighted cosine similarity between two holding sets.
 * Each portfolio is represented as a weight vector over the union of tickers.
 * Returns a value in [0, 1] — 1 means identical composition.
 */
export function weightedCosineSimilarity(a: Holding[], b: Holding[]): number {
  const tickerSet = new Set([...a.map((h) => h.ticker), ...b.map((h) => h.ticker)]);

  const vecA: number[] = [];
  const vecB: number[] = [];

  const mapA = new Map(a.map((h) => [h.ticker, h.weight]));
  const mapB = new Map(b.map((h) => [h.ticker, h.weight]));

  for (const ticker of tickerSet) {
    vecA.push(mapA.get(ticker) ?? 0);
    vecB.push(mapB.get(ticker) ?? 0);
  }

  const dot = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Jaccard similarity on the ticker sets (ignores weights).
 * Returns a value in [0, 1].
 */
export function jaccardSimilarity(a: Holding[], b: Holding[]): number {
  const setA = new Set(a.map((h) => h.ticker));
  const setB = new Set(b.map((h) => h.ticker));
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Combined relevance: 70% weighted cosine + 30% Jaccard.
 */
export function relevanceScore(userHoldings: Holding[], pool: Holding[]): number {
  return 0.7 * weightedCosineSimilarity(userHoldings, pool) +
         0.3 * jaccardSimilarity(userHoldings, pool);
}

/**
 * Rank a list of pool portfolios for a given user's holdings.
 *
 * final_score = 0.75 * relevance + 0.25 * normalised_popularity
 * Popularity is normalised via log(1 + copyCount) then min-max scaled
 * across the visible list so it doesn't overwhelm relevance.
 */
export function rankPoolPortfolios(
  pools: PoolPortfolio[],
  userHoldings: Holding[],
  relevanceWeight = 0.75,
  popularityWeight = 0.25,
): RankedPoolPortfolio[] {
  if (pools.length === 0) return [];

  const withRelevance = pools.map((p) => ({
    ...p,
    relevanceScore: relevanceScore(userHoldings, p.holdings),
    logPop: Math.log1p(p.copyCount),
    finalScore: 0,
  }));

  const maxLog = Math.max(...withRelevance.map((p) => p.logPop));
  const minLog = Math.min(...withRelevance.map((p) => p.logPop));
  const logRange = maxLog - minLog || 1;

  return withRelevance
    .map(({ logPop, ...p }) => ({
      ...p,
      finalScore:
        relevanceWeight * p.relevanceScore +
        popularityWeight * ((logPop - minLog) / logRange),
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
}
