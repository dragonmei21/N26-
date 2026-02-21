import { useState, useMemo, useCallback } from "react";
import type { PoolPortfolio, RankedPoolPortfolio } from "@/types/poolPortfolio";
import type { Holding } from "@/types/poolPortfolio";
import { MOCK_POOL_PORTFOLIOS } from "@/mocks/poolPortfolios";
import { rankPoolPortfolios } from "@/utils/portfolioSimilarity";
import { portfolioHoldings } from "@/data/portfolioHoldings";

const CURRENT_USER_ID = "mock_user_1";

/** Convert the existing portfolioHoldings (value-based) into weight-based Holding[] */
function holdingsToWeighted(rawHoldings: typeof portfolioHoldings): Holding[] {
  const total = rawHoldings.reduce((sum, h) => sum + h.valueEUR, 0);
  return rawHoldings.map((h) => ({
    ticker: h.ticker,
    name: h.name,
    weight: total > 0 ? h.valueEUR / total : 0,
    assetClass: h.assetType,
  }));
}

export function usePoolPortfolios() {
  const userHoldings = useMemo(() => holdingsToWeighted(portfolioHoldings), []);

  // In-memory store for created pools + copy state
  const [pools, setPools] = useState<PoolPortfolio[]>(MOCK_POOL_PORTFOLIOS);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  const ranked: RankedPoolPortfolio[] = useMemo(
    () => rankPoolPortfolios(pools, userHoldings),
    [pools, userHoldings],
  );

  const copyPortfolio = useCallback((id: string) => {
    setCopiedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setPools((p) =>
          p.map((pool) =>
            pool.id === id ? { ...pool, copyCount: Math.max(0, pool.copyCount - 1) } : pool,
          ),
        );
      } else {
        next.add(id);
        setPools((p) =>
          p.map((pool) =>
            pool.id === id ? { ...pool, copyCount: pool.copyCount + 1 } : pool,
          ),
        );
      }
      return next;
    });
  }, []);

  const createPool = useCallback((newPool: Omit<PoolPortfolio, "id" | "copyCount" | "createdAt">) => {
    const pool: PoolPortfolio = {
      ...newPool,
      id: `pool-user-${Date.now()}`,
      copyCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPools((prev) => [pool, ...prev]);
  }, []);

  const isCopied = useCallback((id: string) => copiedIds.has(id), [copiedIds]);

  return {
    ranked,
    userHoldings,
    isCopied,
    copyPortfolio,
    createPool,
    userId: CURRENT_USER_ID,
  };
}
