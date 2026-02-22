import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import type { Holding, PoolPortfolio } from "@/types/poolPortfolio";
import { portfolioHoldings } from "@/data/portfolioHoldings";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: Omit<PoolPortfolio, "id" | "createdAt" | "copyCount">) => void;
}

const RISK_LABELS = ["Low", "Medium", "High"] as const;

const CreatePoolPortfolioModal = ({ open, onClose, onCreate }: Props) => {
  const [name, setName]                         = useState("");
  const [selectedTickers, setSelectedTickers]   = useState<string[]>([]);
  const [weights, setWeights]                   = useState<Record<string, number>>({});
  const [riskLabel, setRiskLabel]               = useState<"Low" | "Medium" | "High">("Medium");
  const [error, setError]                       = useState<string | null>(null);

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);

  const toggleTicker = (ticker: string) => {
    setSelectedTickers((prev) => {
      if (prev.includes(ticker)) {
        setWeights((w) => { const n = { ...w }; delete n[ticker]; return n; });
        return prev.filter((t) => t !== ticker);
      }
      setWeights((w) => ({ ...w, [ticker]: 0 }));
      return [...prev, ticker];
    });
    setError(null);
  };

  const handleWeightChange = (ticker: string, val: string) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setWeights((w) => ({ ...w, [ticker]: num }));
    setError(null);
  };

  const handleSave = () => {
    if (!name.trim())                              { setError("Please enter a portfolio name.");             return; }
    if (selectedTickers.length === 0)              { setError("Select at least one holding.");              return; }
    if (Math.abs(totalWeight - 100) > 0.5)         { setError(`Weights must sum to 100%. Currently: ${totalWeight.toFixed(1)}%`); return; }

    const holdings: Holding[] = selectedTickers.map((ticker) => {
      const h = portfolioHoldings.find((p) => p.ticker === ticker)!;
      return { ticker, name: h.name, weight: (weights[ticker] ?? 0) / 100, assetClass: h.assetType };
    });

    onCreate({
      name: name.trim(),
      creator: "@you",
      holdings,
      returns: { "1D": 0, "1W": 0, "1M": 0, "1Y": 0, ALL: 0 },
      riskLabel,
    });

    setName(""); setSelectedTickers([]); setWeights({}); setRiskLabel("Medium"); setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[92vh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <h2 className="text-base font-bold text-foreground">Create pool portfolio</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={18} className="text-foreground/70" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Portfolio name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  placeholder="e.g. My Tech Portfolio"
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border border-border focus:border-primary transition-colors"
                />
              </div>

              {/* Risk */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Risk level</label>
                <div className="flex gap-2">
                  {RISK_LABELS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRiskLabel(r)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        riskLabel === r
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-foreground border-border hover:bg-border"
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
                  <label className="text-xs font-semibold text-muted-foreground">Select holdings</label>
                  {selectedTickers.length > 0 && (
                    <span className={`text-xs font-semibold ${Math.abs(totalWeight - 100) < 0.5 ? "text-positive" : "text-amber-500"}`}>
                      Total: {totalWeight.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {portfolioHoldings.map((h) => {
                    const isSelected = selectedTickers.includes(h.ticker);
                    return (
                      <div
                        key={h.ticker}
                        className={`rounded-xl border transition-colors ${isSelected ? "border-primary/40 bg-primary/5" : "border-border bg-secondary"}`}
                      >
                        <button
                          onClick={() => toggleTicker(h.ticker)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                            {isSelected && <span className="text-primary-foreground text-[9px] font-bold">✓</span>}
                          </div>
                          <span className="text-xs font-mono font-bold text-foreground w-10">{h.ticker}</span>
                          <span className="text-xs text-foreground flex-1 truncate">{h.name}</span>
                        </button>
                        {isSelected && (
                          <div className="px-4 pb-3 flex items-center gap-3">
                            <input
                              type="range" min={0} max={100} step={1}
                              value={weights[h.ticker] ?? 0}
                              onChange={(e) => handleWeightChange(h.ticker, e.target.value)}
                              className="flex-1 accent-primary"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number" min={0} max={100} step={1}
                                value={weights[h.ticker] ?? 0}
                                onChange={(e) => handleWeightChange(h.ticker, e.target.value)}
                                className="w-14 bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground text-right outline-none focus:border-primary"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                            <button onClick={() => toggleTicker(h.ticker)} className="p-1">
                              <Trash2 size={13} className="text-muted-foreground hover:text-negative transition-colors" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-negative/10 border border-negative/20 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-negative mt-0.5 shrink-0" />
                  <p className="text-xs text-negative">{error}</p>
                </div>
              )}
            </div>

            <div className="shrink-0 px-5 py-4 border-t border-border">
              <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-2xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Create &amp; publish
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePoolPortfolioModal;
