import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type MarketState = "panic" | "hype" | "confusion" | "calm";

export interface AppNotification {
  id: string;
  type: "abandoned_podcast";
  title: string;
  body: string;
  cta: string;
  podcastId?: string;
  createdAt: number;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  marketState: MarketState;
  setMarketState: (s: MarketState) => void;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ── Demo: market is in "hype" so notifications trigger ──────────────────
const DEMO_MARKET_STATE: MarketState = "hype";
const PORTFOLIO_SECTION_SEC = 90; // seconds — demo threshold
const ABANDON_DELAY_MS = 5_000; // 5 seconds (demo-friendly)

export { PORTFOLIO_SECTION_SEC, ABANDON_DELAY_MS };

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [marketState, setMarketState] = useState<MarketState>(DEMO_MARKET_STATE);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "createdAt">) => {
    setNotifications((prev) => [
      ...prev,
      { ...n, id: crypto.randomUUID(), createdAt: Date.now() },
    ]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider
      value={{ notifications, marketState, setMarketState, addNotification, removeNotification, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
