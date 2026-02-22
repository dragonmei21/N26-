export interface PortfolioHolding {
  ticker: string;
  name: string;
  valueEUR: number;
  region: string;
  sector: string;
  assetType: "crypto" | "stock" | "etf" | "bond" | "commodity";
  leverageFactor?: number;
}

export const portfolioHoldings: PortfolioHolding[] = [
  { ticker: "ETH", name: "Ethereum", valueEUR: 1678.89, region: "Global", sector: "Crypto", assetType: "crypto" },
  { ticker: "BTC", name: "Bitcoin", valueEUR: 57828.12, region: "Global", sector: "Crypto", assetType: "crypto" },
  { ticker: "SHIB", name: "SHIBA INU", valueEUR: 0.0000054, region: "Global", sector: "Crypto", assetType: "crypto" },
  { ticker: "NVDA", name: "NVIDIA", valueEUR: 161.04, region: "USA", sector: "Technology", assetType: "stock" },
  { ticker: "AAPL", name: "Apple", valueEUR: 224.50, region: "USA", sector: "Technology", assetType: "stock" },
  { ticker: "MSFT", name: "Microsoft", valueEUR: 337.01, region: "USA", sector: "Technology", assetType: "stock" },
  { ticker: "AMZN", name: "Amazon", valueEUR: 178.28, region: "USA", sector: "Consumer Discretionary", assetType: "stock" },
  { ticker: "META", name: "Meta Platforms", valueEUR: 556.30, region: "USA", sector: "Technology", assetType: "stock" },
  { ticker: "TSLA", name: "Tesla", valueEUR: 349.39, region: "USA", sector: "Consumer Discretionary", assetType: "stock" },
  { ticker: "NFLX", name: "Netflix", valueEUR: 66.75, region: "USA", sector: "Communication Services", assetType: "stock" },
  { ticker: "EUNL", name: "iShares Core MSCI World", valueEUR: 113.76, region: "Global", sector: "Diversified", assetType: "etf" },
  { ticker: "VUAA", name: "Vanguard S&P 500", valueEUR: 112.51, region: "USA", sector: "Diversified", assetType: "etf" },
  { ticker: "SGLN", name: "iShares Physical Gold", valueEUR: 83.70, region: "Global", sector: "Commodities", assetType: "commodity" },
  { ticker: "SAP", name: "SAP SE", valueEUR: 173.80, region: "Europe", sector: "Technology", assetType: "stock" },
  { ticker: "ASML", name: "ASML Holding", valueEUR: 1255.60, region: "Europe", sector: "Technology", assetType: "stock" },
];
