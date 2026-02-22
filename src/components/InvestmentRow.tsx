import { TriangleIcon } from "lucide-react";
import SourceLogo from "@/components/SourceLogo";

interface InvestmentRowProps {
  name: string;
  ticker: string;
  price: string;
  change: number;
  color?: string;
  brand?: string;
  domain?: string;
}

const InvestmentRow = ({ name, ticker, price, change, brand, domain }: InvestmentRowProps) => {
  const logoName = brand || name;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      <SourceLogo name={logoName} domain={domain} fallbackText={ticker} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{ticker}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-foreground">{price}</p>
        <div className="flex items-center justify-end gap-0.5">
          <TriangleIcon
            size={8}
            className={change >= 0 ? "text-positive fill-current" : "text-negative fill-current rotate-180"}
          />
          <span className={`text-xs ${change >= 0 ? "text-positive" : "text-negative"}`}>
            {Math.abs(change).toFixed(2).replace(".", ",")}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvestmentRow;
