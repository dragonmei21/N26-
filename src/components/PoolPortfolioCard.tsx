import { useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, ChevronRight, Check, Copy } from "lucide-react";
import type { RankedPoolPortfolio, ReturnPeriod } from "@/types/poolPortfolio";

interface PoolPortfolioCardProps {
  pool: RankedPoolPortfolio;
  isCopied: boolean;
  onCopy: (id: string) => void;
  onViewDetails: (pool: RankedPoolPortfolio) => void;
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

function ReturnBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`text-xs font-semibold ${positive ? "text-positive" : "text-negative"}`}>
      {positive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

export function PoolPortfolioCard({ pool, isCopied, onCopy, onViewDetails }: PoolPortfolioCardProps) {
  const [activePeriod, setActivePeriod] = useState<ReturnPeriod>("1M");

  const topHoldings = pool.holdings.slice(0, 5);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-foreground truncate">{pool.name}</h4>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${RISK_COLORS[pool.riskLabel]}`}>
              {pool.riskLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{pool.creator}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Users size={11} />
          <span>{pool.copyCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Return period selector */}
      <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
        {RETURN_PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setActivePeriod(p)}
            className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-colors ${
              activePeriod === p ? "bg-card text-primary" : "text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Active return */}
      <div className="flex items-center gap-2">
        {pool.returns[activePeriod] >= 0 ? (
          <TrendingUp size={16} className="text-positive shrink-0" />
        ) : (
          <TrendingDown size={16} className="text-negative shrink-0" />
        )}
        <ReturnBadge value={pool.returns[activePeriod]} />
        <span className="text-xs text-muted-foreground">{activePeriod} return</span>
      </div>

      {/* Holdings composition bar */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">Top holdings</p>
        {/* Weight bar */}
        <div className="flex rounded-full overflow-hidden h-1.5 mb-2">
          {topHoldings.map((h, i) => (
            <div
              key={h.ticker}
              className={`${ASSET_COLORS[h.assetClass ?? "stock"]} transition-all`}
              style={{ width: `${h.weight * 100}%`, opacity: 1 - i * 0.12 }}
            />
          ))}
        </div>
        {/* Ticker chips */}
        <div className="flex flex-wrap gap-1.5">
          {topHoldings.map((h) => (
            <div key={h.ticker} className="flex items-center gap-1 bg-secondary rounded-full px-2 py-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${ASSET_COLORS[h.assetClass ?? "stock"]}`} />
              <span className="text-[11px] font-medium text-foreground">{h.ticker}</span>
              <span className="text-[10px] text-muted-foreground">{(h.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onCopy(pool.id)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            isCopied
              ? "bg-positive/10 text-positive border border-positive/30"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {isCopied ? (
            <><Check size={14} /> Copying</>
          ) : (
            <><Copy size={14} /> Copy portfolio</>
          )}
        </motion.button>
        <button
          onClick={() => onViewDetails(pool)}
          className="w-10 flex items-center justify-center bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
