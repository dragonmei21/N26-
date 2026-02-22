import { useState } from "react";
import { motion } from "framer-motion";
import { Users, ChevronRight, CheckCircle2 } from "lucide-react";
import type { RankedPoolPortfolio } from "@/types/poolPortfolio";

interface Props {
  portfolio: RankedPoolPortfolio;
  isCopied: boolean;
  onCopyClick: () => void;
  onViewDetails: () => void;
}

const RETURN_LABELS = ["1D", "1W", "1M", "1Y", "ALL"] as const;

function riskColor(label: string) {
  if (label === "Low")  return "text-positive bg-positive/10";
  if (label === "High") return "text-negative bg-negative/10";
  return "text-amber-500 bg-amber-500/10";
}

const PoolPortfolioCard = ({ portfolio, isCopied, onCopyClick, onViewDetails }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const topHoldings = portfolio.holdings.slice(0, 5);

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-colors ${
        isCopied ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start justify-between gap-3 px-4 pt-4 pb-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-bold text-foreground truncate">{portfolio.name}</span>
            {isCopied && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                <CheckCircle2 size={10} /> Copied
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{portfolio.creator}</span>
            <span>·</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${riskColor(portfolio.riskLabel)}`}>
              {portfolio.riskLabel} risk
            </span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Users size={10} />
              {portfolio.copyCount.toLocaleString()}
            </span>
          </div>
        </div>
        <ChevronRight
          size={16}
          className={`text-muted-foreground mt-1 shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Returns row */}
      <div className="flex items-center justify-between px-4 pb-3 gap-1 border-t border-border/40 pt-2.5">
        {RETURN_LABELS.map((label) => {
          const val = portfolio.returns[label];
          const pos = val >= 0;
          return (
            <div key={label} className="flex flex-col items-center gap-0.5 min-w-[40px]">
              <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
              <span className={`text-xs font-semibold ${pos ? "text-positive" : "text-negative"}`}>
                {pos ? "+" : ""}{val.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Expanded holdings */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-3 border-t border-border/40 pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Top holdings</p>
            <div className="space-y-1.5">
              {topHoldings.map((h) => (
                <div key={h.ticker} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-foreground w-12 shrink-0">{h.ticker}</span>
                  <div className="flex-1 bg-secondary rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-primary/70"
                      style={{ width: `${(h.weight * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                    {(h.weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4 pt-2">
        <button
          onClick={onCopyClick}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            isCopied
              ? "bg-secondary text-foreground hover:bg-border"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isCopied ? "Stop copying" : "Copy portfolio"}
        </button>
        <button
          onClick={onViewDetails}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-secondary transition-colors text-foreground flex items-center gap-1"
        >
          Details <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default PoolPortfolioCard;
