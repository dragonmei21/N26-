import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import type { PortfolioHolding } from "@/data/portfolioHoldings";

const API_BASE = "http://localhost:8000";

// Static mock explanations — used instantly, no backend needed
const MOCK_EXPLANATIONS: Record<string, { short: string; why: string; outlook: string }> = {
  ETH: {
    short: "Up 23.5% — DeFi & staking boom",
    why: "Ethereum rallied on record-breaking staking activity (over 34M ETH locked) and a surge in DeFi protocol usage. Layer-2 networks like Arbitrum and Optimism are now processing more transactions than ever, reducing fees and attracting developers.",
    outlook: "Analysts eye the next EIP upgrade which could further reduce ETH issuance. Short-term resistance at $3,800; key support at $3,200.",
  },
  BTC: {
    short: "Down 2.99% — profit-taking after $98K",
    why: "Bitcoin briefly touched $98,000 before institutional traders locked in profits. Long-term holders remain unfazed — on-chain data shows accumulation continues. Spot ETF inflows stayed strong at $800M/week despite the dip.",
    outlook: "A reclaim of $97,000 on volume would signal renewed bullish momentum. Watch for Fed commentary — rate expectations are the primary macro driver right now.",
  },
  SHIB: {
    short: "Up 5.12% — Shibarium milestone",
    why: "SHIBA INU benefited from the Shibarium L2 network crossing 400M total transactions. The increased utility is driving SHIB burns, reducing supply. Community sentiment is elevated heading into a planned Shibarium upgrade.",
    outlook: "High-volatility meme asset. Key catalyst to watch: next quarterly burn event. Speculative position — size accordingly.",
  },
  NVDA: {
    short: "Up 1.45% — AI demand accelerating",
    why: "NVIDIA's Q4 earnings smashed estimates. Data center revenue hit $18.4B, up 93% YoY driven by H100 and B200 GPU demand from hyperscalers. Analysts raised price targets across the board.",
    outlook: "Blackwell architecture ramp remains the bull case. Risk: competition from AMD MI300X and in-house chips from Google/Amazon.",
  },
  AAPL: {
    short: "Up 1.11% — Services segment shines",
    why: "Apple Services (App Store, Apple TV+, iCloud) grew 11% YoY to $23.1B, offsetting a modest decline in iPhone units in China. Buyback programme continues to support the share price.",
    outlook: "Apple Intelligence (on-device AI) launch in EU could be a meaningful re-rating catalyst mid-year. Watch: China macro risk.",
  },
  MSFT: {
    short: "Down 0.15% — post-earnings consolidation",
    why: "Microsoft dipped slightly after a strong earnings run as investors rotated into smaller AI plays. Azure cloud revenue grew 28% — but the market had priced in 30%+. Copilot adoption across Office 365 is accelerating.",
    outlook: "Valuation is full but justified by AI monetisation. Support at $400; near-term target range $410–430 on consensus.",
  },
  AMZN: {
    short: "Up 2.8% — AWS margins expanding",
    why: "Amazon Web Services margin hit a record 37% this quarter. Advertising revenue (often overlooked) grew 19% and is now a $56B annual run-rate business. Prime subscriber churn is at an all-time low.",
    outlook: "AWS + Ads = the value engine. Retail profitability improvement is the optionality. Analysts broadly bullish with a median target of $225.",
  },
  EUNL: {
    short: "Up 0.75% — global equities rising",
    why: "iShares Core MSCI World tracked the broad market rally led by US tech and European industrials. The ETF holds 1,500+ stocks, so single-stock drama is smoothed out — this is pure broad-market beta.",
    outlook: "As a core holding, monitor global PMI and Fed/ECB rate paths. No single catalyst — consistent long-term compounder.",
  },
  VUAA: {
    short: "Up 0.6% — S&P 500 steady climb",
    why: "The S&P 500 continued its grind higher on solid earnings beats from mega-cap tech. The Vanguard S&P 500 UCITS ETF replicates this faithfully with low tracking error and a 0.07% TER.",
    outlook: "Core position. US exceptionalism thesis intact near-term. Watch: Q1 GDP and inflation prints for the next macro catalyst.",
  },
  SGLN: {
    short: "Gold flat — safe-haven demand steady",
    why: "Gold held steady near all-time highs as central bank buying (especially China, India) offset mild selling by ETF investors. Geopolitical risk premium remains elevated due to ongoing conflicts.",
    outlook: "Gold is your portfolio hedge. Real rates and USD strength are the key variables. $2,600/oz is strong support; ATH at $2,790.",
  },
  SAP: {
    short: "SAP stable — cloud migration on track",
    why: "SAP's transition from on-premise licensing to cloud subscriptions is ahead of schedule. RISE with SAP programme now covers 60% of Fortune 500 ERP clients. EU investors are re-rating European tech.",
    outlook: "Re-rating story intact. AI integrations into SAP S/4HANA could be a meaningful revenue layer by 2027. European tech tailwind.",
  },
  ASML: {
    short: "ASML strong — EUV monopoly intact",
    why: "ASML holds a global monopoly on EUV lithography machines, which every advanced semiconductor fab requires. Q4 order book was €7.2B, above consensus. AI-driven chip demand is pulling forward ASML's order intake.",
    outlook: "China export restriction risk is the key overhang. Ex-China, demand is structurally strong. Long-term compounder in the AI hardware stack.",
  },
};

function getMockExplanation(ticker: string) {
  return MOCK_EXPLANATIONS[ticker] ?? {
    short: "Position held — no recent catalyst",
    why: "No specific news found for this holding. The position is tracking broader market movements.",
    outlook: "Monitor earnings calendar and sector news for updates.",
  };
}

// Asset class color + emoji
function assetStyle(assetType: string) {
  switch (assetType) {
    case "crypto":    return { dot: "bg-purple-500", badge: "text-purple-400 bg-purple-500/10", label: "Crypto" };
    case "stock":     return { dot: "bg-blue-500",   badge: "text-blue-400 bg-blue-500/10",    label: "Stock"  };
    case "etf":       return { dot: "bg-teal-500",   badge: "text-teal-400 bg-teal-500/10",    label: "ETF"    };
    case "commodity": return { dot: "bg-yellow-500", badge: "text-yellow-400 bg-yellow-500/10",label: "Commodity" };
    default:          return { dot: "bg-gray-500",   badge: "text-gray-400 bg-gray-500/10",    label: "Asset"  };
  }
}

// Mock % change per ticker (would come from live prices in production)
const MOCK_CHANGES: Record<string, number> = {
  ETH: 23.5, BTC: -2.99, SHIB: 5.12,
  NVDA: 1.45, AAPL: 1.11, MSFT: -0.15, AMZN: 2.8,
  EUNL: 0.75, VUAA: 0.6, SGLN: 0.05,
  SAP: 0.4, ASML: 1.2,
};

interface Props {
  holding: PortfolioHolding;
  aiEnabled: boolean;
}

const StockExplainerCard = ({ holding, aiEnabled }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<{ short: string; why: string; outlook: string } | null>(null);

  const change = MOCK_CHANGES[holding.ticker] ?? 0;
  const isUp = change >= 0;
  const style = assetStyle(holding.assetType);

  const handleExpand = async () => {
    if (!aiEnabled) return;
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (explanation) return; // already loaded

    // Try backend, fall back to mock instantly
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stock-explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: holding.ticker, name: holding.name, change_pct: change }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        setExplanation(data);
      } else {
        setExplanation(getMockExplanation(holding.ticker));
      }
    } catch {
      setExplanation(getMockExplanation(holding.ticker));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-colors ${expanded ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      {/* Row — always visible */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        disabled={!aiEnabled}
      >
        {/* Colour dot */}
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />

        {/* Name + asset type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{holding.name}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${style.badge}`}>
              {style.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{holding.ticker} · €{holding.valueEUR.toFixed(2)}</span>
        </div>

        {/* Change */}
        <div className={`flex items-center gap-0.5 shrink-0 ${isUp ? "text-positive" : "text-negative"}`}>
          {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span className="text-sm font-semibold">
            {isUp ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>

        {/* Expand icon — only when AI enabled */}
        {aiEnabled && (
          <div className="text-muted-foreground ml-1 shrink-0">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        )}
      </button>

      {/* Expanded explanation */}
      <AnimatePresence initial={false}>
        {expanded && aiEnabled && (
          <motion.div
            key="explain"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/40">
              {loading ? (
                <div className="flex items-center gap-2 py-2 text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Analysing with AI…</span>
                </div>
              ) : explanation ? (
                <div className="space-y-3">
                  {/* Short headline */}
                  <div className="flex items-start gap-1.5">
                    <Sparkles size={12} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-xs font-semibold text-foreground leading-snug">{explanation.short}</p>
                  </div>

                  {/* Why section */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Why it moved</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{explanation.why}</p>
                  </div>

                  {/* Outlook */}
                  <div className="bg-secondary rounded-lg p-2.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outlook</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{explanation.outlook}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockExplainerCard;
