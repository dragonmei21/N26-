import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, Globe, PieChart, BarChart3, Shield, Lightbulb } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { portfolioHoldings } from "@/data/portfolioHoldings";
import { computeInsights } from "@/lib/portfolioInsights";

const riskProfiles = ["Conservative", "Balanced", "Growth"] as const;

const eli10Text: Record<string, { title: string; tip: string }> = {
  region: {
    title: "Where your money is around the world",
    tip: "Try putting some money in different countries so if one does badly, the others might do okay.",
  },
  sector: {
    title: "What kinds of things you own",
    tip: "You have a lot in tech stuff. Maybe try owning things in other areas too, like health or energy.",
  },
  concentration: {
    title: "Are you putting too many eggs in one basket?",
    tip: "Your biggest investment is a big chunk. Spreading it out more could be safer.",
  },
  leverage: {
    title: "Are you taking too much or too little risk?",
    tip: "Think about whether you'd be okay losing some money for a chance to make more.",
  },
};

const normalText: Record<string, { title: string; tip: string }> = {
  region: {
    title: "Geographical Exposure",
    tip: "Consider adding exposure to Emerging Markets or Asia-Pacific to reduce regional concentration.",
  },
  sector: {
    title: "Sector Diversification",
    tip: "Your portfolio is tech-heavy. Consider allocating to Healthcare, Energy, or Financials for better sector balance.",
  },
  concentration: {
    title: "Concentration Risk",
    tip: "Your top 3 holdings represent a significant share. Consider rebalancing to reduce single-asset dependency.",
  },
  leverage: {
    title: "Risk Assessment",
    tip: "Adjust your crypto/equity ratio or add bonds to better match your risk profile.",
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

const ScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 70 ? "text-positive" : score >= 40 ? "text-warning" : "text-negative";
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
        <span className={`text-lg font-bold ${color}`}>{score}</span>
      </div>
      <span className={`text-xs font-medium ${color}`}>/100</span>
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
              <ScoreBadge score={insights.diversificationScore} />
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

          {/* Region exposure */}
          <div className="bg-secondary rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">{txt.region.title}</h4>
            </div>
            <BarChart items={insights.regionExposure.map((r) => ({ label: r.label, percent: r.percent }))} />
            <div className="mt-3 flex items-start gap-2 bg-card rounded-lg p-3">
              <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{txt.region.tip}</p>
            </div>
          </div>

          {/* Sector exposure */}
          <div className="bg-secondary rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">{txt.sector.title}</h4>
            </div>
            <BarChart items={insights.sectorExposure.map((s) => ({ label: s.label, percent: s.percent }))} />
            <div className="mt-3 flex items-start gap-2 bg-card rounded-lg p-3">
              <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{txt.sector.tip}</p>
            </div>
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
            {/* Top holdings list */}
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
              <p className="text-xs text-muted-foreground">{txt.concentration.tip}</p>
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
              <p className="text-xs text-muted-foreground">{txt.leverage.tip}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PortfolioSuggestionsSheet;
