import { describe, it, expect } from "vitest";
import {
  jaccardSimilarity,
  weightedCosineSimilarity,
  relevanceScore,
  rankPoolPortfolios,
  computeCopyAllocation,
} from "@/utils/portfolioSimilarity";
import type { Holding, PoolPortfolio } from "@/types/poolPortfolio";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const user: Holding[] = [
  { ticker: "NVDA", name: "NVIDIA",    weight: 0.40 },
  { ticker: "AAPL", name: "Apple",     weight: 0.35 },
  { ticker: "MSFT", name: "Microsoft", weight: 0.25 },
];

const perfect: Holding[] = [
  { ticker: "NVDA", name: "NVIDIA",    weight: 0.40 },
  { ticker: "AAPL", name: "Apple",     weight: 0.35 },
  { ticker: "MSFT", name: "Microsoft", weight: 0.25 },
];

const partial: Holding[] = [
  { ticker: "NVDA", name: "NVIDIA",  weight: 0.50 },
  { ticker: "BTC",  name: "Bitcoin", weight: 0.30 },
  { ticker: "ETH",  name: "Ethereum",weight: 0.20 },
];

const none: Holding[] = [
  { ticker: "BTC", name: "Bitcoin",  weight: 0.60 },
  { ticker: "ETH", name: "Ethereum", weight: 0.40 },
];

function makePool(id: string, holdings: Holding[], copyCount: number): PoolPortfolio {
  return {
    id, name: id, creator: "@test",
    holdings,
    returns: { "1D": 0, "1W": 0, "1M": 0, "1Y": 0, ALL: 0 },
    riskLabel: "Medium", copyCount,
    createdAt: new Date().toISOString(),
  };
}

// ─── Jaccard ─────────────────────────────────────────────────────────────────

describe("jaccardSimilarity", () => {
  it("returns 1 for identical ticker sets", () => {
    expect(jaccardSimilarity(user, perfect)).toBe(1);
  });
  it("returns 0 for completely disjoint sets", () => {
    expect(jaccardSimilarity(user, none)).toBe(0);
  });
  it("partial overlap is strictly between 0 and 1", () => {
    const s = jaccardSimilarity(user, partial);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });
  it("returns 0 for empty inputs", () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });
  it("is symmetric", () => {
    expect(jaccardSimilarity(user, partial)).toBeCloseTo(jaccardSimilarity(partial, user), 10);
  });
});

// ─── Cosine ──────────────────────────────────────────────────────────────────

describe("weightedCosineSimilarity", () => {
  it("returns 1 for identical weight vectors", () => {
    expect(weightedCosineSimilarity(user, perfect)).toBeCloseTo(1, 5);
  });
  it("returns 0 for orthogonal (disjoint) portfolios", () => {
    expect(weightedCosineSimilarity(user, none)).toBe(0);
  });
  it("returns value in [0,1] for partial overlap", () => {
    const s = weightedCosineSimilarity(user, partial);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
  it("lower score when weights differ despite same tickers", () => {
    const skewed: Holding[] = [
      { ticker: "NVDA", name: "NVIDIA",    weight: 0.05 },
      { ticker: "AAPL", name: "Apple",     weight: 0.05 },
      { ticker: "MSFT", name: "Microsoft", weight: 0.90 },
    ];
    expect(weightedCosineSimilarity(user, perfect)).toBeGreaterThan(
      weightedCosineSimilarity(user, skewed)
    );
  });
});

// ─── Combined relevance ───────────────────────────────────────────────────────

describe("relevanceScore", () => {
  it("returns 1 for a perfect match", () => {
    expect(relevanceScore(user, perfect)).toBeCloseTo(1, 5);
  });
  it("returns 0 for no overlap", () => {
    expect(relevanceScore(user, none)).toBe(0);
  });
  it("partial overlap is strictly between 0 and 1", () => {
    const s = relevanceScore(user, partial);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });
});

// ─── Ranking ─────────────────────────────────────────────────────────────────

describe("rankPoolPortfolios", () => {
  it("returns empty array for empty input", () => {
    expect(rankPoolPortfolios(user, [])).toEqual([]);
  });
  it("ranks perfect-match above no-overlap even with high popularity", () => {
    const ranked = rankPoolPortfolios(user, [
      makePool("no-overlap", none,    9999),
      makePool("perfect",    perfect, 1),
    ]);
    expect(ranked[0].id).toBe("perfect");
  });
  it("includes relevanceScore and finalScore on each result", () => {
    const ranked = rankPoolPortfolios(user, [makePool("a", perfect, 10)]);
    expect(ranked[0]).toHaveProperty("relevanceScore");
    expect(ranked[0]).toHaveProperty("finalScore");
  });
  it("finalScore is in [0, 1]", () => {
    rankPoolPortfolios(user, [makePool("p1", perfect, 100), makePool("p2", none, 1)])
      .forEach((p) => {
        expect(p.finalScore).toBeGreaterThanOrEqual(0);
        expect(p.finalScore).toBeLessThanOrEqual(1);
      });
  });
  it("popularity breaks ties between equally-relevant portfolios", () => {
    const ranked = rankPoolPortfolios(user, [
      makePool("low-pop",  perfect, 1),
      makePool("high-pop", perfect, 100000),
    ]);
    expect(ranked[0].id).toBe("high-pop");
  });
  it("sorted descending by finalScore", () => {
    const ranked = rankPoolPortfolios(user, [
      makePool("none",    none,    50),
      makePool("partial", partial, 200),
      makePool("full",    perfect, 10),
    ]);
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].finalScore).toBeGreaterThanOrEqual(ranked[i + 1].finalScore);
    }
  });
});

// ─── Copy allocation ──────────────────────────────────────────────────────────

describe("computeCopyAllocation", () => {
  const pool = makePool("alloc-test", [
    { ticker: "AAPL", name: "Apple",     weight: 0.40 },
    { ticker: "MSFT", name: "Microsoft", weight: 0.30 },
    { ticker: "NVDA", name: "NVIDIA",    weight: 0.20 },
    { ticker: "TSLA", name: "Tesla",     weight: 0.10 },
  ], 100);

  it("allocates €5 correctly by weight", () => {
    const alloc = computeCopyAllocation(pool, 5);
    expect(alloc.lines.find((l) => l.ticker === "AAPL")?.amountEUR).toBeCloseTo(2.00, 2);
    expect(alloc.lines.find((l) => l.ticker === "MSFT")?.amountEUR).toBeCloseTo(1.50, 2);
    expect(alloc.lines.find((l) => l.ticker === "NVDA")?.amountEUR).toBeCloseTo(1.00, 2);
    expect(alloc.lines.find((l) => l.ticker === "TSLA")?.amountEUR).toBeCloseTo(0.50, 2);
  });
  it("allocations sum to the investment amount", () => {
    const amount = 137.50;
    const sum = computeCopyAllocation(pool, amount).lines.reduce((s, l) => s + l.amountEUR, 0);
    expect(sum).toBeCloseTo(amount, 1);
  });
  it("throws for investment amount ≤ 0", () => {
    expect(() => computeCopyAllocation(pool, 0)).toThrow();
    expect(() => computeCopyAllocation(pool, -10)).toThrow();
  });
  it("includes poolPortfolioId and createdAt", () => {
    const alloc = computeCopyAllocation(pool, 10);
    expect(alloc.poolPortfolioId).toBe(pool.id);
    expect(alloc.createdAt).toBeTruthy();
  });
  it("normalises weights that do not sum to 1", () => {
    const unnorm = makePool("unnorm", [
      { ticker: "X", name: "X", weight: 2 },
      { ticker: "Y", name: "Y", weight: 2 },
    ], 0);
    const alloc = computeCopyAllocation(unnorm, 10);
    expect(alloc.lines[0].amountEUR).toBeCloseTo(5, 2);
    expect(alloc.lines[1].amountEUR).toBeCloseTo(5, 2);
  });
});
