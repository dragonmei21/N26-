import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { useState } from "react";
import type { DailyTip } from "@/data/feedData";

interface DailyTipCardProps {
  tip: DailyTip;
}

const DailyTipCard = ({ tip }: DailyTipCardProps) => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <div className="mx-4 mb-4 rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(0,212,168,0.3)", background: "rgba(0,212,168,0.08)" }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl shrink-0 mt-0.5">{tip.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#00D4A8" }}>
                Daily Insight
              </p>
              <p className="text-sm text-foreground leading-snug">{tip.text}</p>
              {tip.action && (
                <button
                  onClick={() => navigate(tip.action!.route)}
                  className="flex items-center gap-1 mt-2 text-xs font-semibold"
                  style={{ color: "#00D4A8" }}
                >
                  {tip.action.label}
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyTipCard;
