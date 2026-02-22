export type StoryCategory =
  | "Commodities"
  | "Equities"
  | "Macro"
  | "Rates"
  | "Crypto"
  | "Energy"
  | "Technology";

export interface StorySlide {
  id: string;
  headline: string;
  body: string;
  /** One-sentence "why it matters" shown below the body */
  context: string;
  bgClass: string;   // Tailwind gradient classes for the slide background
  source: string;
  sourceDomain: string;
  category: StoryCategory;
}

export interface MarketStory {
  id: string;
  label: string;
  ringColor: string;
  slides: StorySlide[];
}

export const marketStories: MarketStory[] = [
  {
    id: "gold",
    label: "Gold",
    ringColor: "from-yellow-400 to-amber-600",
    slides: [
      {
        id: "gold-1",
        headline: "Gold hits new all-time high",
        body: "Spot gold surged past $2,950/oz as investors rotated into safe-haven assets amid geopolitical uncertainty and persistent above-target inflation across G7 economies.",
        context: "Safe-haven demand tends to compress equity risk premiums — watch defensive sectors.",
        bgClass: "from-[#1a1200] via-[#2a1f00] to-[#0f0b00]",
        source: "Reuters",
        sourceDomain: "reuters.com",
        category: "Commodities",
      },
      {
        id: "gold-2",
        headline: "Central banks record third straight year of gold accumulation",
        body: "Global central banks added 1,037 tonnes to reserves in 2025, led by China, Poland, and Turkey. The trend reflects a structural shift away from USD-denominated assets.",
        context: "Long-term reserve diversification supports a structural floor under gold prices.",
        bgClass: "from-[#1c1400] via-[#2e2200] to-[#0f0c00]",
        source: "World Gold Council",
        sourceDomain: "gold.org",
        category: "Commodities",
      },
    ],
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    ringColor: "from-green-400 to-emerald-600",
    slides: [
      {
        id: "nvda-1",
        headline: "NVIDIA Q4 revenue surges 78% to $39.3B",
        body: "Data-center segment alone contributed $32.6B, driven by AI training cluster orders from hyperscalers. EPS of $0.89 beat consensus by 12%.",
        context: "NVIDIA's results set the tone for the entire AI infrastructure spending cycle.",
        bgClass: "from-[#001a0a] via-[#00200d] to-[#000f05]",
        source: "NVIDIA Investor Relations",
        sourceDomain: "nvidia.com",
        category: "Equities",
      },
      {
        id: "nvda-2",
        headline: "Blackwell GPU production ramping faster than prior generations",
        body: "CEO Jensen Huang confirmed $11B in unfulfilled Blackwell backlog, with supply constraints expected to ease by mid-2025. New NVLink interconnect doubles cluster throughput.",
        context: "Supply normalisation could shift pricing power back toward hyperscalers by H2 2025.",
        bgClass: "from-[#00180a] via-[#001f0c] to-[#000d04]",
        source: "Bloomberg",
        sourceDomain: "bloomberg.com",
        category: "Technology",
      },
      {
        id: "nvda-3",
        headline: "12 analyst upgrades in a single week",
        body: "Wall Street's street-high price target moved to $220, with the consensus average at $195. Three analysts initiated coverage with Overweight ratings following earnings.",
        context: "Broad analyst consensus upgrades typically precede institutional re-rating cycles.",
        bgClass: "from-[#00160a] via-[#001c0e] to-[#000c04]",
        source: "MarketWatch",
        sourceDomain: "marketwatch.com",
        category: "Equities",
      },
    ],
  },
  {
    id: "inflation",
    label: "Inflation",
    ringColor: "from-red-400 to-rose-600",
    slides: [
      {
        id: "inf-1",
        headline: "Eurozone CPI falls to 2.4%, approaching ECB target",
        body: "Headline inflation in the Eurozone eased to 2.4% in January, down from 2.9% in December. Core inflation, stripping out energy and food, remained sticky at 2.7%.",
        context: "Progress on core inflation will determine the pace of ECB easing in 2025.",
        bgClass: "from-[#1a0005] via-[#200008] to-[#0d0003]",
        source: "Eurostat",
        sourceDomain: "ec.europa.eu",
        category: "Macro",
      },
      {
        id: "inf-2",
        headline: "US CPI surprises to the upside at 3.0% YoY",
        body: "January US CPI printed at 3.0%, above the 2.9% consensus estimate. Services inflation, particularly shelter costs, accounted for the bulk of the upside miss.",
        context: "A hotter-than-expected CPI reduces the probability of early Fed rate cuts.",
        bgClass: "from-[#180004] via-[#1e0006] to-[#0c0002]",
        source: "U.S. Bureau of Labor Statistics",
        sourceDomain: "bls.gov",
        category: "Macro",
      },
    ],
  },
  {
    id: "rates",
    label: "Rates",
    ringColor: "from-blue-400 to-indigo-600",
    slides: [
      {
        id: "rates-1",
        headline: "ECB holds at 2.75% — April cut signalled",
        body: "The European Central Bank kept its main refinancing rate at 2.75% in its February meeting. President Lagarde indicated a data-dependent path toward an April reduction.",
        context: "A confirmed April cut would mark the third consecutive ECB easing move.",
        bgClass: "from-[#00051a] via-[#000820] to-[#00030d]",
        source: "European Central Bank",
        sourceDomain: "ecb.europa.eu",
        category: "Rates",
      },
      {
        id: "rates-2",
        headline: "Fed dot plot projects two 25bp cuts in 2025",
        body: "The latest FOMC summary of economic projections shows the median member expects 50bp of total easing in 2025, down from 100bp projected in September 2024.",
        context: "Fewer expected cuts means higher-for-longer rates, pressuring long-duration assets.",
        bgClass: "from-[#00041a] via-[#00061e] to-[#00020c]",
        source: "Federal Reserve",
        sourceDomain: "federalreserve.gov",
        category: "Rates",
      },
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    ringColor: "from-orange-400 to-amber-600",
    slides: [
      {
        id: "btc-1",
        headline: "Bitcoin approaches $98,000 on ETF inflow surge",
        body: "Spot BTC ETF products recorded $1.2B in net inflows in a single session — the largest single-day figure since launch. Total BTC ETF AUM now exceeds $55B.",
        context: "Sustained institutional inflows structurally reduce available liquid supply on exchanges.",
        bgClass: "from-[#1a0800] via-[#200f00] to-[#0d0400]",
        source: "CoinDesk",
        sourceDomain: "coindesk.com",
        category: "Crypto",
      },
      {
        id: "btc-2",
        headline: "Ethereum staking reaches 34M ETH — 28% of total supply",
        body: "The Ethereum network now has 34 million ETH locked in staking contracts, reinforcing long-term supply constraints. Daily active validators surpassed 1.1 million for the first time.",
        context: "Higher staking rates reduce circulating supply, a structurally bullish dynamic for ETH.",
        bgClass: "from-[#180900] via-[#1e0f00] to-[#0c0400]",
        source: "Etherscan",
        sourceDomain: "etherscan.io",
        category: "Crypto",
      },
    ],
  },
  {
    id: "oil",
    label: "Oil",
    ringColor: "from-stone-400 to-stone-600",
    slides: [
      {
        id: "oil-1",
        headline: "Brent crude falls below $75 on OPEC+ supply signals",
        body: "Oil prices retreated 2.1% on the week after OPEC+ sources indicated a potential easing of production quotas in Q2 2025. Brent settled at $74.60/bbl, a three-month low.",
        context: "Lower energy costs reduce input inflation, giving central banks more room to cut.",
        bgClass: "from-[#0f0c08] via-[#141008] to-[#080604]",
        source: "Reuters",
        sourceDomain: "reuters.com",
        category: "Energy",
      },
    ],
  },
  {
    id: "tech",
    label: "Tech",
    ringColor: "from-violet-400 to-purple-600",
    slides: [
      {
        id: "tech-1",
        headline: "Microsoft, Apple, and Meta all beat Q4 estimates",
        body: "The Magnificent 7 earnings season delivered a clean sweep of consensus beats. Nasdaq rallied 2.3% on results day, led by Meta's 15% post-earnings surge on AI-driven ad revenue.",
        context: "Strong earnings validate elevated multiples and reinforce the AI capex super-cycle thesis.",
        bgClass: "from-[#0a0018] via-[#0e001e] to-[#05000d]",
        source: "CNBC",
        sourceDomain: "cnbc.com",
        category: "Technology",
      },
      {
        id: "tech-2",
        headline: "Magnificent 7 AI capex to reach $200B in 2025",
        body: "Combined capital expenditure on AI infrastructure by the seven largest US tech companies is projected at $200B this year — up from $125B in 2024 — primarily directed at GPU clusters and data centres.",
        context: "At this scale, AI capex is the single largest driver of global semiconductor demand.",
        bgClass: "from-[#090016] via-[#0c001a] to-[#04000b]",
        source: "Goldman Sachs Research",
        sourceDomain: "goldmansachs.com",
        category: "Technology",
      },
    ],
  },
];
