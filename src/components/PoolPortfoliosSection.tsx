import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users } from "lucide-react";
import { usePoolPortfolios } from "@/hooks/usePoolPortfolios";
import PoolPortfolioCard from "@/components/PoolPortfolioCard";
import PoolPortfolioDetailsModal from "@/components/PoolPortfolioDetailsModal";
import CopyAllocationModal from "@/components/CopyAllocationModal";
import CreatePoolPortfolioModal from "@/components/CreatePoolPortfolioModal";
import type { RankedPoolPortfolio, CopyAllocation } from "@/types/poolPortfolio";
import type { PortfolioHolding } from "@/data/portfolioHoldings";

interface Props {
  userHoldings: PortfolioHolding[];
}

function toWeightedHoldings(holdings: PortfolioHolding[]) {
  const total = holdings.reduce((s, h) => s + h.valueEUR, 0);
  return holdings.map((h) => ({
    ticker:     h.ticker,
    name:       h.name,
    weight:     total > 0 ? h.valueEUR / total : 0,
    assetClass: h.assetType,
  }));
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card animate-pulse p-4 space-y-3">
      <div className="h-4 bg-secondary rounded w-2/3" />
      <div className="h-3 bg-secondary rounded w-1/3" />
      <div className="flex gap-2 pt-1">
        {[...Array(5)].map((_, i) => <div key={i} className="flex-1 h-8 bg-secondary rounded-xl" />)}
      </div>
      <div className="flex gap-2 pt-1">
        <div className="flex-1 h-10 bg-secondary rounded-xl" />
        <div className="w-24 h-10 bg-secondary rounded-xl" />
      </div>
    </div>
  );
}

const PoolPortfoliosSection = ({ userHoldings }: Props) => {
  const normalizedHoldings = useMemo(() => toWeightedHoldings(userHoldings), [userHoldings]);

  const { rankedPortfolios, copiedIds, isLoading, toggleCopy, previewAllocation, createPortfolio } =
    usePoolPortfolios(normalizedHoldings);

  const [detailPortfolio, setDetailPortfolio]       = useState<RankedPoolPortfolio | null>(null);
  const [allocationPortfolio, setAllocationPortfolio] = useState<RankedPoolPortfolio | null>(null);
  const [showCreate, setShowCreate]                 = useState(false);
  const [lastAllocation, setLastAllocation]         = useState<CopyAllocation | null>(null);

  const copiedPortfolios   = rankedPortfolios.filter((p) =>  copiedIds.includes(p.id));
  const uncopiedPortfolios = rankedPortfolios.filter((p) => !copiedIds.includes(p.id));

  const handleCopyClick = (portfolio: RankedPoolPortfolio) => {
    if (copiedIds.includes(portfolio.id)) {
      toggleCopy(portfolio.id);   // uncopy immediately
    } else {
      setAllocationPortfolio(portfolio);   // open amount modal first
    }
  };

  const handleAllocationConfirm = (allocation: CopyAllocation) => {
    setLastAllocation(allocation);
    toggleCopy(allocation.poolPortfolioId);
  };

  return (
    <div className="mt-8 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Popular Portfolios</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ranked by similarity to your holdings</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-border transition-colors"
        >
          <Plus size={13} />
          Create
        </button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          <CardSkeleton /><CardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && rankedPortfolios.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Users size={28} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No pool portfolios yet</p>
          <p className="text-xs text-muted-foreground max-w-[220px] mb-5">
            Be the first to share a portfolio with the community.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Plus size={14} />
            Create pool portfolio
          </button>
        </div>
      )}

      {/* Copied by you */}
      <AnimatePresence initial={false}>
        {copiedPortfolios.length > 0 && (
          <motion.div
            key="copied-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs font-semibold text-primary mb-2">Copied by you</p>
            <div className="space-y-3 mb-5">
              {copiedPortfolios.map((p) => (
                <PoolPortfolioCard
                  key={p.id}
                  portfolio={p}
                  isCopied={true}
                  onCopyClick={() => handleCopyClick(p)}
                  onViewDetails={() => setDetailPortfolio(p)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {lastAllocation && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onAnimationComplete={() => setTimeout(() => setLastAllocation(null), 3500)}
            className="mb-4 flex items-center gap-2.5 bg-positive/10 border border-positive/25 rounded-xl px-4 py-3"
          >
            <span className="text-positive text-base">✓</span>
            <p className="text-xs text-positive font-semibold">
              Portfolio copied — €{lastAllocation.investmentAmountEUR.toFixed(2)} allocated across{" "}
              {lastAllocation.lines.length} holdings.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All portfolios */}
      {!isLoading && uncopiedPortfolios.length > 0 && (
        <div className="space-y-3">
          {uncopiedPortfolios.map((p) => (
            <PoolPortfolioCard
              key={p.id}
              portfolio={p}
              isCopied={false}
              onCopyClick={() => handleCopyClick(p)}
              onViewDetails={() => setDetailPortfolio(p)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PoolPortfolioDetailsModal
        portfolio={detailPortfolio}
        isCopied={detailPortfolio ? copiedIds.includes(detailPortfolio.id) : false}
        onClose={() => setDetailPortfolio(null)}
        onCopyClick={() => {
          if (detailPortfolio) handleCopyClick(detailPortfolio);
          setDetailPortfolio(null);
        }}
      />
      <CopyAllocationModal
        portfolio={allocationPortfolio}
        onClose={() => setAllocationPortfolio(null)}
        onConfirm={handleAllocationConfirm}
      />
      <CreatePoolPortfolioModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createPortfolio}
      />
    </div>
  );
};

export default PoolPortfoliosSection;
