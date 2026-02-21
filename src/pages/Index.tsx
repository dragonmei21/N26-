import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Pen } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BalanceCard from "@/components/BalanceCard";
import QuickActions from "@/components/QuickActions";
import OnboardingCard from "@/components/OnboardingCard";
import InvestmentsWidget from "@/components/InvestmentsWidget";
import TrendingBar from "@/components/TrendingBar";
import DailyTipCard from "@/components/DailyTipCard";
import ELI10Modal from "@/components/ELI10Modal";
import VisualizationRenderer from "@/components/VisualizationRenderer";
import { getFeed } from "@/lib/api";
import type { FeedResponse, Article } from "@/data/feedData";

const AccountIcons = () => (
  <div className="flex gap-3 px-4 py-2 overflow-x-auto scrollbar-hide">
    {["💳", "🏠", "🐷", "💎", "📊", "⏰", "🎯"].map((emoji, i) => (
      <div
        key={i}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
          i === 0 ? "bg-primary/20 border-2 border-primary" : "bg-secondary"
        }`}
      >
        <span className="text-xl">{emoji}</span>
      </div>
    ))}
  </div>
);

// Article card for the news feed
const ArticleCard = ({
  article,
  onELI10,
}: {
  article: Article;
  onELI10: (concept: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  const categoryToELI10: Record<string, string> = {
    Commodities: "gold",
    Technology: "nvidia",
    Macro: "inflation",
    Crypto: "bitcoin",
    Equities: "sp500",
    "Personal Insight": "inflation",
  };

  const concept = categoryToELI10[article.category] ?? article.category.toLowerCase();

  return (
    <motion.div
      layout
      className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <button className="w-full text-left" onClick={() => setExpanded((e) => !e)}>
        {/* Visualization first */}
        <div className="p-3 pb-0">
          <VisualizationRenderer viz={article.visualization} />
        </div>

        {/* Source + timestamp */}
        <div className="flex items-center justify-between px-3 pt-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,212,168,0.12)", color: "#00D4A8" }}
            >
              {article.category}
            </span>
            <span className="text-xs text-muted-foreground">{article.source}</span>
          </div>
          <span className="text-xs text-muted-foreground">{article.timestamp}</span>
        </div>

        {/* Headline */}
        <div className="px-3 pt-2 pb-3">
          <p className="text-sm font-bold text-foreground leading-snug">{article.headline}</p>
          {expanded && (
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{article.summary}</p>
          )}
        </div>
      </button>

      {/* ELI10 button */}
      <div
        className="flex items-center gap-3 px-3 pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onELI10(concept)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(0,212,168,0.1)",
            border: "1px solid rgba(0,212,168,0.25)",
            color: "#00D4A8",
          }}
        >
          💡 ELI10
        </button>
        <span className="text-xs text-muted-foreground">
          {expanded ? "Tap card to collapse" : "Tap card for summary"}
        </span>
      </div>
    </motion.div>
  );
};

// Skeleton loader for articles
const ArticleSkeleton = () => (
  <div className="mx-4 mb-3 rounded-2xl overflow-hidden animate-pulse" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
    <div className="m-3 h-28 rounded-xl bg-secondary" />
    <div className="px-3 pb-3 space-y-2">
      <div className="h-3 bg-secondary rounded-full w-24" />
      <div className="h-4 bg-secondary rounded-full w-full" />
      <div className="h-4 bg-secondary rounded-full w-3/4" />
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [eli10Concept, setELI10Concept] = useState<string | null>(null);

  useEffect(() => {
    getFeed("mock_user_1").then((res) => {
      setFeed(res);
      setLoadingFeed(false);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-28"
    >
      <PageHeader title="Home" />
      <AccountIcons />
      <div className="mt-2" />
      <BalanceCard />
      <QuickActions />

      {/* Spend Map CTA — the flagship feature */}
      <div className="px-4 mt-4 mb-2">
        <button
          onClick={() => navigate("/spend-map")}
          className="w-full flex items-center gap-3 rounded-2xl p-4 transition-opacity active:opacity-70"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,168,0.18) 0%, rgba(0,212,168,0.06) 100%)",
            border: "1px solid rgba(0,212,168,0.35)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,212,168,0.2)" }}
          >
            <MapPin size={20} style={{ color: "#00D4A8" }} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-foreground">Spend → Invest Map</p>
            <p className="text-xs text-muted-foreground">See what stocks your spending reveals</p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(0,212,168,0.2)", color: "#00D4A8" }}>
            New
          </span>
        </button>
      </div>

      {/* Daily Tip */}
      {feed?.daily_tip && <DailyTipCard tip={feed.daily_tip} />}

      {/* Trending Topics */}
      <TrendingBar onTopicPress={(concept) => setELI10Concept(concept)} />

      <OnboardingCard />
      <div className="mt-4" />
      <InvestmentsWidget />

      {/* News Feed */}
      <div className="mt-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-lg font-bold text-foreground">Your news feed</h3>
          <span className="text-xs text-muted-foreground">Personalised · mock_user_1</span>
        </div>

        {loadingFeed ? (
          <>
            <ArticleSkeleton />
            <ArticleSkeleton />
          </>
        ) : (
          feed?.articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onELI10={(concept) => setELI10Concept(concept)}
            />
          ))
        )}
      </div>

      <div className="flex justify-center mt-6 mb-4">
        <button className="flex items-center gap-2 border border-border rounded-full px-5 py-2.5">
          <span className="text-sm text-foreground">Customize</span>
          <Pen size={14} className="text-foreground" />
        </button>
      </div>

      {/* ELI10 Modal */}
      {eli10Concept && (
        <ELI10Modal
          concept={eli10Concept}
          onClose={() => setELI10Concept(null)}
        />
      )}
    </motion.div>
  );
};

export default Home;
