import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SourceLogo from "@/components/SourceLogo";
import { getTickerInsight } from "@/lib/tickerInsights";

interface TickerInsightProps {
  ticker: string;
  timeRange: string;
  change: number;
  className?: string;
}

const TickerInsight = ({ ticker, timeRange, change: _change, className = "" }: TickerInsightProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsOpen(false);
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, [ticker, timeRange]);

  const insight = getTickerInsight(ticker, timeRange);

  if (isLoading) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Collapsed trigger line */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-start gap-1 w-full text-left group"
      >
        <span className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-2">
          {insight.shortSummary}
        </span>
        <ChevronRight
          size={12}
          className={`text-muted-foreground/50 shrink-0 mt-[3px] transition-transform duration-200 group-hover:text-muted-foreground ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {insight.drivers.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {insight.drivers.map((driver, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0 mt-[5px]" />
                    <span className="text-xs text-muted-foreground leading-relaxed">{driver}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground/70 italic">
                No specific catalysts identified for this period.
              </p>
            )}

            {insight.sources.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground/50">via</span>
                {insight.sources.map((src, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <SourceLogo name={src.name} domain={src.domain} size={14} />
                    <span className="text-[10px] text-muted-foreground/60">{src.name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TickerInsight;
