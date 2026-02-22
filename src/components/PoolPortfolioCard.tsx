import { Users, ChevronRight, CheckCircle2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { RankedPoolPortfolio } from "@/types/poolPortfolio";

interface Props {
  portfolio: RankedPoolPortfolio;
  isCopied: boolean;
  onCopyClick: () => void;
  onViewDetails: () => void;
}

const RETURN_LABELS = ["1D", "1W", "1M", "1Y", "ALL"] as const;

const SLICE_COLORS = [
  "hsl(168 80% 45%)",
  "hsl(217 91% 60%)",
  "hsl(38 92% 60%)",
  "hsl(271 76% 65%)",
  "hsl(355 78% 60%)",
  "hsl(142 71% 50%)",
  "hsl(199 89% 55%)",
];

function riskColor(label: string) {
  if (label === "Low") return "text-positive bg-positive/10";
  if (label === "High") return "text-negative bg-negative/10";
  return "text-amber-500 bg-amber-500/10";
}

const PoolPortfolioCard = ({ portfolio, isCopied, onCopyClick, onViewDetails }: Props) => {
  const topHoldings = portfolio.holdings.slice(0, 5);

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        isCopied ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
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
        </div>
      </div>

      {/* Composition: pie + legend */}
      <div className="px-4 pb-3 border-t border-border/40 pt-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
          Composition
        </p>
        <div className="flex items-center gap-4">
          {/* Pie */}
          <div className="shrink-0" style={{ width: 110, height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topHoldings}
                  dataKey="weight"
                  nameKey="ticker"
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={50}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {topHoldings.map((_, i) => (
                    <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(155 8% 12%)",
                    border: "1px solid hsl(155 5% 18%)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "hsl(0 0% 95%)",
                  }}
                  formatter={(value: number, name: string) => [
                    `${(value * 100).toFixed(1)}%`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {topHoldings.map((h, i) => (
              <div key={h.ticker} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
                />
                <span className="text-xs font-mono font-bold text-foreground w-11 shrink-0">{h.ticker}</span>
                <div className="flex-1 bg-secondary rounded-full h-1">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${(h.weight * 100).toFixed(0)}%`,
                      backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-9 text-right shrink-0">
                  {(h.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Returns */}
      <div className="flex items-center justify-between px-4 pb-3 border-t border-border/40 pt-2.5 gap-1">
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
    </div>
  );
};

export default PoolPortfolioCard;
