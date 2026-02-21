import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { getSpendMap } from "@/lib/api";
import type { SpendMapResponse, SpendCategory } from "@/data/feedData";

const USERS = ["mock_user_1", "mock_user_2", "mock_user_3"];
const USER_LABELS: Record<string, string> = {
  mock_user_1: "Travel spender",
  mock_user_2: "Investor",
  mock_user_3: "Young saver",
};

// Custom PieChart tooltip
const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{ background: "#1e2d2a", border: "1px solid rgba(0,212,168,0.3)" }}
    >
      <p className="font-semibold text-white">{d.name}</p>
      <p style={{ color: "#00D4A8" }}>€{d.value.toFixed(0)}</p>
    </div>
  );
};

// Investment match card
const InvestmentCard = ({
  inv,
}: {
  inv: SpendCategory["investments"][0];
}) => (
  <div
    className="flex items-center gap-3 p-3 rounded-xl"
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
      style={{ background: "rgba(0,212,168,0.15)", border: "1px solid rgba(0,212,168,0.25)" }}
    >
      {inv.ticker.slice(0, 2)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-foreground truncate">{inv.name}</p>
        <span className="text-xs text-muted-foreground shrink-0">{inv.ticker}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{inv.match_reason}</p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-sm font-bold text-foreground">{inv.price}</p>
      <div className="flex items-center justify-end gap-0.5">
        {inv.change >= 0 ? (
          <TrendingUp size={10} style={{ color: "#4CAF50" }} />
        ) : (
          <TrendingDown size={10} style={{ color: "#EF4444" }} />
        )}
        <span
          className="text-xs font-medium"
          style={{ color: inv.change >= 0 ? "#4CAF50" : "#EF4444" }}
        >
          {inv.change >= 0 ? "+" : ""}{inv.change}%
        </span>
      </div>
    </div>
  </div>
);

// Category chip
const CategoryChip = ({
  cat,
  isSelected,
  onClick,
}: {
  cat: SpendCategory;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 shrink-0 transition-transform active:scale-95"
  >
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all"
      style={{
        background: isSelected ? `${cat.color}22` : "rgba(255,255,255,0.05)",
        border: `2px solid ${isSelected ? cat.color : "rgba(255,255,255,0.1)"}`,
        boxShadow: isSelected ? `0 0 12px ${cat.color}44` : "none",
      }}
    >
      {cat.emoji}
    </div>
    <span className="text-xs font-medium" style={{ color: isSelected ? cat.color : "rgba(255,255,255,0.5)" }}>
      {cat.name}
    </span>
    <span className="text-xs" style={{ color: isSelected ? cat.color : "rgba(255,255,255,0.35)" }}>
      €{cat.amount.toFixed(0)}
    </span>
  </button>
);

const SpendMap = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SpendMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<SpendCategory | null>(null);
  const [activeUser, setActiveUser] = useState("mock_user_1");

  useEffect(() => {
    setLoading(true);
    setSelectedCat(null);
    getSpendMap(activeUser).then((res) => {
      setData(res);
      setSelectedCat(res.categories[0] ?? null);
      setLoading(false);
    });
  }, [activeUser]);

  const pieData =
    data?.categories.map((c) => ({ name: c.name, value: c.amount, color: c.color })) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-28"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spend → Invest Map</h1>
          <p className="text-xs text-muted-foreground">See the stocks behind your spending</p>
        </div>
      </div>

      {/* User selector */}
      <div className="px-4 mb-5">
        <div className="flex bg-secondary rounded-xl p-1 gap-1">
          {USERS.map((u) => (
            <button
              key={u}
              onClick={() => setActiveUser(u)}
              className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
              style={{
                background: activeUser === u ? "rgba(0,212,168,0.15)" : "transparent",
                color: activeUser === u ? "#00D4A8" : "rgba(255,255,255,0.45)",
                border: activeUser === u ? "1px solid rgba(0,212,168,0.3)" : "1px solid transparent",
              }}
            >
              {USER_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analysing your spending…</p>
        </div>
      ) : data ? (
        <>
          {/* Total spend hero */}
          <div className="px-4 mb-2">
            <div
              className="rounded-2xl p-4"
              style={{
                background: "linear-gradient(135deg, rgba(0,212,168,0.12) 0%, rgba(26,26,46,0.8) 100%)",
                border: "1px solid rgba(0,212,168,0.2)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {data.period}
              </p>
              <p className="text-4xl font-bold text-foreground">
                €{data.total_monthly_spend.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">total spending mapped to investments</p>
            </div>
          </div>

          {/* Donut chart */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl pt-4 pb-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Spending breakdown
              </p>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                      strokeWidth={0}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                          opacity={
                            selectedCat === null || selectedCat.color === entry.color ? 1 : 0.35
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl">{selectedCat?.emoji ?? "💳"}</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: selectedCat?.color ?? "#00D4A8" }}
                  >
                    {selectedCat ? `${selectedCat.percentage.toFixed(0)}%` : ""}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 justify-center">
                {data.categories.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-xs text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category chips */}
          <div className="px-4 mb-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tap a category
            </p>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {data.categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  cat={cat}
                  isSelected={selectedCat?.id === cat.id}
                  onClick={() => setSelectedCat(cat)}
                />
              ))}
            </div>
          </div>

          {/* Investment matches panel */}
          <AnimatePresence mode="wait">
            {selectedCat && (
              <motion.div
                key={selectedCat.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="px-4 mb-5"
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${selectedCat.color}33` }}
                >
                  {/* Panel header */}
                  <div
                    className="px-4 py-3 flex items-center gap-2"
                    style={{ background: `${selectedCat.color}14` }}
                  >
                    <span className="text-xl">{selectedCat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {selectedCat.name} · €{selectedCat.amount.toFixed(0)}/mo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCat.percentage.toFixed(1)}% of your total spend
                      </p>
                    </div>
                    <div
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        background: `${selectedCat.color}22`,
                        color: selectedCat.color,
                        border: `1px solid ${selectedCat.color}44`,
                      }}
                    >
                      {selectedCat.investments.length} matches
                    </div>
                  </div>

                  {/* Investment cards */}
                  <div className="p-3 space-y-2">
                    {selectedCat.investments.map((inv) => (
                      <InvestmentCard key={inv.ticker} inv={inv} />
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="px-3 pb-3">
                    <button
                      className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity active:opacity-70"
                      style={{
                        background: `linear-gradient(135deg, ${selectedCat.color}, ${selectedCat.color}cc)`,
                        color: "#0d1a17",
                      }}
                    >
                      Explore {selectedCat.name} investments
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Insight card */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-4"
              style={{
                background: "linear-gradient(135deg, rgba(0,212,168,0.08), rgba(165,107,250,0.08))",
                border: "1px solid rgba(0,212,168,0.2)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,212,168,0.15)" }}
                >
                  <Sparkles size={18} style={{ color: "#00D4A8" }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#00D4A8" }}>
                    N26 AI Insight
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{data.ai_insight}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category bar summary */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Full breakdown
              </p>
              <div className="space-y-3">
                {data.categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <span className="text-lg w-6 text-center shrink-0">{c.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="text-sm font-bold text-foreground">
                          €{c.amount.toFixed(0)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: c.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${c.percentage}%` }}
                          transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </motion.div>
  );
};

export default SpendMap;
