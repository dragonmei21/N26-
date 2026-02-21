import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TriangleIcon, RotateCcw, Info, History, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { portfolioCoins } from "@/data/mockData";
import { historicalScenarios, type HistoricalScenario } from "@/lib/scenarios/historicalScenarios";

interface Factor {
  id: string;
  label: string;
  emoji: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  sensitivity: Record<string, number>;
}

const factors: Factor[] = [
  {
    id: "inflation",
    label: "Inflation rate",
    emoji: "📊",
    unit: "%",
    min: -2,
    max: 10,
    step: 0.5,
    defaultValue: 2.4,
    sensitivity: { ETH: -1.2, BTC: -0.8, SHIB: -2.5 },
  },
  {
    id: "interest_rate",
    label: "Interest rate",
    emoji: "🏛️",
    unit: "%",
    min: 0,
    max: 8,
    step: 0.25,
    defaultValue: 2.75,
    sensitivity: { ETH: -1.5, BTC: -1.0, SHIB: -3.0 },
  },
  {
    id: "gold",
    label: "Gold price",
    emoji: "🥇",
    unit: "%",
    min: -30,
    max: 30,
    step: 1,
    defaultValue: 0,
    sensitivity: { ETH: -0.3, BTC: 0.1, SHIB: -0.5 },
  },
  {
    id: "oil",
    label: "Oil price",
    emoji: "🛢️",
    unit: "%",
    min: -40,
    max: 40,
    step: 1,
    defaultValue: 0,
    sensitivity: { ETH: -0.2, BTC: -0.15, SHIB: -0.4 },
  },
  {
    id: "usd",
    label: "USD strength (DXY)",
    emoji: "💵",
    unit: "%",
    min: -15,
    max: 15,
    step: 0.5,
    defaultValue: 0,
    sensitivity: { ETH: -0.9, BTC: -0.7, SHIB: -1.8 },
  },
  {
    id: "sp500",
    label: "S&P 500",
    emoji: "📈",
    unit: "%",
    min: -30,
    max: 30,
    step: 1,
    defaultValue: 0,
    sensitivity: { ETH: 0.6, BTC: 0.4, SHIB: 1.2 },
  },
];

const parsePrice = (p: string) => {
  // Prices can be "€477.88" or "€477,88" or "160,96 €"
  const cleaned = p.replace("€", "").trim();
  // If contains both . and , → . is thousands, , is decimal (European)
  if (cleaned.includes(".") && cleaned.includes(",")) {
    return parseFloat(cleaned.replace(".", "").replace(",", "."));
  }
  // If only , → it's a decimal separator
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    return parseFloat(cleaned.replace(",", "."));
  }
  return parseFloat(cleaned);
};

const formatPrice = (v: number) => `€${v.toFixed(2).replace(".", ",")}`;

const severityColors: Record<string, string> = {
  Low: "bg-primary/20 text-primary",
  Medium: "bg-warning/20 text-warning",
  High: "bg-destructive/20 text-destructive",
};

const Scenarios = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"Custom" | "Historical">("Custom");
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(factors.map((f) => [f.id, f.defaultValue]))
  );
  const [activeHistorical, setActiveHistorical] = useState<HistoricalScenario | null>(null);

  const handleChange = (id: string, val: number) => {
    setValues((prev) => ({ ...prev, [id]: val }));
    setActiveHistorical(null);
  };

  const resetAll = () => {
    setValues(Object.fromEntries(factors.map((f) => [f.id, f.defaultValue])));
    setActiveHistorical(null);
  };

  const applyHistorical = (scenario: HistoricalScenario) => {
    setActiveHistorical(scenario);
    setValues(scenario.sliderPreset);
    setMode("Custom"); // switch to Custom to show sliders with preset values
  };

  const simulatedPortfolio = useMemo(() => {
    return portfolioCoins.map((coin) => {
      let changePct: number;

      if (activeHistorical && activeHistorical.impactOverrides[coin.ticker] !== undefined) {
        changePct = activeHistorical.impactOverrides[coin.ticker];
      } else {
        changePct = 0;
        factors.forEach((f) => {
          const delta = values[f.id] - f.defaultValue;
          const sens = f.sensitivity[coin.ticker] ?? 0;
          changePct += delta * sens;
        });
      }

      const basePrice = parsePrice(coin.price);
      const newPrice = basePrice * (1 + changePct / 100);
      const priceDiff = newPrice - basePrice;
      return {
        ...coin,
        simPrice: formatPrice(newPrice),
        simChange: changePct,
        simDiff: formatPrice(Math.abs(priceDiff)),
        isUp: priceDiff >= 0,
      };
    });
  }, [values, activeHistorical]);

  const baseTotal = portfolioCoins.reduce((s, c) => s + parsePrice(c.price), 0);
  const simTotal = simulatedPortfolio.reduce((s, c) => s + parsePrice(c.simPrice), 0);
  const totalDiff = simTotal - baseTotal;
  const totalPct = baseTotal > 0 ? ((simTotal - baseTotal) / baseTotal) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-28"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate("/investments")} className="text-foreground">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1">Scenarios</h1>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 text-sm text-primary font-medium"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-secondary mx-4 rounded-lg p-1 mb-4">
        {(["Custom", "Historical"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMode(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === t ? "bg-card text-primary" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Portfolio impact summary */}
      <div className="mx-4 bg-card rounded-xl border border-border p-4 mb-5">
        <p className="text-sm text-muted-foreground mb-1">
          {activeHistorical ? `Simulated: ${activeHistorical.title}` : "Simulated portfolio value"}
        </p>
        <p className="text-3xl font-bold text-foreground">{formatPrice(simTotal)}</p>
        <div className="flex items-center gap-1 mt-1">
          <TriangleIcon
            size={12}
            className={totalDiff >= 0 ? "text-positive fill-current" : "text-negative fill-current rotate-180"}
          />
          <span className={`text-sm font-medium ${totalDiff >= 0 ? "text-positive" : "text-negative"}`}>
            {totalDiff >= 0 ? "+" : "-"}
            {formatPrice(Math.abs(totalDiff))} · {totalPct >= 0 ? "+" : ""}
            {totalPct.toFixed(2).replace(".", ",")}%
          </span>
        </div>
        {activeHistorical && (
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <AlertTriangle size={10} />
            Educational only — not financial advice. Historical replay.
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {mode === "Custom" ? (
          <motion.div
            key="custom"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Factor sliders */}
            <div className="px-4 mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-base font-bold text-foreground">Macro factors</h3>
                <Info size={14} className="text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {factors.map((f) => {
                  const isChanged = values[f.id] !== f.defaultValue;
                  return (
                    <div
                      key={f.id}
                      className={`bg-card rounded-xl border p-4 transition-colors ${
                        isChanged ? "border-primary/40" : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{f.emoji}</span>
                          <span className="text-sm font-medium text-foreground">{f.label}</span>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            isChanged ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {f.id === "inflation" || f.id === "interest_rate"
                            ? `${values[f.id].toFixed(f.step < 1 ? 2 : 0).replace(".", ",")}${f.unit}`
                            : `${values[f.id] >= 0 ? "+" : ""}${values[f.id].toFixed(f.step < 1 ? 1 : 0).replace(".", ",")}${f.unit}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={values[f.id]}
                        onChange={(e) => handleChange(f.id, parseFloat(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>
                          {f.min}
                          {f.unit}
                        </span>
                        <span>
                          {f.max}
                          {f.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="historical"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Historical scenario cards */}
            <div className="px-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <History size={16} className="text-primary" />
                <h3 className="text-base font-bold text-foreground">Historical scenarios</h3>
              </div>
              <div className="space-y-3">
                {historicalScenarios.map((scenario) => (
                  <motion.div
                    key={scenario.id}
                    className={`bg-card rounded-xl border p-4 transition-colors ${
                      activeHistorical?.id === scenario.id ? "border-primary/50" : "border-border"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground">{scenario.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {scenario.startDate} – {scenario.endDate}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          severityColors[scenario.severity]
                        }`}
                      >
                        {scenario.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {scenario.description}
                    </p>
                    <button
                      onClick={() => applyHistorical(scenario)}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                        activeHistorical?.id === scenario.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {activeHistorical?.id === scenario.id ? "✓ Applied" : "Simulate"}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated coin breakdown */}
      <div className="px-4">
        <h3 className="text-base font-bold text-foreground mb-3">Impact on holdings</h3>
        <div className="bg-card rounded-xl border border-border px-4">
          {simulatedPortfolio.map((coin, i) => (
            <div
              key={coin.ticker}
              className={`flex items-center gap-3 py-3 ${
                i < simulatedPortfolio.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full ${coin.color} flex items-center justify-center shrink-0`}
              >
                <span className="text-sm">{coin.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{coin.name}</p>
                <p className="text-xs text-muted-foreground">{coin.ticker}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{coin.simPrice}</p>
                <div className="flex items-center justify-end gap-0.5">
                  <TriangleIcon
                    size={8}
                    className={
                      coin.isUp
                        ? "text-positive fill-current"
                        : "text-negative fill-current rotate-180"
                    }
                  />
                  <span className={`text-xs ${coin.isUp ? "text-positive" : "text-negative"}`}>
                    {coin.isUp ? "+" : "-"}
                    {coin.simDiff} · {coin.simChange >= 0 ? "+" : ""}
                    {coin.simChange.toFixed(2).replace(".", ",")}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Scenarios;
