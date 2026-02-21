import type { MarketStory } from "./marketStories";

export const portfolioStories: MarketStory[] = [
  {
    id: "eth-portfolio",
    label: "Ethereum",
    emoji: "💎",
    ringColor: "from-blue-400 to-indigo-600",
    slides: [
      {
        id: "eth-p1",
        headline: "Your ETH is up 23.5%",
        body: "Ethereum rallied strongly this month, driven by record staking activity and growing DeFi adoption. Your position gained €91.09.",
        emoji: "📈",
        bgGradient: "from-blue-900/80 to-indigo-950/90",
        source: "Portfolio Analysis",
      },
      {
        id: "eth-p2",
        headline: "Ethereum 2.0 momentum",
        body: "Over 34M ETH are now staked. The network processed 1.2M transactions daily, reinforcing Ethereum's position as the leading smart contract platform.",
        emoji: "⚡",
        bgGradient: "from-indigo-900/80 to-blue-950/90",
        source: "Etherscan",
      },
    ],
  },
  {
    id: "btc-portfolio",
    label: "Bitcoin",
    emoji: "₿",
    ringColor: "from-orange-400 to-amber-600",
    slides: [
      {
        id: "btc-p1",
        headline: "BTC dipped slightly",
        body: "Bitcoin pulled back 2.99% in your portfolio. The broader market saw profit-taking after BTC briefly touched $98K earlier this week.",
        emoji: "📉",
        bgGradient: "from-orange-900/80 to-amber-950/90",
        source: "Portfolio Analysis",
      },
      {
        id: "btc-p2",
        headline: "Institutional demand stays strong",
        body: "ETF inflows remain elevated at $800M/week. Long-term holders continue accumulating, suggesting the dip may be temporary.",
        emoji: "🏦",
        bgGradient: "from-amber-900/80 to-orange-950/90",
        source: "CoinDesk",
      },
    ],
  },
  {
    id: "shib-portfolio",
    label: "SHIBA INU",
    emoji: "🐕",
    ringColor: "from-yellow-400 to-orange-500",
    slides: [
      {
        id: "shib-p1",
        headline: "SHIB up 5.12%",
        body: "SHIBA INU gained momentum this week with increased burn rate and growing Shibarium L2 adoption. Your position gained €1.83.",
        emoji: "🔥",
        bgGradient: "from-yellow-900/80 to-orange-950/90",
        source: "Portfolio Analysis",
      },
      {
        id: "shib-p2",
        headline: "Shibarium hits 400M transactions",
        body: "The SHIB Layer 2 network crossed 400 million transactions, reducing gas fees and boosting ecosystem utility.",
        emoji: "🚀",
        bgGradient: "from-orange-900/80 to-yellow-950/90",
        source: "Shibarium Explorer",
      },
    ],
  },
];
