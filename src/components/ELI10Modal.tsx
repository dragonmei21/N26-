import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, TrendingUp } from "lucide-react";
import { getELI10 } from "@/lib/api";
import type { ELI10Response } from "@/data/feedData";

interface ELI10ModalProps {
  concept: string;
  onClose: () => void;
}

const ELI10Modal = ({ concept, onClose }: ELI10ModalProps) => {
  const [data, setData] = useState<ELI10Response | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getELI10(concept).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [concept]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-md bg-card rounded-t-3xl border-t border-border p-5 pb-10 max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-5 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: "rgba(0,212,168,0.2)" }}>
                💡
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#00D4A8" }}>
                ELI10
              </span>
              <span className="text-xs text-muted-foreground">· Explain it like I'm 10</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={24} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Getting simple explanation…</p>
              </div>
            ) : data ? (
              <>
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{ background: "rgba(0,212,168,0.1)", border: "1px solid rgba(0,212,168,0.2)" }}
                  >
                    {data.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{data.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Simple explanation</p>
                  </div>
                </div>

                {/* Explanation */}
                <div
                  className="rounded-2xl p-4 mb-5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="text-sm text-foreground leading-relaxed">{data.eli10}</p>
                </div>

                {/* Related Investments */}
                {data.related_investments.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={14} style={{ color: "#00D4A8" }} />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Related investments
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.related_investments.map((inv) => (
                        <span
                          key={inv}
                          className="text-xs font-medium px-3 py-1.5 rounded-full"
                          style={{
                            background: "rgba(0,212,168,0.1)",
                            border: "1px solid rgba(0,212,168,0.25)",
                            color: "#00D4A8",
                          }}
                        >
                          {inv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ELI10Modal;
