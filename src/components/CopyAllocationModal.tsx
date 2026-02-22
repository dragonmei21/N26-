import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import type { RankedPoolPortfolio, CopyAllocation } from "@/types/poolPortfolio";
import { computeCopyAllocation } from "@/utils/portfolioSimilarity";

interface Props {
  portfolio: RankedPoolPortfolio | null;
  onClose: () => void;
  onConfirm: (allocation: CopyAllocation) => void;
}

const QUICK_AMOUNTS = [5, 25, 100, 500];

const CopyAllocationModal = ({ portfolio, onClose, onConfirm }: Props) => {
  const [rawAmount, setRawAmount]       = useState("");
  const [allocation, setAllocation]     = useState<CopyAllocation | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const handleAmountChange = useCallback(
    (value: string) => {
      setRawAmount(value);
      setAllocation(null);
      setError(null);
      const num = parseFloat(value);
      if (!portfolio || isNaN(num) || num <= 0) return;
      try {
        setAllocation(computeCopyAllocation(portfolio, num));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Allocation error");
      }
    },
    [portfolio]
  );

  const handleConfirm = () => {
    if (!allocation) return;
    onConfirm(allocation);
    onClose();
  };

  return (
    <AnimatePresence>
      {portfolio && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-background rounded-t-3xl max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Copy — {portfolio.name}</h2>
                <p className="text-xs text-muted-foreground">Static allocation · one-time investment</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={18} className="text-foreground/70" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Amount input */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Investment amount (EUR)
                </label>
                <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3 border border-border focus-within:border-primary transition-colors">
                  <span className="text-lg font-bold text-muted-foreground">€</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={rawAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="flex-1 bg-transparent text-lg font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => handleAmountChange(String(a))}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        rawAmount === String(a)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-foreground border-border hover:bg-border"
                      }`}
                    >
                      €{a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-negative/10 border border-negative/20 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="text-negative mt-0.5 shrink-0" />
                  <p className="text-xs text-negative">{error}</p>
                </div>
              )}

              {/* Allocation breakdown */}
              {allocation && !error && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={14} className="text-positive" />
                    <p className="text-sm font-semibold text-foreground">
                      Allocation — €{allocation.investmentAmountEUR.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {allocation.lines.map((line) => (
                      <div key={line.ticker} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-foreground">{line.ticker.slice(0, 4)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{line.name}</p>
                            <p className="text-xs text-muted-foreground">{(line.weight * 100).toFixed(1)}% weight</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-foreground">€{line.amountEUR.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 text-center">
                    Fractional shares supported. This is a static (one-time) allocation and will not auto-rebalance.
                  </p>
                </div>
              )}
            </div>

            <div className="shrink-0 px-5 py-4 border-t border-border">
              <button
                onClick={handleConfirm}
                disabled={!allocation || !!error}
                className="w-full py-3.5 rounded-2xl text-sm font-bold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm &amp; copy portfolio
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CopyAllocationModal;
