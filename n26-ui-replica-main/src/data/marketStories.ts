export interface StorySlide {
  id: string;
  headline: string;
  body: string;
  emoji: string;
  bgGradient: string;
  source: string;
}

export interface MarketStory {
  id: string;
  label: string;
  emoji: string;
  ringColor: string;
  slides: StorySlide[];
}

export const marketStories: MarketStory[] = [
  {
    id: "gold",
    label: "Gold",
    emoji: "🥇",
    ringColor: "from-yellow-400 to-amber-600",
    slides: [
      {
        id: "gold-1",
        headline: "Gold hits new all-time high",
        body: "Spot gold surged past $2,950/oz as investors seek safe-haven assets amid geopolitical uncertainty and persistent inflation concerns.",
        emoji: "📈",
        bgGradient: "from-yellow-900/80 to-amber-950/90",
        source: "Reuters",
      },
      {
        id: "gold-2",
        headline: "Central banks keep buying",
        body: "Global central banks added 1,037 tonnes of gold reserves in 2025, the third consecutive year of record purchases.",
        emoji: "🏦",
        bgGradient: "from-yellow-800/80 to-yellow-950/90",
        source: "World Gold Council",
      },
    ],
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    emoji: "💚",
    ringColor: "from-green-400 to-emerald-600",
    slides: [
      {
        id: "nvda-1",
        headline: "NVDA reports blowout Q4",
        body: "Revenue jumped 78% YoY to $39.3B, driven by insatiable demand for AI chips. Data-center segment alone hit $32.6B.",
        emoji: "🚀",
        bgGradient: "from-green-900/80 to-emerald-950/90",
        source: "NVIDIA IR",
      },
      {
        id: "nvda-2",
        headline: "Blackwell ramp in full swing",
        body: "CEO Jensen Huang confirmed that Blackwell GPU production is scaling faster than any previous generation, with $11B in backlog.",
        emoji: "⚡",
        bgGradient: "from-emerald-900/80 to-green-950/90",
        source: "Bloomberg",
      },
      {
        id: "nvda-3",
        headline: "Analyst upgrades pile in",
        body: "12 Wall Street analysts raised price targets this week, with the Street-high now at $220. Average target sits at $195.",
        emoji: "🎯",
        bgGradient: "from-green-800/80 to-teal-950/90",
        source: "MarketWatch",
      },
    ],
  },
  {
    id: "inflation",
    label: "Inflation",
    emoji: "📊",
    ringColor: "from-red-400 to-rose-600",
    slides: [
      {
        id: "inf-1",
        headline: "EU inflation ticks down to 2.4%",
        body: "Eurozone headline CPI fell to 2.4% in January, edging closer to the ECB's 2% target. Core inflation remains sticky at 2.7%.",
        emoji: "🇪🇺",
        bgGradient: "from-red-900/80 to-rose-950/90",
        source: "Eurostat",
      },
      {
        id: "inf-2",
        headline: "US CPI surprises to the upside",
        body: "January CPI came in at 3.0% YoY vs 2.9% expected, dampening hopes of early Fed rate cuts.",
        emoji: "🇺🇸",
        bgGradient: "from-rose-900/80 to-red-950/90",
        source: "BLS",
      },
    ],
  },
  {
    id: "rates",
    label: "Rates",
    emoji: "🏛️",
    ringColor: "from-blue-400 to-indigo-600",
    slides: [
      {
        id: "rates-1",
        headline: "ECB holds rates steady at 2.75%",
        body: "The European Central Bank kept its main refinancing rate unchanged, signalling patience before the next cut expected in April.",
        emoji: "⏸️",
        bgGradient: "from-blue-900/80 to-indigo-950/90",
        source: "ECB",
      },
      {
        id: "rates-2",
        headline: "Fed signals two cuts for 2025",
        body: "The latest dot plot shows FOMC members projecting two 25bp cuts this year, down from four projected in September.",
        emoji: "✂️",
        bgGradient: "from-indigo-900/80 to-blue-950/90",
        source: "Federal Reserve",
      },
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    emoji: "₿",
    ringColor: "from-orange-400 to-amber-600",
    slides: [
      {
        id: "btc-1",
        headline: "Bitcoin tops $98,000",
        body: "BTC surged past $98K after ETF inflows hit $1.2B in a single day. Market cap now exceeds $1.9 trillion.",
        emoji: "🔥",
        bgGradient: "from-orange-900/80 to-amber-950/90",
        source: "CoinDesk",
      },
      {
        id: "btc-2",
        headline: "Ethereum staking hits record",
        body: "Over 34 million ETH are now staked across the network, representing 28% of total supply.",
        emoji: "💎",
        bgGradient: "from-amber-900/80 to-orange-950/90",
        source: "Etherscan",
      },
    ],
  },
  {
    id: "oil",
    label: "Oil",
    emoji: "🛢️",
    ringColor: "from-stone-400 to-stone-600",
    slides: [
      {
        id: "oil-1",
        headline: "Brent crude dips below $75",
        body: "Oil prices fell as OPEC+ hinted at easing production cuts in Q2. Brent settled at $74.60, down 2.1% on the week.",
        emoji: "📉",
        bgGradient: "from-stone-800/80 to-stone-950/90",
        source: "Reuters",
      },
    ],
  },
  {
    id: "tech",
    label: "Tech",
    emoji: "💻",
    ringColor: "from-violet-400 to-purple-600",
    slides: [
      {
        id: "tech-1",
        headline: "Big Tech earnings beat estimates",
        body: "Microsoft, Apple, and Meta all reported Q4 earnings above consensus. The Nasdaq rallied 2.3% on the back of results.",
        emoji: "📱",
        bgGradient: "from-violet-900/80 to-purple-950/90",
        source: "CNBC",
      },
      {
        id: "tech-2",
        headline: "AI spending reaches $200B",
        body: "Combined capital expenditure on AI infrastructure by the Magnificent 7 is projected to hit $200B in 2025.",
        emoji: "🤖",
        bgGradient: "from-purple-900/80 to-violet-950/90",
        source: "Goldman Sachs",
      },
    ],
  },
];
