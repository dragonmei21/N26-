import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, Pin } from "lucide-react";
import { usePoolPortfolios } from "@/hooks/usePoolPortfolios";
import { PoolPortfolioCard } from "@/components/PoolPortfolioCard";
import { PoolPortfolioDetailsModal } from "@/components/PoolPortfolioDetailsModal";
import { CreatePoolPortfolioModal } from "@/components/CreatePoolPortfolioModal";
import type { RankedPoolPortfolio } from "@/types/poolPortfolio";

export function PoolPortfoliosSection() {
  const { ranked, isCopied, copyPortfolio, createPool } = usePoolPortfolios();

  const [detailsPool, setDetailsPool] = useState<RankedPoolPortfolio | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const copiedPools = ranked.filter((p) => isCopied(p.id));
  const otherPools = ranked.filter((p) => !isCopied(p.id));

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Pool Portfolios</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Copy strategies from other N26 investors
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-2 rounded-xl border border-primary/20 hover:bg-primary/15 transition-colors"
        >
          <Plus size={13} />
          Create
        </button>
      </div>

      {/* Copied by you — pinned at top */}
      <AnimatePresence initial={false}>
        {copiedPools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Pin size={12} className="text-positive" />
              <p className="text-xs font-semibold text-positive">Copied by you</p>
            </div>
            <div className="space-y-3">
              {copiedPools.map((pool) => (
                <PoolPortfolioCard
                  key={pool.id}
                  pool={pool}
                  isCopied={true}
                  onCopy={copyPortfolio}
                  onViewDetails={setDetailsPool}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ranked list */}
      {otherPools.length === 0 && copiedPools.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
            <TrendingUp size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No pool portfolios yet</p>
          <p className="text-xs text-muted-foreground mb-5 max-w-[220px]">
            Be the first to share your strategy with other N26 investors.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl"
          >
            <Plus size={14} />
            Create pool portfolio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {otherPools.map((pool) => (
            <PoolPortfolioCard
              key={pool.id}
              pool={pool}
              isCopied={false}
              onCopy={copyPortfolio}
              onViewDetails={setDetailsPool}
            />
          ))}
        </div>
      )}

      {/* Details modal */}
      {detailsPool && (
        <PoolPortfolioDetailsModal
          pool={detailsPool}
          isCopied={isCopied(detailsPool.id)}
          onCopy={copyPortfolio}
          onClose={() => setDetailsPool(null)}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreatePoolPortfolioModal
          onClose={() => setShowCreate(false)}
          onCreate={createPool}
        />
      )}
    </div>
  );
}
