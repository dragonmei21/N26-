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
  { ticker: "ETH", name: "Ethereum", valueEUR: 477.88, region: "Global", sector: "Crypto", assetType: "crypto" },
  { ticker: "BTC", name: "Bitcoin", valueEUR: 270.50, region: "Global", sector: "Crypto", assetType: "crypto" },
  { ticker: "SHIB", name: "SHIBA INU", valueEUR: 37.62, region: "Global", sector: "Crypto", assetType: "crypto" },
  { ticker: "NVDA", name: "NVIDIA", valueEUR: 160.96, region: "USA", sector: "Technology", assetType: "stock" },
  { ticker: "AAPL", name: "Apple", valueEUR: 224.00, region: "USA", sector: "Technology", assetType: "stock" },
  { ticker: "MSFT", name: "Microsoft", valueEUR: 336.95, region: "USA", sector: "Technology", assetType: "stock" },
  { ticker: "AMZN", name: "Amazon", valueEUR: 178.30, region: "USA", sector: "Consumer Discretionary", assetType: "stock" },
  { ticker: "EUNL", name: "iShares Core MSCI World", valueEUR: 113.89, region: "Global", sector: "Diversified", assetType: "etf" },
  { ticker: "VUAA", name: "Vanguard S&P 500", valueEUR: 112.66, region: "USA", sector: "Diversified", assetType: "etf" },
  { ticker: "SGLN", name: "iShares Physical Gold", valueEUR: 83.70, region: "Global", sector: "Commodities", assetType: "commodity" },
  { ticker: "SAP", name: "SAP SE", valueEUR: 95.00, region: "Europe", sector: "Technology", assetType: "stock" },
  { ticker: "ASML", name: "ASML Holding", valueEUR: 145.00, region: "Europe", sector: "Technology", assetType: "stock" },
];
