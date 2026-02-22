import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Info, TriangleIcon, Lightbulb, Headphones, FlaskConical } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import SourceLogo from "@/components/SourceLogo";
import TickerInsight from "@/components/TickerInsight";
import MacroTab from "@/components/MacroTab";
import { popularStocks, popularETFs, expertFunds, portfolioCoins } from "@/data/mockData";
import { marketStories } from "@/data/marketStories";
import { portfolioStories } from "@/data/portfolioStories";
import InvestmentRow from "@/components/InvestmentRow";
import StoriesViewer from "@/components/StoriesViewer";
import AudioSummarySheet from "@/components/AudioSummarySheet";
import PortfolioSuggestionsSheet from "@/components/PortfolioSuggestionsSheet";
import { Switch } from "@/components/ui/switch";
import { useLivePrices } from "@/hooks/useLivePrices";

const regions = ["World", "USA", "Europe", "Emerging"];
const timeRanges = ["24h", "1W", "1M", "1Y"];

const GRAPH_DATA: Record<string, { points: string; endY: number }> = {
  "24h": {
    points: "0,70 20,65 40,60 60,72 80,55 100,50 120,58 140,45 160,48 180,40 200,42 220,35 240,38 260,30 280,25 300,20",
    endY: 20
  },
  "1W": {
    points: "0,80 30,70 60,75 90,65 120,50 150,55 180,45 210,35 240,25 270,30 300,15",
    endY: 15
  },
  "1M": {
    points: "0,90 20,85 40,75 60,80 80,60 100,50 120,55 140,40 160,35 180,45 200,30 220,20 240,25 260,15 280,10 300,5",
    endY: 5
  },
  "1Y": {
    points: "0,50 25,60 50,45 75,55 100,40 125,30 150,35 175,20 200,25 225,15 250,20 275,10 300,2",
    endY: 2
  }
};

const Investments = () => {
  const navigate = useNavigate();
  const [topTab, setTopTab] = useState<"Explore" | "Portfolio" | "Macro">("Explore");
  const [tab, setTab] = useState<"Stocks" | "ETFs">("Stocks");
  const [timeRange, setTimeRange] = useState("1W");
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeStorySource, setActiveStorySource] = useState<"market" | "portfolio">("market");
  const [showAudioSheet, setShowAudioSheet] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("aiEnabled") !== "false"; } catch { return true; }
  });
  const toggleAI = (value: boolean) => {
    setAiEnabled(value);
    try { localStorage.setItem("aiEnabled", String(value)); } catch { }
  };
  const data = tab === "Stocks" ? popularStocks : popularETFs;

  // ── Live prices for portfolio coins ──────────────────────────────────────
  // CoinGecko IDs mapped from each coin's ticker
  const COIN_ID_MAP: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SHIB: "shiba-inu",
  };
  const cgIds = portfolioCoins.map((c) => COIN_ID_MAP[c.ticker]).filter(Boolean);
  const { prices: livePrices, loading: pricesLoading } = useLivePrices(cgIds);

  const livePortfolioCoins = useMemo(() => {
    return portfolioCoins.map((coin) => {
      const cgId = COIN_ID_MAP[coin.ticker];
      const live = cgId ? livePrices[cgId] : undefined;
      if (!live) return coin; // fall back to mock while loading

      const eurPrice = live.eur;
      const change24h = live.eur_24h_change;
      // Format price: large numbers → no decimals, small → up to 6 dp
      const formatPrice = (n: number) => {
        if (n >= 1_000) return `€${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (n >= 1) return `€${n.toFixed(4)}`;
        return `€${n.toFixed(8)}`;
      };
      // Derive a realistic "changeAmount" from today's % move
      const changeAmt = Math.abs(eurPrice * change24h / 100);
      const formatAmt = (n: number) => {
        if (n >= 1) return `€${n.toFixed(2)}`;
        return `€${n.toFixed(6)}`;
      };

      return {
        ...coin,
        price: formatPrice(eurPrice),
        change: parseFloat(change24h.toFixed(2)),
        changeAmount: formatAmt(changeAmt),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrices]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-28"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <h1 className="text-3xl font-bold text-foreground">Investments</h1>
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-foreground/70" />
          <div className="w-px h-5 bg-border mx-1" />
          <NotificationBell />
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">PG</span>
          </div>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="flex bg-secondary mx-4 rounded-lg p-1 mb-4">
        {(["Explore", "Portfolio", "Macro"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTopTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${topTab === t ? "bg-card text-primary" : "text-muted-foreground"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {topTab === "Explore" ? (
        /* ---- Explore Tab ---- */
        <>
          {/* Market at a glance - Stories */}
          <div className="px-4 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3">Market at a glance</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {marketStories.map((story, i) => (
                <button
                  key={story.id}
                  onClick={() => {
                    setActiveStorySource("market");
                    setActiveStoryIndex(i);
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-br ${story.ringColor}`}>
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center px-1">
                      <span className="text-[11px] font-bold text-foreground text-center leading-tight break-words">
                        {story.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-center truncate">{story.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Summary button */}
          <div className="px-4 mb-6">
            <button
              onClick={() => setShowAudioSheet(true)}
              className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <Headphones size={16} className="text-foreground/70" />
              Audio summary
            </button>
          </div>

          {/* Expert funds */}
          <div className="px-4 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Funds managed by experts</h3>
            <p className="text-sm text-muted-foreground mb-3">Pick one of three ready-made funds and let trusted experts manage your investments for you.</p>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {expertFunds.map((fund, i) => (
                <div key={fund.name} className={`flex items-center gap-3 p-4 ${i < expertFunds.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">{fund.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{fund.name}</p>
                    <p className="text-xs text-muted-foreground">{fund.returnRate}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Estimated returns are before fees, based on moderate market conditions over a 5 year period and aren't a reliable indicator of future performance.
            </p>
          </div>

          {/* Explore ETFs by region */}
          <div className="px-4 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3">Explore ETFs by region</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {regions.map((r) => (
                <button key={r} className="bg-secondary rounded-full px-4 py-2 text-sm text-foreground whitespace-nowrap shrink-0">
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Most popular */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-foreground">Most popular</h3>
              <button className="text-sm text-primary font-medium">See all</button>
            </div>

            <div className="flex bg-secondary rounded-lg p-1 mb-3">
              {(["Stocks", "ETFs"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? "bg-card text-primary" : "text-muted-foreground"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="bg-card rounded-xl border border-border px-4">
              {data.map((item) => (
                <InvestmentRow
                  key={item.ticker}
                  name={item.name}
                  ticker={item.ticker}
                  price={item.price}
                  change={item.change}
                  color={item.color}
                  brand={"brand" in item ? (item as any).brand : undefined}
                  domain={"domain" in item ? (item as any).domain : undefined}
                />
              ))}
            </div>
          </div>

          {/* Explore by industry */}
          <div className="px-4 mt-6">
            <h3 className="text-lg font-bold text-foreground mb-3">Explore stocks by industry</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {["Technology", "Pharmaceuticals", "Manufacturing"].map((ind) => (
                <button key={ind} className="bg-secondary rounded-full px-4 py-2 text-sm text-foreground whitespace-nowrap shrink-0">
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : topTab === "Portfolio" ? (
        /* ---- Portfolio Tab ---- */
        <div className="px-4">
          {/* Expand Portfolio Toggle */}
          <div className="flex items-center justify-between mb-4 py-2 bg-card rounded-xl border border-border px-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{aiEnabled ? "Expand Portfolio" : "Expand Portfolio"}</p>
              <p className="text-xs text-muted-foreground">News, audio, suggestions & simulations</p>
            </div>
            <Switch checked={aiEnabled} onCheckedChange={toggleAI} />
          </div>

          {/* Portfolio value */}
          <div className="mb-2">
            <p className="text-sm text-muted-foreground mb-1">Your portfolio</p>
            <p className="text-4xl font-bold text-foreground">€926.26</p>
            <div className="flex items-center gap-1 mt-1">
              <TriangleIcon size={12} className="text-positive fill-current" />
              <span className="text-sm text-positive font-medium">€123.40 · 15.37%</span>
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="h-40 my-4 flex items-end">
            <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
              <motion.polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                initial={{ points: GRAPH_DATA["1W"].points }}
                animate={{ points: GRAPH_DATA[timeRange].points }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
              <motion.circle
                cx="300"
                fill="hsl(var(--primary))"
                r="4"
                initial={{ cy: GRAPH_DATA["1W"].endY }}
                animate={{ cy: GRAPH_DATA[timeRange].endY }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </svg>
          </div>

          {/* Time range selector */}
          <div className="flex bg-secondary rounded-lg p-1 mb-6">
            {timeRanges.map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${timeRange === t ? "bg-card text-primary" : "text-muted-foreground"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Your coins */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-lg font-bold text-foreground">Your coins</h3>
              <Info size={14} className="text-muted-foreground" />
              {pricesLoading && (
                <span className="text-[10px] text-muted-foreground animate-pulse ml-1">Fetching live prices…</span>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border px-4">
              {livePortfolioCoins.map((coin, i) => (
                <div key={coin.ticker} className={`py-3 ${i < livePortfolioCoins.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex items-center gap-3">
                    <SourceLogo name={coin.name} domain={coin.domain} fallbackText={coin.ticker} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{coin.name}</p>
                      <p className="text-xs text-muted-foreground">{coin.ticker}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">{coin.price}</p>
                      <div className="flex items-center justify-end gap-0.5">
                        <TriangleIcon
                          size={8}
                          className={coin.change >= 0 ? "text-positive fill-current" : "text-negative fill-current rotate-180"}
                        />
                        <span className={`text-xs ${coin.change >= 0 ? "text-positive" : "text-negative"}`}>
                          {coin.changeAmount} · {Math.abs(coin.change).toFixed(2).replace(".", ",")}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {aiEnabled && (
                    <TickerInsight
                      key={`${coin.ticker}-${timeRange}`}
                      ticker={coin.ticker}
                      timeRange={timeRange}
                      change={coin.change}
                      className="mt-1.5 pl-[52px]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Buy / Sell buttons */}
          <div className="flex gap-3 mt-4">
            <button className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold">
              Buy
            </button>
            <button className="flex-1 bg-secondary text-foreground py-3 rounded-xl text-sm font-semibold">
              Sell
            </button>
          </div>

          {/* Scenarios + Suggestions buttons (AI-gated) */}
          {aiEnabled && (
            <>
              <button
                onClick={() => navigate("/scenarios")}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <FlaskConical size={16} className="text-foreground/70" />
                Scenarios
              </button>
              <button
                onClick={() => setShowSuggestions(true)}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <Lightbulb size={16} className="text-primary" />
                Suggestions
              </button>
            </>
          )}

        </div>
      ) : (
        /* ---- Macro Tab ---- */
        <MacroTab />
      )}

      {/* Stories Viewer */}
      {activeStoryIndex !== null && (
        <StoriesViewer
          stories={activeStorySource === "market" ? marketStories : portfolioStories}
          initialStoryIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* Audio Summary Sheet - Explore */}
      {aiEnabled && showAudioSheet && (
        <AudioSummarySheet
          stories={marketStories}
          onClose={() => setShowAudioSheet(false)}
        />
      )}

      {/* Portfolio Suggestions Sheet */}
      {aiEnabled && showSuggestions && (
        <PortfolioSuggestionsSheet onClose={() => setShowSuggestions(false)} />
      )}
    </motion.div>
  );
};

export default Investments;
