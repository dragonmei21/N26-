import type { Holding, PoolPortfolio, RankedPoolPortfolio, AllocationLine, CopyAllocation } from "@/types/poolPortfolio";

// ─── Similarity ──────────────────────────────────────────────────────────────

/**
 * Jaccard similarity on the set of tickers (ignores weights). Ranges 0–1.
 */
export function jaccardSimilarity(a: Holding[], b: Holding[]): number {
  const setA = new Set(a.map((h) => h.ticker));
  const setB = new Set(b.map((h) => h.ticker));
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Weighted cosine similarity. Builds sparse weight vectors over the union of
 * tickers and computes the cosine of the angle between them. Ranges 0–1.
 */
export function weightedCosineSimilarity(a: Holding[], b: Holding[]): number {
  const allTickers = [...new Set([...a.map((h) => h.ticker), ...b.map((h) => h.ticker)])];
  const vecA = allTickers.map((t) => a.find((h) => h.ticker === t)?.weight ?? 0);
  const vecB = allTickers.map((t) => b.find((h) => h.ticker === t)?.weight ?? 0);

  const dot  = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Combined relevance score: average of Jaccard and cosine.
 * Rewards both ticker overlap AND weight similarity.
 */
export function relevanceScore(userHoldings: Holding[], pool: Holding[]): number {
  return (jaccardSimilarity(userHoldings, pool) + weightedCosineSimilarity(userHoldings, pool)) / 2;
}

// ─── Ranking ─────────────────────────────────────────────────────────────────

const RELEVANCE_WEIGHT = 0.70;
const POPULARITY_WEIGHT = 0.30;

/**
 * Rank pool portfolios by relevance to the user (70%) + popularity (30%).
 *
 * Popularity is log-normalised to prevent high copy_counts from drowning out
 * relevance: log(1 + count) then min-max normalised to [0, 1].
 */
export function rankPoolPortfolios(
  userHoldings: Holding[],
  pools: PoolPortfolio[]
): RankedPoolPortfolio[] {
  if (pools.length === 0) return [];

  const withRelevance = pools.map((p) => ({
    ...p,
    relevanceScore: relevanceScore(userHoldings, p.holdings),
  }));

  const logCounts = withRelevance.map((p) => Math.log1p(p.copyCount));
  const minLog = Math.min(...logCounts);
  const maxLog = Math.max(...logCounts);
  const range  = maxLog - minLog;

  const ranked: RankedPoolPortfolio[] = withRelevance.map((p, i) => {
    const normPop   = range === 0 ? 0 : (logCounts[i] - minLog) / range;
    const finalScore = RELEVANCE_WEIGHT * p.relevanceScore + POPULARITY_WEIGHT * normPop;
    return { ...p, finalScore };
  });

  return ranked.sort((a, b) => b.finalScore - a.finalScore);
}

// ─── Copy Allocation ─────────────────────────────────────────────────────────

const MIN_ALLOCATION_EUR = 0.01;

/**
 * Compute a static weight-based allocation for a given investment amount.
 *
 * Weights are normalised in case they don't sum to exactly 1.
 * Throws if the amount is ≤ 0 or any per-holding slice would be below €0.01.
 */
export function computeCopyAllocation(
  pool: PoolPortfolio,
  investmentEUR: number
): CopyAllocation {
  if (investmentEUR <= 0) throw new Error("Investment amount must be greater than zero.");

  const totalWeight = pool.holdings.reduce((s, h) => s + h.weight, 0);
  if (totalWeight === 0) throw new Error("Portfolio has no holdings.");

  const lines: AllocationLine[] = pool.holdings.map((h) => {
    const normWeight = h.weight / totalWeight;
    const amountEUR  = Math.round(normWeight * investmentEUR * 100) / 100;
    return { ticker: h.ticker, name: h.name, weight: normWeight, amountEUR };
  });

  const tooSmall = lines.filter((l) => l.amountEUR > 0 && l.amountEUR < MIN_ALLOCATION_EUR);
  if (tooSmall.length > 0) {
    const minWeight = Math.min(...pool.holdings.map((h) => h.weight / totalWeight));
    const minNeeded = (MIN_ALLOCATION_EUR / minWeight).toFixed(2);
    throw new Error(
      `Investment amount too small. Minimum per holding is €${MIN_ALLOCATION_EUR}. ` +
      `Try investing at least €${minNeeded}.`
    );
  }

  return {
    poolPortfolioId:     pool.id,
    investmentAmountEUR: investmentEUR,
    lines,
    createdAt: new Date().toISOString(),
  };
}
