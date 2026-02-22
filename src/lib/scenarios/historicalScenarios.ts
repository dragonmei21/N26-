export interface HistoricalScenario {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  sliderPreset: {
    inflation: number;
    interest_rate: number;
    gold: number;
    oil: number;
    usd: number;
    sp500: number;
  };
  /** Per-ticker override percentage changes (overrides slider-computed values) */
  impactOverrides: Record<string, number>;
}

export const historicalScenarios: HistoricalScenario[] = [
  {
    id: "covid-crash",
    title: "COVID-19 crash",
    startDate: "Feb 2020",
    endDate: "Mar 2020",
    description: "Global pandemic triggered a rapid 34% market sell-off in just 23 trading days.",
    severity: "High",
    sliderPreset: {
      inflation: 0.5,
      interest_rate: 0.25,
      gold: -5,
      oil: -40,
      usd: 5,
      sp500: -30,
    },
    impactOverrides: { ETH: -42, BTC: -38, SHIB: -55, AAPL: -31, NVDA: -46 },
  },
  {
    id: "dotcom-burst",
    title: "Dot-com bubble burst",
    startDate: "Mar 2000",
    endDate: "Oct 2002",
    description: "The tech-heavy Nasdaq lost 78% as the internet bubble deflated over two years.",
    severity: "High",
    sliderPreset: {
      inflation: 3.4,
      interest_rate: 6.5,
      gold: 5,
      oil: -10,
      usd: 8,
      sp500: -25,
    },
    impactOverrides: { ETH: -60, BTC: -35, SHIB: -70, AAPL: -81, NVDA: -83 },
  },
  {
    id: "gfc-2008",
    title: "Global Financial Crisis",
    startDate: "Sep 2008",
    endDate: "Mar 2009",
    description: "The collapse of Lehman Brothers triggered a global banking crisis and 57% market drawdown.",
    severity: "High",
    sliderPreset: {
      inflation: -0.5,
      interest_rate: 0.5,
      gold: 15,
      oil: -35,
      usd: 10,
      sp500: -28,
    },
    impactOverrides: { ETH: -50, BTC: -45, SHIB: -65, AAPL: -52, NVDA: -76 },
  },
  {
    id: "inflation-hikes-2022",
    title: "Inflation spike + rate hikes",
    startDate: "Jan 2022",
    endDate: "Dec 2022",
    description: "Central banks aggressively raised rates to combat 9%+ inflation, crushing growth assets.",
    severity: "Medium",
    sliderPreset: {
      inflation: 9,
      interest_rate: 5,
      gold: -3,
      oil: 25,
      usd: 12,
      sp500: -20,
    },
    impactOverrides: { ETH: -67, BTC: -64, SHIB: -75, AAPL: -26, NVDA: -50 },
  },
  {
    id: "oil-shock-2022",
    title: "2022 Energy crisis",
    startDate: "Feb 2022",
    endDate: "Sep 2022",
    description: "Russia-Ukraine conflict caused oil & gas prices to spike, driving a European energy crisis.",
    severity: "Medium",
    sliderPreset: {
      inflation: 7,
      interest_rate: 3,
      gold: 8,
      oil: 40,
      usd: 10,
      sp500: -15,
    },
    impactOverrides: { ETH: -30, BTC: -25, SHIB: -40, AAPL: -12, NVDA: -35 },
  },
  {
    id: "crypto-winter-2022",
    title: "Crypto winter",
    startDate: "May 2022",
    endDate: "Dec 2022",
    description: "Terra/Luna collapse and FTX fraud triggered a massive crypto sell-off. BTC fell below $16K.",
    severity: "High",
    sliderPreset: {
      inflation: 6,
      interest_rate: 4,
      gold: 2,
      oil: 5,
      usd: 8,
      sp500: -10,
    },
    impactOverrides: { ETH: -72, BTC: -65, SHIB: -85, AAPL: -4, NVDA: -15 },
  },
];
