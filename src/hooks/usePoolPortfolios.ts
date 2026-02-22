import { useState, useMemo, useCallback } from "react";
import type { Holding, PoolPortfolio, RankedPoolPortfolio, CopyAllocation } from "@/types/poolPortfolio";
import { MOCK_POOL_PORTFOLIOS } from "@/mocks/poolPortfolios";
import { rankPoolPortfolios, computeCopyAllocation } from "@/utils/portfolioSimilarity";

const COPIED_KEY = "pool_copied_portfolios";

function loadCopied(): string[] {
  try {
    const raw = localStorage.getItem(COPIED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCopied(ids: string[]): void {
  try { localStorage.setItem(COPIED_KEY, JSON.stringify(ids)); } catch {}
}

export interface UsePoolPortfoliosReturn {
  rankedPortfolios: RankedPoolPortfolio[];
  copiedIds: string[];
  isLoading: boolean;
  toggleCopy: (portfolioId: string) => void;
  previewAllocation: (portfolioId: string, amountEUR: number) => CopyAllocation;
  createPortfolio: (draft: Omit<PoolPortfolio, "id" | "createdAt" | "copyCount">) => void;
}

export function usePoolPortfolios(userHoldings: Holding[]): UsePoolPortfoliosReturn {
  const [pools, setPools]       = useState<PoolPortfolio[]>(MOCK_POOL_PORTFOLIOS);
  const [copiedIds, setCopiedIds] = useState<string[]>(() => loadCopied());
  const [isLoading]             = useState(false);

  const rankedPortfolios = useMemo<RankedPoolPortfolio[]>(
    () => rankPoolPortfolios(userHoldings, pools),
    [userHoldings, pools]
  );

  const toggleCopy = useCallback((portfolioId: string) => {
    const isCopied = copiedIds.includes(portfolioId);

    setCopiedIds((prev) => {
      const next = isCopied ? prev.filter((id) => id !== portfolioId) : [...prev, portfolioId];
      saveCopied(next);
      return next;
    });

    setPools((prev) =>
      prev.map((p) =>
        p.id === portfolioId
          ? { ...p, copyCount: isCopied ? Math.max(0, p.copyCount - 1) : p.copyCount + 1 }
          : p
      )
    );
  }, [copiedIds]);

  const previewAllocation = useCallback(
    (portfolioId: string, amountEUR: number): CopyAllocation => {
      const pool = pools.find((p) => p.id === portfolioId);
      if (!pool) throw new Error(`Portfolio ${portfolioId} not found.`);
      return computeCopyAllocation(pool, amountEUR);
    },
    [pools]
  );

  const createPortfolio = useCallback(
    (draft: Omit<PoolPortfolio, "id" | "createdAt" | "copyCount">) => {
      const newPool: PoolPortfolio = {
        ...draft,
        id:        `pp-user-${Date.now()}`,
        copyCount: 0,
        createdAt: new Date().toISOString(),
      };
      setPools((prev) => [newPool, ...prev]);
    },
    []
  );

  return { rankedPortfolios, copiedIds, isLoading, toggleCopy, previewAllocation, createPortfolio };
}
