import { useEffect, useState } from "react";
import { TrendingUp, Flame } from "lucide-react";
import { getTrends } from "@/lib/api";
import type { TrendingTopic } from "@/data/feedData";

interface TrendingBarProps {
  onTopicPress?: (concept: string) => void;
}

const TrendingBar = ({ onTopicPress }: TrendingBarProps) => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    getTrends().then((r) => setTopics(r.topics));
  }, []);

  if (topics.length === 0) return null;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={14} className="text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Trending now
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onTopicPress?.(topic.concept)}
            className="flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 border transition-colors"
            style={{
              background: topic.is_hot ? "rgba(0,212,168,0.12)" : "rgba(255,255,255,0.04)",
              borderColor: topic.is_hot ? "rgba(0,212,168,0.4)" : "rgba(255,255,255,0.1)",
            }}
          >
            {topic.is_hot && <Flame size={11} style={{ color: "#F59E0B" }} />}
            <span
              className="text-xs font-semibold"
              style={{ color: topic.is_hot ? "#00D4A8" : "rgba(255,255,255,0.8)" }}
            >
              {topic.label}
            </span>
            <span
              className="text-xs"
              style={{
                color:
                  topic.positive === true
                    ? "#4CAF50"
                    : topic.positive === false
                    ? "#EF4444"
                    : "rgba(255,255,255,0.45)",
              }}
            >
              {topic.change}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingBar;
