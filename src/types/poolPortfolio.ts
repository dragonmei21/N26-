/** Weight-only holding used inside pool portfolios */
export interface Holding {
  ticker: string;
  name: string;
  weight: number;       // 0–1, should sum to 1 across a portfolio
  assetClass?: "crypto" | "stock" | "etf" | "bond" | "commodity";
}

export interface Returns {
  "1D": number;
  "1W": number;
  "1M": number;
  "1Y": number;
  ALL: number;
}

export type RiskLabel = "Low" | "Medium" | "High";

export interface PoolPortfolio {
  id: string;
  name: string;
  creator: string;        // handle or anonymised ID
  holdings: Holding[];
  returns: Returns;
  riskLabel: RiskLabel;
  copyCount: number;
  createdAt: string;      // ISO date string
}

export interface CopiedPortfolio {
  userId: string;
  poolPortfolioId: string;
  copiedAt: string;       // ISO date string
}

/** Per-holding result of a static copy allocation */
export interface AllocationLine {
  ticker: string;
  name: string;
  weight: number;         // 0–1
  amountEUR: number;      // weight * investmentAmount, rounded to 2 dp
}

/** A static (one-time) copy allocation record */
export interface CopyAllocation {
  poolPortfolioId: string;
  investmentAmountEUR: number;
  lines: AllocationLine[];
  createdAt: string;      // ISO date string
}

/** Enriched with computed ranking scores */
export interface RankedPoolPortfolio extends PoolPortfolio {
  relevanceScore: number; // 0–1 similarity to user's portfolio
  finalScore: number;     // weighted combo of relevance + popularity
}
