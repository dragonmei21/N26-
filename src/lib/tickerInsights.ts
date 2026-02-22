export interface TickerInsightData {
  shortSummary: string;
  drivers: string[];
  sources: { name: string; domain?: string }[];
}

const timeframePhrases: Record<string, string> = {
  "24h": "today",
  "1W": "this week",
  "1M": "this month",
  "1Y": "this year",
};

const insightMap: Record<string, (timeframe: string) => TickerInsightData> = {
  ETH: (tf) => ({
    shortSummary: `Up ${tf} after record staking activity and growing DeFi adoption on the network.`,
    drivers: [
      "Record staking: over 34M ETH now locked, reducing circulating supply",
      "Network processed 1.2M daily transactions — reinforcing Ethereum as the leading smart contract platform",
      "Rising DeFi total value locked (TVL) driving organic demand for ETH gas fees",
    ],
    sources: [
      { name: "Portfolio Analysis" },
      { name: "Etherscan", domain: "etherscan.io" },
    ],
  }),
  BTC: (tf) => ({
    shortSummary: `Down slightly ${tf} on profit-taking after BTC briefly touched $98K; institutional demand remains steady.`,
    drivers: [
      "Short-term profit-taking after BTC hit $98K — historically normal pullback behaviour",
      "ETF inflows holding at ~$800M/week, signalling sustained institutional accumulation",
      "Long-term holders (LTH) net buyers during the dip, a historically bullish signal",
    ],
    sources: [
      { name: "Portfolio Analysis" },
      { name: "CoinDesk", domain: "coindesk.com" },
    ],
  }),
  SHIB: (tf) => ({
    shortSummary: `Up ${tf} driven by an accelerating SHIB burn rate and Shibarium L2 hitting 400M transactions.`,
    drivers: [
      "Increased burn rate shrinking total SHIB supply — deflationary pressure on price",
      "Shibarium Layer 2 crossed 400M transactions, reducing fees and boosting ecosystem utility",
      "Growing developer activity on the SHIB ecosystem expanding use cases",
    ],
    sources: [
      { name: "Portfolio Analysis" },
      { name: "Shibarium Explorer", domain: "shibarium.io" },
    ],
  }),
  AAPL: (tf) => ({
    shortSummary: `Up ${tf} following strong iPhone upgrade cycle data and continued Services revenue growth.`,
    drivers: [
      "Services segment hits new all-time high, widening gross margins and boosting recurring revenue",
      "Robust demand for the newest AI-powered iPhone models in key international markets",
      "Continued stock buyback programs reaffirming strong capital return strategy to shareholders",
    ],
    sources: [
      { name: "Portfolio Analysis" },
      { name: "Yahoo Finance", domain: "finance.yahoo.com" },
    ],
  }),
  NVDA: (tf) => ({
    shortSummary: `Up ${tf} as next-gen Blackwell GPU shipments accelerate amidst surging hyperscaler AI demand.`,
    drivers: [
      "Unprecedented demand from major cloud providers expanding their AI infrastructure",
      "Data Center revenue beats expectations again, cementing market dominance in AI compute",
      "New enterprise partnerships driving sovereign AI investments globally",
    ],
    sources: [
      { name: "Portfolio Analysis" },
      { name: "Bloomberg", domain: "bloomberg.com" },
    ],
  }),
};

const fallback: TickerInsightData = {
  shortSummary: "No clear catalyst found; likely a broader market or sector move.",
  drivers: [],
  sources: [],
};

// Simple module-level cache keyed by `{ticker}-{timeRange}`
const cache = new Map<string, TickerInsightData>();

export function getTickerInsight(ticker: string, timeRange: string): TickerInsightData {
  const key = `${ticker}-${timeRange}`;
  if (cache.has(key)) return cache.get(key)!;

  const tf = timeframePhrases[timeRange] ?? "recently";
  const factory = insightMap[ticker];
  const data = factory ? factory(tf) : fallback;

  cache.set(key, data);
  return data;
}
