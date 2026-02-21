import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Check, Copy, TrendingUp, TrendingDown, Info } from "lucide-react";
import type { RankedPoolPortfolio, ReturnPeriod } from "@/types/poolPortfolio";

interface Props {
  pool: RankedPoolPortfolio;
  isCopied: boolean;
  onCopy: (id: string) => void;
  onClose: () => void;
}

const RETURN_PERIODS: ReturnPeriod[] = ["1D", "1W", "1M", "1Y", "ALL"];

const RISK_COLORS: Record<string, string> = {
  Low: "text-positive bg-positive/10",
  Medium: "text-amber-400 bg-amber-400/10",
  High: "text-negative bg-negative/10",
};

const ASSET_COLORS: Record<string, string> = {
  crypto: "bg-amber-500",
  stock: "bg-blue-500",
  etf: "bg-emerald-500",
  commodity: "bg-yellow-600",
  bond: "bg-violet-500",
};

const ASSET_LABELS: Record<string, string> = {
  crypto: "Crypto",
  stock: "Stock",
  etf: "ETF",
  commodity: "Commodity",
  bond: "Bond",
};

export function PoolPortfolioDetailsModal({ pool, isCopied, onCopy, onClose }: Props) {
  const [activePeriod, setActivePeriod] = useState<ReturnPeriod>("1M");

  const totalWeight = pool.holdings.reduce((s, h) => s + h.weight, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-md bg-card rounded-t-2xl border-t border-border flex flex-col"
          style={{ maxHeight: "85vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-0 shrink-0" />

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-5 pt-4 pb-4 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{pool.name}</h3>
                <p className="text-sm text-muted-foreground">{pool.creator}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${RISK_COLORS[pool.riskLabel]}`}>
                  {pool.riskLabel} risk
                </span>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Description */}
            {pool.description && (
              <div className="flex gap-2 bg-secondary rounded-xl p-3">
                <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{pool.description}</p>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Copying</p>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-primary" />
                  <span className="text-base font-bold text-foreground">{pool.copyCount.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <span className="text-base font-bold text-foreground">
                  {new Date(pool.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Returns */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Performance</p>
              <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5 mb-3">
                {RETURN_PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activePeriod === p ? "bg-card text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="bg-secondary rounded-xl p-4 flex items-center justify-center gap-3">
                {pool.returns[activePeriod] >= 0 ? (
                  <TrendingUp size={22} className="text-positive" />
                ) : (
                  <TrendingDown size={22} className="text-negative" />
                )}
                <span className={`text-3xl font-bold ${pool.returns[activePeriod] >= 0 ? "text-positive" : "text-negative"}`}>
                  {pool.returns[activePeriod] >= 0 ? "+" : ""}{pool.returns[activePeriod].toFixed(1)}%
                </span>
              </div>
              {/* All periods mini table */}
              <div className="grid grid-cols-5 gap-1 mt-2">
                {RETURN_PERIODS.map((p) => (
                  <div key={p} className="text-center">
                    <p className="text-[10px] text-muted-foreground">{p}</p>
                    <p className={`text-xs font-semibold ${pool.returns[p] >= 0 ? "text-positive" : "text-negative"}`}>
                      {pool.returns[p] >= 0 ? "+" : ""}{pool.returns[p].toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Holdings breakdown */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Holdings breakdown</p>
              {/* Stacked weight bar */}
              <div className="flex rounded-full overflow-hidden h-3 mb-3">
                {pool.holdings.map((h, i) => (
                  <div
                    key={h.ticker}
                    className={`${ASSET_COLORS[h.assetClass ?? "stock"]}`}
                    style={{ width: `${(h.weight / totalWeight) * 100}%`, opacity: 1 - i * 0.1 }}
                    title={`${h.ticker}: ${(h.weight * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {pool.holdings.map((h) => (
                  <div key={h.ticker} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${ASSET_COLORS[h.assetClass ?? "stock"]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-foreground">{h.ticker}</span>
                        <span className="text-sm font-semibold text-foreground">{(h.weight * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-muted-foreground truncate">{h.name}</span>
                        <span className="text-[10px] text-muted-foreground">{ASSET_LABELS[h.assetClass ?? "stock"]}</span>
                      </div>
                      {/* Mini weight bar */}
                      <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${ASSET_COLORS[h.assetClass ?? "stock"]} rounded-full`}
                          style={{ width: `${(h.weight / totalWeight) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Relevance score */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Relevance to your portfolio</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.round(pool.relevanceScore * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-primary">{Math.round(pool.relevanceScore * 100)}%</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0 px-5 pb-8 pt-3 border-t border-border/40">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { onCopy(pool.id); onClose(); }}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                isCopied
                  ? "bg-positive/10 text-positive border border-positive/30"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isCopied ? (
                <><Check size={16} /> Stop copying</>
              ) : (
                <><Copy size={16} /> Copy this portfolio</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
