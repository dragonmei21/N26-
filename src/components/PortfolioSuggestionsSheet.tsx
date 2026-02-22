import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, Globe, PieChart, BarChart3, Shield, Lightbulb } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { portfolioHoldings } from "@/data/portfolioHoldings";
import { computeInsights } from "@/lib/portfolioInsights";

const riskProfiles = ["Conservative", "Balanced", "Growth"] as const;

type RiskProfile = "Conservative" | "Balanced" | "Growth";
type SectionKey = "region" | "sector" | "concentration" | "leverage";

const eli10Text: Record<SectionKey, { title: string; tip: Record<RiskProfile, string> }> = {
  region: {
    title: "Where your money is around the world",
    tip: {
      Conservative: "Keep most money close to home — familiar markets are safer and less scary when things go wrong.",
      Balanced:     "Try putting some money in different countries so if one does badly, the others might do okay.",
      Growth:       "Put money in faraway places like Asia or South America — they can grow faster, even if bumpier.",
    },
  },
  sector: {
    title: "What kinds of things you own",
    tip: {
      Conservative: "Stick to boring but steady things like healthcare and utilities — they don't go up much but don't fall much either.",
      Balanced:     "You have a lot in tech stuff. Maybe try owning things in other areas too, like health or energy.",
      Growth:       "Go all-in on the exciting stuff — tech, AI, crypto — but remember it can fall fast too!",
    },
  },
  concentration: {
    title: "Are you putting too many eggs in one basket?",
    tip: {
      Conservative: "Spread your money across many things so losing one doesn't hurt much. Safety in numbers!",
      Balanced:     "Your biggest investment is a big chunk. Spreading it out more could be safer.",
      Growth:       "It's okay to bet big on your best ideas — just make sure you believe in them long-term.",
    },
  },
  leverage: {
    title: "Are you taking too much or too little risk?",
    tip: {
      Conservative: "Try to keep things calm — choose investments that don't jump around too much.",
      Balanced:     "Think about whether you'd be okay losing some money for a chance to make more.",
      Growth:       "You want to take more risks to make more money. Just be ready for some big ups and downs!",
    },
  },
};

const normalText: Record<SectionKey, { title: string; tip: Record<RiskProfile, string> }> = {
  region: {
    title: "Geographical Exposure",
    tip: {
      Conservative: "Focus on stable developed markets (US, Europe). Limit EM exposure to under 10% to minimise currency and political risk.",
      Balanced:     "Consider adding exposure to Emerging Markets or Asia-Pacific to reduce regional concentration.",
      Growth:       "Increase EM and Asia-Pacific allocation to 25–35%. Higher volatility is acceptable for stronger long-term upside.",
    },
  },
  sector: {
    title: "Sector Diversification",
    tip: {
      Conservative: "Rotate into Utilities, Consumer Staples, and Healthcare — defensive sectors that hold up in downturns.",
      Balanced:     "Your portfolio is tech-heavy. Consider allocating to Healthcare, Energy, or Financials for better sector balance.",
      Growth:       "Lean into high-growth sectors: AI/Tech, Biotech, Clean Energy. Concentration is acceptable at this risk level.",
    },
  },
  concentration: {
    title: "Concentration Risk",
    tip: {
      Conservative: "No single holding should exceed 10% of your portfolio. Consider index funds for built-in diversification.",
      Balanced:     "Your top 3 holdings represent a significant share. Consider rebalancing to reduce single-asset dependency.",
      Growth:       "Conviction positions of 15–20% are acceptable. Ensure they're high-conviction picks with strong fundamentals.",
    },
  },
  leverage: {
    title: "Risk Assessment",
    tip: {
      Conservative: "Shift toward bonds, gold, or cash equivalents. Target 35–40% in safe-haven assets to cushion drawdowns.",
      Balanced:     "Adjust your crypto/equity ratio or add bonds to better match your risk profile.",
      Growth:       "Maximise equity and crypto exposure. Bonds below 10% is appropriate — your time horizon absorbs volatility.",
    },
  },
};

interface PortfolioSuggestionsSheetProps {
  onClose: () => void;
}

const BarChart = ({ items }: { items: { label: string; percent: number }[] }) => (
  <div className="space-y-2">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-24 truncate text-right">{item.label}</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(item.percent, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-foreground w-12">{item.percent.toFixed(1)}%</span>
      </div>
    ))}
  </div>
);

const ScoreBadge = ({ score, profile }: { score: number; profile: string }) => {
  const color = score >= 70 ? "text-positive" : score >= 40 ? "text-warning" : "text-negative";
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
          <span className={`text-lg font-bold ${color}`}>{score}</span>
        </div>
        <span className={`text-xs font-medium ${color}`}>/100</span>
      </div>
      <span className="text-[10px] text-muted-foreground">vs {profile} target</span>
    </div>
  );
};

const LeverageIcon = ({ level }: { level: "Over" | "Neutral" | "Under" }) => {
  if (level === "Over") return <TrendingUp size={18} className="text-negative" />;
  if (level === "Under") return <TrendingDown size={18} className="text-warning" />;
  return <Minus size={18} className="text-positive" />;
};

const PortfolioSuggestionsSheet = ({ onClose }: PortfolioSuggestionsSheetProps) => {
  const [eli10, setEli10] = useState(false);
  const [riskProfile, setRiskProfile] = useState<(typeof riskProfiles)[number]>("Balanced");

  const insights = useMemo(
    () => computeInsights(portfolioHoldings, riskProfile),
    [riskProfile]
  );

  const txt = eli10 ? eli10Text : normalText;
  const tip = (key: SectionKey) => txt[key].tip[riskProfile];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-md bg-card rounded-t-2xl border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto z-[101]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Lightbulb size={20} className="text-primary" />
              <h3 className="text-lg font-bold text-foreground">Portfolio Suggestions</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          {/* ELI10 toggle */}
          <div className="flex items-center justify-between mb-5 bg-secondary rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-foreground">ELI10 mode</span>
            <Switch checked={eli10} onCheckedChange={setEli10} />
          </div>

          {/* Summary card */}
          <div className="bg-secondary rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Overall Assessment</p>
                <p className="text-base font-bold text-foreground">{insights.overallAssessment}</p>
              </div>
              <ScoreBadge score={insights.diversificationScore} profile={riskProfile} />
            </div>
            <div className="flex items-center gap-2">
              <LeverageIcon level={insights.leverageAssessment} />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Leverage: {insights.leverageAssessment}</span>
                {" · "}
                {eli10
                  ? "How much risk you're taking compared to what's good for you."
                  : insights.leverageReason}
              </p>
            </div>
          </div>

          {/* Risk profile selector */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-2">
              {eli10 ? "How brave do you want to be?" : "Target risk profile"}
            </p>
            <div className="flex bg-secondary rounded-lg p-1">
              {riskProfiles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskProfile(r)}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                    riskProfile === r ? "bg-card text-primary" : "text-muted-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Target vs Actual allocation */}
          <div className="bg-secondary rounded-xl p-4 mb-3">
            <h4 className="text-sm font-bold text-foreground mb-3">
              {eli10 ? "What your money should look like" : "Target allocation"}
            </h4>
            {(
              [
                { label: "Crypto", currentKey: "cryptoPct", color: "bg-violet-500" },
                { label: "Stocks", currentKey: "stockPct",  color: "bg-primary" },
                { label: eli10 ? "Safe stuff" : "Bonds / Safe", currentKey: "safePct", color: "bg-emerald-500" },
              ] as const
            ).map(({ label, currentKey, color }) => {
              const current = insights.currentSplit[currentKey];
              const target  = insights.targetSplit[currentKey];
              const diff    = target - current;
              return (
                <div key={label} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-foreground font-medium">{current}%</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-semibold text-foreground">{target}%</span>
                      {diff !== 0 && (
                        <span className={diff > 0 ? "text-positive" : "text-negative"}>
                          ({diff > 0 ? "+" : ""}{diff}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-2 bg-card rounded-full overflow-hidden">
                    {/* current */}
                    <div
                      className={`absolute inset-y-0 left-0 ${color} opacity-40 rounded-full transition-all duration-500`}
                      style={{ width: `${current}%` }}
                    />
                    {/* target marker */}
                    <div
                      className={`absolute inset-y-0 left-0 ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${target}%`, opacity: 0.15 }}
                    />
                    <div
                      className={`absolute top-0 bottom-0 w-0.5 ${color} opacity-80 transition-all duration-500`}
                      style={{ left: `${target}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              {eli10 ? "Darker bar = where you are. Line = where you should be." : "Shaded = current · Line = target"}
            </p>
          </div>

          {/* Suggestions */}
          <div className="bg-secondary rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                {eli10 ? "What you could do" : "Rebalancing suggestions"}
              </h4>
            </div>
            <ul className="space-y-2">
              {insights.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-[5px]" />
                  <span className="text-xs text-muted-foreground leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Region exposure */}
          <div className="bg-secondary rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">{txt.region.title}</h4>
            </div>
            <div className="space-y-3">
              {insights.regionComparison.map(({ label, current, target }) => {
                const diff = target - current;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground w-20 truncate">{label}</span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-foreground font-medium">{current}%</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-foreground">{target}%</span>
                        {diff !== 0 && (
                          <span className={diff > 0 ? "text-positive" : "text-negative"}>
                            ({diff > 0 ? "+" : ""}{diff}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-2 bg-card rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary opacity-40 rounded-full transition-all duration-500"
                        style={{ width: `${current}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-primary opacity-80 transition-all duration-500"
                        style={{ left: `${target}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              {eli10 ? "Filled bar = now · Line = where it should be" : "Shaded = current · Line = target"}
            </p>
          </div>

          {/* Sector exposure */}
          <div className="bg-secondary rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">{txt.sector.title}</h4>
            </div>
            <div className="space-y-3">
              {insights.sectorComparison.map(({ label, current, target }) => {
                const diff = target - current;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground w-36 truncate">{label}</span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-foreground font-medium">{current}%</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-foreground">{target}%</span>
                        {diff !== 0 && (
                          <span className={diff > 0 ? "text-positive" : "text-negative"}>
                            ({diff > 0 ? "+" : ""}{diff}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-2 bg-card rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-violet-500 opacity-40 rounded-full transition-all duration-500"
                        style={{ width: `${current}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-violet-500 opacity-80 transition-all duration-500"
                        style={{ left: `${target}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              {eli10 ? "Filled bar = now · Line = where it should be" : "Shaded = current · Line = target"}
            </p>
          </div>

          {/* Concentration */}
          <div className="bg-secondary rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">{txt.concentration.title}</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-card rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{insights.concentration.top1Pct.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Top holding</p>
              </div>
              <div className="bg-card rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{insights.concentration.top3Pct.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Top 3 holdings</p>
              </div>
              <div className="bg-card rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{insights.concentration.top5Pct.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Top 5 holdings</p>
              </div>
              <div className="bg-card rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground">{insights.concentration.hhi}</p>
                <p className="text-xs text-muted-foreground">HHI index</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {insights.topHoldings.map((h, i) => (
                <div key={h.ticker} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-xs font-medium text-foreground flex-1">{h.name}</span>
                  <span className="text-xs text-muted-foreground">{h.ticker}</span>
                  <span className="text-xs font-medium text-foreground w-12 text-right">{h.percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 bg-card rounded-lg p-3">
              <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{tip("concentration")}</p>
            </div>
          </div>

          {/* Leverage / Risk */}
          <div className="bg-secondary rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">{txt.leverage.title}</h4>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <LeverageIcon level={insights.leverageAssessment} />
              <div>
                <p className="text-sm font-semibold text-foreground">{insights.leverageAssessment === "Neutral" ? "Neutral" : `${insights.leverageAssessment}leveraged`}</p>
                <p className="text-xs text-muted-foreground">{insights.leverageReason}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-card rounded-lg p-3">
              <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{tip("leverage")}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PortfolioSuggestionsSheet;
