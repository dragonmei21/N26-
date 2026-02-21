import { useState } from "react";
import { popularStocks } from "@/data/mockData";
import { TriangleIcon } from "lucide-react";

const InvestmentsWidget = () => {
  const [tab, setTab] = useState<"Stocks" | "ETFs" | "Crypto">("Stocks");
  const tabs = ["Stocks", "ETFs", "Crypto"] as const;

  return (
    <div className="mx-4 bg-card rounded-xl border border-border p-5">
      <h3 className="text-xl font-bold text-foreground mb-3">Investments</h3>
      <div className="flex bg-secondary rounded-lg p-1 mb-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t
                ? "bg-card text-primary"
                : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mb-3">Most popular first investments on N26</p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {popularStocks.slice(0, 3).map((stock) => (
          <div key={stock.ticker} className="min-w-[120px] bg-secondary rounded-xl p-3 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full ${stock.color} flex items-center justify-center mb-2`}>
              <span className="text-xs font-bold text-primary-foreground">{stock.ticker.slice(0, 2)}</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{stock.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <TriangleIcon
                size={10}
                className={stock.change >= 0 ? "text-positive fill-current" : "text-negative fill-current rotate-180"}
              />
              <span className={`text-xs font-medium ${stock.change >= 0 ? "text-positive" : "text-negative"}`}>
                {Math.abs(stock.change).toFixed(2).replace(".", ",")}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvestmentsWidget;
