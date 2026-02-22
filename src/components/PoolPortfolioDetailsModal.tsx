import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Calendar, TrendingUp } from "lucide-react";
import type { RankedPoolPortfolio } from "@/types/poolPortfolio";

interface Props {
  portfolio: RankedPoolPortfolio | null;
  isCopied: boolean;
  onClose: () => void;
  onCopyClick: () => void;
}

const RETURN_LABELS = ["1D", "1W", "1M", "1Y", "ALL"] as const;

function riskColor(label: string) {
  if (label === "Low")  return "text-positive bg-positive/10 border-positive/20";
  if (label === "High") return "text-negative bg-negative/10 border-negative/20";
  return "text-amber-500 bg-amber-500/10 border-amber-500/20";
}

const PoolPortfolioDetailsModal = ({ portfolio, isCopied, onClose, onCopyClick }: Props) => (
  <AnimatePresence>
    {portfolio && (
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40"
        />
        <motion.div
          key="sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[88vh] flex flex-col"
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
            <div>
              <h2 className="text-lg font-bold text-foreground">{portfolio.name}</h2>
              <p className="text-xs text-muted-foreground">{portfolio.creator}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
              <X size={18} className="text-foreground/70" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${riskColor(portfolio.riskLabel)}`}>
                {portfolio.riskLabel} risk
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                <Users size={11} />{portfolio.copyCount.toLocaleString()} copying
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                <Calendar size={11} />
                {new Date(portfolio.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                <TrendingUp size={11} />{(portfolio.relevanceScore * 100).toFixed(0)}% match
              </span>
            </div>

            {/* Returns grid */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Performance</p>
              <div className="grid grid-cols-5 gap-2">
                {RETURN_LABELS.map((label) => {
                  const val = portfolio.returns[label];
                  const pos = val >= 0;
                  return (
                    <div key={label} className="flex flex-col items-center bg-secondary rounded-xl p-2.5 gap-1">
                      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                      <span className={`text-sm font-bold ${pos ? "text-positive" : "text-negative"}`}>
                        {pos ? "+" : ""}{val.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Holdings */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">
                Holdings ({portfolio.holdings.length})
              </p>
              <div className="space-y-2.5">
                {portfolio.holdings.map((h) => (
                  <div key={h.ticker} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-foreground">{h.ticker.slice(0, 4)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">{h.name}</span>
                        <span className="text-sm font-bold text-foreground ml-2 shrink-0">
                          {(h.weight * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${(h.weight * 100).toFixed(0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 px-5 py-4 border-t border-border">
            <button
              onClick={() => { onCopyClick(); onClose(); }}
              className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-colors ${
                isCopied
                  ? "bg-secondary text-foreground hover:bg-border"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isCopied ? "Stop copying this portfolio" : "Copy this portfolio"}
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default PoolPortfolioDetailsModal;
