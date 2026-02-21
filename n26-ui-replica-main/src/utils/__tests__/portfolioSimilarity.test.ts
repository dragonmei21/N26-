import { describe, it, expect } from "vitest";
import {
  weightedCosineSimilarity,
  jaccardSimilarity,
  relevanceScore,
  rankPoolPortfolios,
} from "../portfolioSimilarity";
import type { Holding, PoolPortfolio } from "@/types/poolPortfolio";

// ── helpers ──────────────────────────────────────────────────────────────────

const h = (ticker: string, weight: number): Holding => ({ ticker, name: ticker, weight });

function makePool(id: string, holdings: Holding[], copyCount = 100): PoolPortfolio {
  return {
    id,
    name: id,
    creator: "@test",
    holdings,
    returns: { "1D": 0, "1W": 0, "1M": 0, "1Y": 0, "ALL": 0 },
    riskLabel: "Medium",
    copyCount,
    createdAt: "2025-01-01",
  };
}

// ── weightedCosineSimilarity ─────────────────────────────────────────────────

describe("weightedCosineSimilarity", () => {
  it("identical portfolios → 1", () => {
    const a = [h("NVDA", 0.5), h("AAPL", 0.5)];
    expect(weightedCosineSimilarity(a, a)).toBeCloseTo(1, 5);
  });

  it("completely disjoint portfolios → 0", () => {
    const a = [h("NVDA", 1)];
    const b = [h("BTC", 1)];
    expect(weightedCosineSimilarity(a, b)).toBe(0);
  });

  it("partial overlap returns value in (0,1)", () => {
    const a = [h("NVDA", 0.6), h("AAPL", 0.4)];
    const b = [h("NVDA", 0.4), h("BTC", 0.6)];
    const score = weightedCosineSimilarity(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("empty vectors → 0", () => {
    expect(weightedCosineSimilarity([], [])).toBe(0);
  });
});

// ── jaccardSimilarity ────────────────────────────────────────────────────────

describe("jaccardSimilarity", () => {
  it("identical sets → 1", () => {
    const a = [h("ETH", 0.5), h("BTC", 0.5)];
    expect(jaccardSimilarity(a, a)).toBe(1);
  });

  it("no overlap → 0", () => {
    const a = [h("ETH", 1)];
    const b = [h("NVDA", 1)];
    expect(jaccardSimilarity(a, b)).toBe(0);
  });

  it("50% overlap", () => {
    const a = [h("ETH", 0.5), h("BTC", 0.5)];
    const b = [h("ETH", 0.5), h("NVDA", 0.5)];
    // intersection = {ETH}, union = {ETH, BTC, NVDA} → 1/3
    expect(jaccardSimilarity(a, b)).toBeCloseTo(1 / 3, 5);
  });

  it("empty sets → 0", () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });
});

// ── rankPoolPortfolios ────────────────────────────────────────────────────────

describe("rankPoolPortfolios", () => {
  const userHoldings: Holding[] = [
    h("NVDA", 0.5),
    h("AAPL", 0.3),
    h("ETH", 0.2),
  ];

  const highRelevanceLowPop = makePool(
    "high-rel",
    [h("NVDA", 0.5), h("AAPL", 0.3), h("ETH", 0.2)],
    10,           // low copy count
  );
  const lowRelevanceHighPop = makePool(
    "low-rel",
    [h("SGLN", 0.5), h("VWCE", 0.5)],
    100000,       // massive copy count
  );
  const mediumBoth = makePool(
    "mid",
    [h("NVDA", 0.4), h("BTC", 0.3), h("MSFT", 0.3)],
    500,
  );

  it("returns same number of pools", () => {
    const result = rankPoolPortfolios([highRelevanceLowPop, lowRelevanceHighPop, mediumBoth], userHoldings);
    expect(result).toHaveLength(3);
  });

  it("highly relevant portfolio ranks above disjoint high-popularity pool", () => {
    const result = rankPoolPortfolios([lowRelevanceHighPop, highRelevanceLowPop], userHoldings);
    expect(result[0].id).toBe("high-rel");
  });

  it("finalScore is always in [0, 1]", () => {
    const result = rankPoolPortfolios([highRelevanceLowPop, lowRelevanceHighPop, mediumBoth], userHoldings);
    for (const p of result) {
      expect(p.finalScore).toBeGreaterThanOrEqual(0);
      expect(p.finalScore).toBeLessThanOrEqual(1);
    }
  });

  it("descending sort order", () => {
    const result = rankPoolPortfolios([lowRelevanceHighPop, highRelevanceLowPop, mediumBoth], userHoldings);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].finalScore).toBeGreaterThanOrEqual(result[i].finalScore);
    }
  });

  it("empty pool list → empty result", () => {
    expect(rankPoolPortfolios([], userHoldings)).toEqual([]);
  });

  it("empty user holdings still ranks without crash", () => {
    const result = rankPoolPortfolios([highRelevanceLowPop, lowRelevanceHighPop], []);
    expect(result).toHaveLength(2);
  });
});
