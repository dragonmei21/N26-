import type { PortfolioHolding } from "@/data/portfolioHoldings";

export interface ExposureItem {
  label: string;
  value: number;
  percent: number;
}

export interface ConcentrationMetrics {
  top1Pct: number;
  top3Pct: number;
  top5Pct: number;
  hhi: number;
}

export interface AssetClassSplit {
  cryptoPct: number;
  stockPct: number;
  safePct: number;
}

export interface ComparisonItem {
  label: string;
  current: number;
  target: number;
}

export interface PortfolioInsights {
  totalValue: number;
  regionExposure: ExposureItem[];
  sectorExposure: ExposureItem[];
  concentration: ConcentrationMetrics;
  diversificationScore: number;
  leverageAssessment: "Over" | "Neutral" | "Under";
  leverageReason: string;
  overallAssessment: string;
  topHoldings: { ticker: string; name: string; percent: number }[];
  currentSplit: AssetClassSplit;
  targetSplit: AssetClassSplit;
  suggestions: string[];
  regionComparison: ComparisonItem[];
  sectorComparison: ComparisonItem[];
}

function groupBy(holdings: PortfolioHolding[], key: "region" | "sector"): ExposureItem[] {
  const total = holdings.reduce((s, h) => s + h.valueEUR, 0);
  const map = new Map<string, number>();
  for (const h of holdings) {
    map.set(h[key], (map.get(h[key]) || 0) + h.valueEUR);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value, percent: (value / total) * 100 }))
    .sort((a, b) => b.percent - a.percent);
}

function computeConcentration(holdings: PortfolioHolding[]): ConcentrationMetrics {
  const total = holdings.reduce((s, h) => s + h.valueEUR, 0);
  const sorted = [...holdings].sort((a, b) => b.valueEUR - a.valueEUR);
  const percents = sorted.map((h) => h.valueEUR / total);

  const topN = (n: number) => percents.slice(0, n).reduce((s, p) => s + p, 0) * 100;
  const hhi = percents.reduce((s, p) => s + p * p * 10000, 0);

  return { top1Pct: topN(1), top3Pct: topN(3), top5Pct: topN(5), hhi: Math.round(hhi) };
}

export function computeInsights(
  holdings: PortfolioHolding[],
  riskProfile: "Conservative" | "Balanced" | "Growth" = "Balanced"
): PortfolioInsights {
  const totalValue = holdings.reduce((s, h) => s + h.valueEUR, 0);
  const regionExposure = groupBy(holdings, "region");
  const sectorExposure = groupBy(holdings, "sector");
  const concentration = computeConcentration(holdings);

  // Diversification score: 0–100
  const regionSpread = Math.min(regionExposure.length / 5, 1) * 30;
  const sectorSpread = Math.min(sectorExposure.length / 8, 1) * 30;
  const concScore = Math.max(0, 40 - (concentration.hhi / 50));
  const diversificationScore = Math.round(Math.min(regionSpread + sectorSpread + concScore, 100));

  // Top holdings
  const sorted = [...holdings].sort((a, b) => b.valueEUR - a.valueEUR);
  const topHoldings = sorted.slice(0, 5).map((h) => ({
    ticker: h.ticker,
    name: h.name,
    percent: (h.valueEUR / totalValue) * 100,
  }));

  // Asset class split (current)
  const cryptoVal = holdings.filter((h) => h.assetType === "crypto").reduce((s, h) => s + h.valueEUR, 0);
  const stockVal  = holdings.filter((h) => h.assetType === "stock").reduce((s, h) => s + h.valueEUR, 0);
  const safeVal   = holdings.filter((h) => ["bond", "commodity"].includes(h.assetType)).reduce((s, h) => s + h.valueEUR, 0);
  const cryptoPct = cryptoVal / totalValue;
  const equityPct = stockVal / totalValue;
  const safePct   = safeVal / totalValue;

  const currentSplit: AssetClassSplit = {
    cryptoPct: Math.round(cryptoPct * 100),
    stockPct:  Math.round(equityPct * 100),
    safePct:   Math.round(safePct * 100),
  };

  // Target splits per profile
  const targetSplits: Record<string, AssetClassSplit> = {
    Conservative: { cryptoPct: 15, stockPct: 45, safePct: 40 },
    Balanced:     { cryptoPct: 30, stockPct: 55, safePct: 15 },
    Growth:       { cryptoPct: 45, stockPct: 50, safePct: 5  },
  };
  const targetSplit = targetSplits[riskProfile];

  // Leverage assessment
  const riskTargets = { Conservative: 0.3, Balanced: 0.55, Growth: 0.75 };
  const actualRisk = cryptoPct * 1.5 + equityPct * 1.0 + safePct * 0.3;
  const target = riskTargets[riskProfile];

  let leverageAssessment: "Over" | "Neutral" | "Under";
  let leverageReason: string;

  if (actualRisk > target + 0.2) {
    leverageAssessment = "Over";
    leverageReason = `High exposure to volatile assets (${(cryptoPct * 100).toFixed(0)}% crypto, ${(equityPct * 100).toFixed(0)}% stocks) exceeds your ${riskProfile} target.`;
  } else if (actualRisk < target - 0.2) {
    leverageAssessment = "Under";
    leverageReason = `Your portfolio is more conservative than your ${riskProfile} profile, with ${(safePct * 100).toFixed(0)}% in safe-haven assets.`;
  } else {
    leverageAssessment = "Neutral";
    leverageReason = `Your risk exposure aligns well with a ${riskProfile} profile.`;
  }

  // Region comparison
  const targetRegions: Record<string, Record<string, number>> = {
    Conservative: { USA: 55, Europe: 30, Global: 15 },
    Balanced:     { USA: 40, Europe: 20, Global: 40 },
    Growth:       { USA: 30, Europe: 10, Global: 60 },
  };
  const regionTargetMap = targetRegions[riskProfile];
  const allRegionLabels = new Set([...regionExposure.map((r) => r.label), ...Object.keys(regionTargetMap)]);
  const regionComparison: ComparisonItem[] = Array.from(allRegionLabels)
    .map((label) => ({
      label,
      current: Math.round(regionExposure.find((r) => r.label === label)?.percent ?? 0),
      target:  regionTargetMap[label] ?? 0,
    }))
    .sort((a, b) => b.current - a.current);

  // Sector comparison
  const targetSectors: Record<string, Record<string, number>> = {
    Conservative: { Technology: 20, Crypto: 5,  "Consumer Discretionary": 10, Diversified: 35, Commodities: 25, Healthcare: 5 },
    Balanced:     { Technology: 35, Crypto: 20, "Consumer Discretionary": 15, Diversified: 20, Commodities: 10 },
    Growth:       { Technology: 40, Crypto: 40, "Consumer Discretionary": 15, Diversified: 5,  Commodities: 0  },
  };
  const sectorTargetMap = targetSectors[riskProfile];
  const allSectorLabels = new Set([...sectorExposure.map((s) => s.label), ...Object.keys(sectorTargetMap)]);
  const sectorComparison: ComparisonItem[] = Array.from(allSectorLabels)
    .map((label) => ({
      label,
      current: Math.round(sectorExposure.find((s) => s.label === label)?.percent ?? 0),
      target:  sectorTargetMap[label] ?? 0,
    }))
    .sort((a, b) => b.current - a.current);

  // Per-profile actionable suggestions
  const cryptoDiff = targetSplit.cryptoPct - currentSplit.cryptoPct;
  const stockDiff  = targetSplit.stockPct  - currentSplit.stockPct;
  const safeDiff   = targetSplit.safePct   - currentSplit.safePct;

  const suggestions: string[] = [];
  if (Math.abs(cryptoDiff) >= 5) {
    suggestions.push(cryptoDiff > 0
      ? `Increase crypto allocation by ~${cryptoDiff}% to reach your ${riskProfile} target.`
      : `Reduce crypto exposure by ~${Math.abs(cryptoDiff)}% — it's above your ${riskProfile} target.`);
  }
  if (Math.abs(stockDiff) >= 5) {
    suggestions.push(stockDiff > 0
      ? `Add ~${stockDiff}% more in equities (e.g. S&P 500 ETF) to hit your ${riskProfile} target.`
      : `Trim equity exposure by ~${Math.abs(stockDiff)}% to stay within ${riskProfile} bounds.`);
  }
  if (Math.abs(safeDiff) >= 5) {
    suggestions.push(safeDiff > 0
      ? `Add ~${safeDiff}% in bonds or gold to improve stability for a ${riskProfile} profile.`
      : `You can reduce bonds/safe-havens by ~${Math.abs(safeDiff)}% and redeploy into growth assets.`);
  }
  if (suggestions.length === 0) {
    suggestions.push(`Your asset mix is well-aligned with a ${riskProfile} profile. No major rebalancing needed.`);
  }

  // Overall assessment
  let overallAssessment: string;
  if (diversificationScore >= 70) {
    overallAssessment = "Well diversified";
  } else if (diversificationScore >= 40) {
    overallAssessment = "Some concentration risk";
  } else {
    overallAssessment = "Highly concentrated";
  }

  return {
    totalValue,
    regionExposure,
    sectorExposure,
    concentration,
    diversificationScore,
    leverageAssessment,
    leverageReason,
    overallAssessment,
    topHoldings,
    currentSplit,
    targetSplit,
    suggestions,
    regionComparison,
    sectorComparison,
  };
}
