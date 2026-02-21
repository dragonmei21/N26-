export type AssetClass = "crypto" | "stock" | "etf" | "commodity" | "bond";
export type RiskLabel = "Low" | "Medium" | "High";
export type ReturnPeriod = "1D" | "1W" | "1M" | "1Y" | "ALL";

export interface Holding {
  ticker: string;
  name: string;
  weight: number;        // 0–1, sum of all weights in a portfolio = 1
  assetClass?: AssetClass;
}

export interface Returns {
  "1D": number;
  "1W": number;
  "1M": number;
  "1Y": number;
  "ALL": number;
}

export interface PoolPortfolio {
  id: string;
  name: string;
  creator: string;       // display handle, e.g. "@luna_trades"
  holdings: Holding[];   // top holdings (up to 10)
  returns: Returns;
  riskLabel: RiskLabel;
  copyCount: number;
  createdAt: string;     // ISO date string
  description?: string;
}

export interface CopiedPortfolio {
  userId: string;
  poolPortfolioId: string;
  copiedAt: string;
}

/** Enriched with computed ranking score */
export interface RankedPoolPortfolio extends PoolPortfolio {
  relevanceScore: number;
  finalScore: number;
}
