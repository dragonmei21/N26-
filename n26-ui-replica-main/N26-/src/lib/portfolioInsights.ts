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

  // Leverage assessment
  const cryptoPct = holdings.filter((h) => h.assetType === "crypto").reduce((s, h) => s + h.valueEUR, 0) / totalValue;
  const equityPct = holdings.filter((h) => h.assetType === "stock").reduce((s, h) => s + h.valueEUR, 0) / totalValue;
  const safePct = holdings.filter((h) => ["bond", "commodity"].includes(h.assetType)).reduce((s, h) => s + h.valueEUR, 0) / totalValue;

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
  };
}
