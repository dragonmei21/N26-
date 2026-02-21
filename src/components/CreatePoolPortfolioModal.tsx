import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import type { PoolPortfolio, Holding, RiskLabel } from "@/types/poolPortfolio";
import { portfolioHoldings } from "@/data/portfolioHoldings";

interface Props {
  onClose: () => void;
  onCreate: (pool: Omit<PoolPortfolio, "id" | "copyCount" | "createdAt">) => void;
}

const RISK_LABELS: RiskLabel[] = ["Low", "Medium", "High"];

const DEFAULT_HOLDINGS: Holding[] = portfolioHoldings.slice(0, 5).map((h, i, arr) => ({
  ticker: h.ticker,
  name: h.name,
  weight: parseFloat((1 / arr.length).toFixed(2)),
  assetClass: h.assetType,
}));

export function CreatePoolPortfolioModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [riskLabel, setRiskLabel] = useState<RiskLabel>("Medium");
  const [holdings, setHoldings] = useState<Holding[]>(DEFAULT_HOLDINGS);
  const [error, setError] = useState<string | null>(null);

  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0);
  const weightOk = Math.abs(totalWeight - 1) < 0.01;

  const updateWeight = (index: number, raw: string) => {
    const value = Math.min(1, Math.max(0, parseFloat(raw) / 100 || 0));
    setHoldings((prev) => prev.map((h, i) => (i === index ? { ...h, weight: value } : h)));
  };

  const removeHolding = (index: number) => {
    setHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const addHolding = () => {
    const available = portfolioHoldings.find(
      (ph) => !holdings.some((h) => h.ticker === ph.ticker),
    );
    if (!available) return;
    setHoldings((prev) => [
      ...prev,
      { ticker: available.ticker, name: available.name, weight: 0, assetClass: available.assetType },
    ]);
  };

  const normalise = () => {
    const total = holdings.reduce((s, h) => s + h.weight, 0);
    if (total === 0) return;
    setHoldings((prev) => prev.map((h) => ({ ...h, weight: parseFloat((h.weight / total).toFixed(4)) })));
  };

  const handleSubmit = () => {
    if (!name.trim()) { setError("Please enter a portfolio name."); return; }
    if (holdings.length === 0) { setError("Add at least one holding."); return; }
    if (!weightOk) { setError(`Weights must sum to 100%. Currently ${(totalWeight * 100).toFixed(1)}%.`); return; }
    setError(null);
    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      creator: "@you",
      holdings,
      riskLabel,
      returns: { "1D": 0, "1W": 0, "1M": 0, "1Y": 0, "ALL": 0 },
    });
    onClose();
  };

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
          style={{ maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0">
            <h3 className="text-lg font-bold text-foreground">Create pool portfolio</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-5">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Portfolio name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Supercycle"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your strategy..."
                rows={2}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Risk */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Risk level</label>
              <div className="flex gap-2">
                {RISK_LABELS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskLabel(r)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      riskLabel === r
                        ? r === "Low"
                          ? "bg-positive/10 text-positive border-positive/30"
                          : r === "Medium"
                          ? "bg-amber-400/10 text-amber-400 border-amber-400/30"
                          : "bg-negative/10 text-negative border-negative/30"
                        : "bg-secondary text-muted-foreground border-transparent"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Holdings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Holdings</label>
                <div className="flex gap-2">
                  <button onClick={normalise} className="text-xs text-primary font-medium">Normalise</button>
                  <button onClick={addHolding} className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {holdings.map((h, i) => (
                  <div key={h.ticker} className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{h.ticker}</p>
                      <p className="text-xs text-muted-foreground truncate">{h.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round(h.weight * 100)}
                        onChange={(e) => updateWeight(i, e.target.value)}
                        className="w-16 bg-card border border-border rounded-lg px-2 py-1 text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <button onClick={() => removeHolding(i)} className="text-muted-foreground hover:text-negative transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Weight total indicator */}
              <div className={`mt-2 flex items-center justify-between text-xs px-1 ${weightOk ? "text-positive" : "text-amber-400"}`}>
                <span>Total weight</span>
                <span className="font-semibold">{(totalWeight * 100).toFixed(1)}% {weightOk ? "✓" : "(must be 100%)"}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-negative/10 border border-negative/20 rounded-xl p-3">
                <AlertCircle size={14} className="text-negative shrink-0 mt-0.5" />
                <p className="text-xs text-negative">{error}</p>
              </div>
            )}
          </div>

          <div className="shrink-0 px-5 pb-8 pt-3 border-t border-border/40">
            <button
              onClick={handleSubmit}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold"
            >
              Create &amp; publish pool portfolio
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
