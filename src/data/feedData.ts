// Mock data matching Team A's API contract shapes
// These are used as fallback when the API is not available

export interface Visualization {
  type: "line_chart" | "comparison_bar" | "sparkline" | "donut_with_arrow" | "horizontal_bar" | "simple_number";
  title: string;
  unit?: string;
  data?: { label: string; value: number; date?: string }[];
  segments?: { label: string; value: number; color: string }[];
  stat?: { value: string; label: string; change?: string; changePositive?: boolean };
}

export interface Article {
  id: string;
  headline: string;
  summary: string;
  source: string;
  category: string;
  timestamp: string;
  relevance_score: number;
  visualization: Visualization;
}

export interface DailyTip {
  id: string;
  text: string;
  category: string;
  icon: string;
  action?: { label: string; route: string };
}

export interface TrendingTopic {
  id: string;
  label: string;
  change: string;
  is_hot: boolean;
  concept: string;
  positive?: boolean;
}

export interface FeedResponse {
  user_id: string;
  daily_tip: DailyTip;
  articles: Article[];
}

export interface TrendsResponse {
  topics: TrendingTopic[];
}

export interface SpendCategory {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  percentage: number;
  color: string;
  investments: {
    name: string;
    ticker: string;
    price: string;
    change: number;
    type: "stock" | "etf";
    match_reason: string;
  }[];
}

export interface SpendMapResponse {
  user_id: string;
  total_monthly_spend: number;
  period: string;
  categories: SpendCategory[];
  ai_insight: string;
}

export interface ELI10Response {
  concept: string;
  title: string;
  eli10: string;
  icon: string;
  related_investments: string[];
}

// ── Mock Feed Response ──────────────────────────────────────────────────────

export const mockFeedResponse: FeedResponse = {
  user_id: "mock_user_1",
  daily_tip: {
    id: "tip_001",
    text: "Your €450/mo travel spending puts you ahead of 78% of savers. Consider channelling that travel passion into BKNG or ABNB stock.",
    category: "spend_insight",
    icon: "✈️",
    action: { label: "See your Spend Map", route: "/spend-map" },
  },
  articles: [
    {
      id: "art_001",
      headline: "Gold breaks $3,000 for the first time ever",
      summary: "Gold surged past the $3,000/oz milestone as investors sought safe havens amid Fed rate uncertainty. Your gold ETC is up 2.3% today.",
      source: "Reuters",
      category: "Commodities",
      timestamp: "2h ago",
      relevance_score: 0.97,
      visualization: {
        type: "line_chart",
        title: "Gold Price (12 months)",
        unit: "$/oz",
        data: [
          { label: "Mar", value: 2050 }, { label: "Apr", value: 2120 },
          { label: "May", value: 2180 }, { label: "Jun", value: 2250 },
          { label: "Jul", value: 2310 }, { label: "Aug", value: 2280 },
          { label: "Sep", value: 2400 }, { label: "Oct", value: 2520 },
          { label: "Nov", value: 2700 }, { label: "Dec", value: 2820 },
          { label: "Jan", value: 2950 }, { label: "Feb", value: 3010 },
        ],
      },
    },
    {
      id: "art_002",
      headline: "NVIDIA earnings beat: AI boom shows no signs of stopping",
      summary: "NVIDIA reported $22.1B quarterly revenue, up 265% YoY. The AI chip giant continues to dominate data centre demand.",
      source: "Bloomberg",
      category: "Technology",
      timestamp: "4h ago",
      relevance_score: 0.91,
      visualization: {
        type: "comparison_bar",
        title: "NVIDIA Revenue (Quarterly, $B)",
        data: [
          { label: "Q1 '23", value: 7.2 },
          { label: "Q2 '23", value: 13.5 },
          { label: "Q3 '23", value: 18.1 },
          { label: "Q4 '23", value: 22.1 },
        ],
      },
    },
    {
      id: "art_003",
      headline: "Inflation eases to 2.9% in the Eurozone",
      summary: "ECB data shows inflation cooling faster than expected, raising hopes of a summer rate cut. Bonds and growth stocks reacted positively.",
      source: "ECB",
      category: "Macro",
      timestamp: "6h ago",
      relevance_score: 0.88,
      visualization: {
        type: "sparkline",
        title: "Eurozone Inflation (%)",
        data: [
          { label: "Aug", value: 5.3 }, { label: "Sep", value: 4.8 },
          { label: "Oct", value: 4.2 }, { label: "Nov", value: 3.9 },
          { label: "Dec", value: 3.4 }, { label: "Jan", value: 3.1 },
          { label: "Feb", value: 2.9 },
        ],
      },
    },
    {
      id: "art_004",
      headline: "Your travel spending beats 78% of N26 users",
      summary: "Based on your February transactions, you spent €450 on travel — making you a natural investor in travel-sector stocks.",
      source: "N26 AI",
      category: "Personal Insight",
      timestamp: "Just now",
      relevance_score: 1.0,
      visualization: {
        type: "donut_with_arrow",
        title: "Your Feb Spending",
        segments: [
          { label: "Travel", value: 450, color: "#00D4A8" },
          { label: "Food", value: 280, color: "#F59E0B" },
          { label: "Transport", value: 180, color: "#60A5FA" },
          { label: "Subscriptions", value: 145, color: "#A78BFA" },
          { label: "Shopping", value: 235, color: "#F7931A" },
        ],
      },
    },
    {
      id: "art_005",
      headline: "Bitcoin rebounds 12% after dip below $80k",
      summary: "BTC bounced back sharply as institutional buyers stepped in. Your ETH holding gained €91 this week.",
      source: "CoinDesk",
      category: "Crypto",
      timestamp: "8h ago",
      relevance_score: 0.82,
      visualization: {
        type: "simple_number",
        title: "BTC 24h Change",
        stat: { value: "+12.3%", label: "Bitcoin recovery", change: "+$9,840", changePositive: true },
      },
    },
    {
      id: "art_006",
      headline: "S&P 500 sector breakdown: who's winning in 2025?",
      summary: "Technology leads all sectors with 28% YTD gains. Energy and Utilities lag behind. Here's how each sector stacks up.",
      source: "MarketWatch",
      category: "Equities",
      timestamp: "10h ago",
      relevance_score: 0.79,
      visualization: {
        type: "horizontal_bar",
        title: "S&P 500 Sector Returns YTD",
        data: [
          { label: "Technology", value: 28.4 },
          { label: "Healthcare", value: 12.1 },
          { label: "Financials", value: 10.3 },
          { label: "Consumer", value: 8.7 },
          { label: "Energy", value: -2.1 },
          { label: "Utilities", value: -4.5 },
        ],
      },
    },
  ],
};

// ── Mock Trends Response ─────────────────────────────────────────────────────

export const mockTrendsResponse: TrendsResponse = {
  topics: [
    { id: "t1", label: "#Gold", change: "+2.3%", is_hot: true, concept: "gold", positive: true },
    { id: "t2", label: "#FedRates", change: "Breaking", is_hot: true, concept: "federal_reserve" },
    { id: "t3", label: "#NVIDIA", change: "+1.5%", is_hot: false, concept: "nvidia", positive: true },
    { id: "t4", label: "#Bitcoin", change: "+12%", is_hot: true, concept: "bitcoin", positive: true },
    { id: "t5", label: "#Inflation", change: "Cooling", is_hot: false, concept: "inflation", positive: true },
    { id: "t6", label: "#ECBRates", change: "Watch", is_hot: false, concept: "ecb" },
    { id: "t7", label: "#SP500", change: "-0.3%", is_hot: false, concept: "sp500", positive: false },
  ],
};

// ── Mock Spend Map Response ──────────────────────────────────────────────────

export const mockSpendMapResponse: SpendMapResponse = {
  user_id: "mock_user_1",
  total_monthly_spend: 1289.22,
  period: "Last 30 days",
  ai_insight:
    "Your travel-heavy lifestyle makes you a natural travel-sector investor. Every time you swipe your card at Booking.com or Uber, you're already \"investing\" in those companies. Why not own a piece of them?",
  categories: [
    {
      id: "travel",
      name: "Travel",
      emoji: "✈️",
      amount: 450.0,
      percentage: 34.9,
      color: "#00D4A8",
      investments: [
        {
          name: "Booking Holdings",
          ticker: "BKNG",
          price: "€3,824",
          change: 2.1,
          type: "stock",
          match_reason: "You book hotels monthly — invest in the platform you trust",
        },
        {
          name: "Airbnb",
          ticker: "ABNB",
          price: "€158",
          change: 1.4,
          type: "stock",
          match_reason: "Your Airbnb stays make this stock personally relevant",
        },
        {
          name: "Global Travel ETF",
          ticker: "HOLS",
          price: "€28.40",
          change: 0.9,
          type: "etf",
          match_reason: "Diversified exposure to the travel sector you love",
        },
      ],
    },
    {
      id: "shopping",
      name: "Shopping",
      emoji: "🛍️",
      amount: 235.0,
      percentage: 18.2,
      color: "#F7931A",
      investments: [
        {
          name: "Amazon",
          ticker: "AMZN",
          price: "€178",
          change: 2.8,
          type: "stock",
          match_reason: "You shop on Amazon — you could own a slice of the profits",
        },
        {
          name: "Zalando",
          ticker: "ZAL",
          price: "€30.12",
          change: -0.5,
          type: "stock",
          match_reason: "Your H&M and Zalando purchases track this stock",
        },
        {
          name: "Consumer Discretionary ETF",
          ticker: "IUCD",
          price: "€62.50",
          change: 1.1,
          type: "etf",
          match_reason: "Broad exposure to the brands you spend on",
        },
      ],
    },
    {
      id: "food",
      name: "Food & Drink",
      emoji: "🍔",
      amount: 280.0,
      percentage: 21.7,
      color: "#F59E0B",
      investments: [
        {
          name: "McDonald's",
          ticker: "MCD",
          price: "€276",
          change: 0.7,
          type: "stock",
          match_reason: "Fast food is your top sub-category — MCD pays dividends too",
        },
        {
          name: "Nestlé",
          ticker: "NESN",
          price: "€98.20",
          change: -0.2,
          type: "stock",
          match_reason: "You buy Nestlé products — invest in the brand",
        },
        {
          name: "Food & Beverage ETF",
          ticker: "FOOD",
          price: "€44.80",
          change: 0.4,
          type: "etf",
          match_reason: "Diversified food sector exposure matching your spend",
        },
      ],
    },
    {
      id: "transport",
      name: "Transport",
      emoji: "🚌",
      amount: 180.0,
      percentage: 14.0,
      color: "#60A5FA",
      investments: [
        {
          name: "Uber Technologies",
          ticker: "UBER",
          price: "€78.50",
          change: 3.2,
          type: "stock",
          match_reason: "Your Uber rides directly support this stock's revenue",
        },
        {
          name: "Shell",
          ticker: "SHEL",
          price: "€32.10",
          change: -0.8,
          type: "stock",
          match_reason: "Transport energy costs link to oil majors like Shell",
        },
        {
          name: "iShares Transport ETF",
          ticker: "TRAN",
          price: "€55.30",
          change: 1.0,
          type: "etf",
          match_reason: "Broad transport sector exposure from rail to rideshare",
        },
      ],
    },
    {
      id: "subscriptions",
      name: "Subscriptions",
      emoji: "📱",
      amount: 145.0,
      percentage: 11.2,
      color: "#A78BFA",
      investments: [
        {
          name: "Spotify",
          ticker: "SPOT",
          price: "€364",
          change: 4.5,
          type: "stock",
          match_reason: "You pay €9.99/mo to Spotify — own the company instead",
        },
        {
          name: "Netflix",
          ticker: "NFLX",
          price: "€712",
          change: 1.2,
          type: "stock",
          match_reason: "Your Netflix subscription is their recurring revenue",
        },
        {
          name: "Apple",
          ticker: "AAPL",
          price: "€224",
          change: 1.1,
          type: "stock",
          match_reason: "Apple subscriptions you use: iCloud, Apple TV+, App Store",
        },
      ],
    },
  ],
};

// ── Mock ELI10 Responses ─────────────────────────────────────────────────────

export const mockELI10Responses: Record<string, ELI10Response> = {
  inflation: {
    concept: "inflation",
    title: "What is Inflation?",
    icon: "🍪",
    eli10:
      "Imagine a cookie costs €1 today. Inflation means next year that same cookie might cost €1.05. Prices go up slowly over time — like how your pocket money doesn't buy as many sweets as it used to. This happens because more money is chasing the same number of cookies!",
    related_investments: ["Gold ETF (SGLN)", "Real Estate REIT", "TIPS Bonds"],
  },
  gold: {
    concept: "gold",
    title: "Why does Gold go up?",
    icon: "🥇",
    eli10:
      "Gold is like a security blanket for grown-ups. When people get scared about money or the economy, they buy gold because it's been valuable for thousands of years. The more scared people are, the more they buy, and the price goes up. It's like a popularity contest — gold always wins when times are tough!",
    related_investments: ["Physical Gold ETC (SGLN)", "Gold Miners ETF", "WisdomTree Gold"],
  },
  federal_reserve: {
    concept: "federal_reserve",
    title: "What is the Federal Reserve?",
    icon: "🏦",
    eli10:
      "The Federal Reserve (called 'the Fed') is like the boss of all American banks. They decide how expensive it is to borrow money — called 'interest rates'. If rates go up, borrowing costs more, so people spend less and prices stop rising. If rates go down, borrowing is cheaper, businesses grow faster, and stocks usually go up!",
    related_investments: ["S&P 500 ETF (VUAA)", "US Treasuries", "Financial Sector ETF"],
  },
  nvidia: {
    concept: "nvidia",
    title: "Why is NVIDIA everywhere?",
    icon: "🎮",
    eli10:
      "NVIDIA makes the special chips that power AI — like the brains that help ChatGPT think. Everyone building AI needs NVIDIA chips, and there aren't enough to go around. It's like being the only kid with a pencil during a maths test. That's why the company is worth so much money right now!",
    related_investments: ["NVIDIA (NVDA)", "Technology ETF (QDVE)", "AI & Robotics ETF"],
  },
  bitcoin: {
    concept: "bitcoin",
    title: "What is Bitcoin?",
    icon: "₿",
    eli10:
      "Bitcoin is like digital gold — except nobody printed it, no government controls it, and there will only ever be 21 million of them. People send it around the world like emails but with real money. Some people think it's the future of money; others think it's just a very popular collectible. Either way, it goes up and down A LOT!",
    related_investments: ["Bitcoin ETC", "Crypto Basket ETF", "Coinbase (COIN)"],
  },
  ecb: {
    concept: "ecb",
    title: "What is the ECB?",
    icon: "🇪🇺",
    eli10:
      "The European Central Bank is the Fed but for Europe. They set interest rates for all 20 countries that use the Euro. When they lower rates, it gets cheaper to borrow money, businesses invest more, and markets usually go up. They're currently deciding whether to cut rates — which would be great news for your investments!",
    related_investments: ["Euro Bonds ETF", "European Stocks ETF", "iShares Core MSCI Europe"],
  },
  sp500: {
    concept: "sp500",
    title: "What is the S&P 500?",
    icon: "📊",
    eli10:
      "The S&P 500 is a list of the 500 biggest companies in America — like Apple, Amazon, and Microsoft. When people say 'the market went up', they usually mean the S&P 500. Buying an S&P 500 ETF is like buying a tiny slice of all 500 companies at once. Historically, it goes up about 10% a year on average!",
    related_investments: ["Vanguard S&P 500 (VUAA)", "iShares S&P 500 (SXR8)", "S&P 500 Tech Sector (QDVE)"],
  },
};
