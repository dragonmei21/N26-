import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  getSpendSnapshot,
  type MacroEvent,
  type CausalChainResponse,
  type PricedCausalStep,
  type EventCategory,
} from "@/lib/macroReasoningEngine";
import { fetchFeedEvents, fetchCausalChain } from "@/lib/api";

// ── Category pill ──────────────────────────────────────

const categoryColors: Record<EventCategory, string> = {
  tech: "bg-violet-500/20 text-violet-400",
  macro: "bg-blue-500/20 text-blue-400",
  geo: "bg-red-500/20 text-red-400",
  regulatory: "bg-amber-500/20 text-amber-400",
  earnings: "bg-emerald-500/20 text-emerald-400",
};

const CategoryPill = ({ category }: { category: EventCategory }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryColors[category]}`}>
    {category}
  </span>
);

// ── Confidence badge ───────────────────────────────────

const confidenceStyles = {
  high: "bg-emerald-500/20 text-emerald-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-red-500/20 text-red-400",
};

const ConfidenceBadge = ({ level }: { level: "high" | "medium" | "low" }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${confidenceStyles[level]}`}>
    {level}
  </span>
);

// ── Direction icon ─────────────────────────────────────

const DirectionIcon = ({ dir }: { dir: "up" | "down" | "neutral" }) => {
  if (dir === "up") return <TrendingUp size={14} className="text-positive" />;
  if (dir === "down") return <TrendingDown size={14} className="text-negative" />;
  return <Minus size={14} className="text-muted-foreground" />;
};

// ── Timeline chart ─────────────────────────────────────

const TimelineWithEventChart = ({ step }: { step: PricedCausalStep }) => {
  if (!step.price_data) {
    return (
      <div className="bg-secondary rounded-xl p-4 flex items-center justify-center h-32">
        <p className="text-sm text-muted-foreground">Price data unavailable</p>
      </div>
    );
  }

  const { data, event_label } = step.price_data;
  const chartData = data.labels.map((label, i) => ({
    date: label,
    price: data.values[i],
  }));
  const eventDate = data.labels[data.event_index];

  return (
    <div className="bg-secondary rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-foreground">{step.price_data.title}</p>
        {step.price_change_pct !== null && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              step.price_change_pct >= 0
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {step.price_change_pct >= 0 ? "+" : ""}
            {step.price_change_pct.toFixed(1)}%
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }}
            axisLine={false}
            tickLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(155 8% 12%)",
              border: "1px solid hsl(155 5% 18%)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(0 0% 95%)",
            }}
            formatter={(value: number) => [`€${value.toFixed(2)}`, "Price"]}
          />
          <ReferenceLine
            x={eventDate}
            stroke="hsl(168 80% 45%)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: event_label,
              position: "top",
              fontSize: 9,
              fill: "hsl(168 80% 45%)",
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(168 80% 45%)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "hsl(168 80% 45%)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Event Card ─────────────────────────────────────────

const EventCard = ({
  event,
  onTrace,
}: {
  event: MacroEvent;
  onTrace: () => void;
}) => (
  <div className="bg-card rounded-xl border border-border p-4 mb-3">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{event.emoji}</span>
        <CategoryPill category={event.category} />
      </div>
      <span className="text-xs text-muted-foreground">{event.date}</span>
    </div>
    <h4 className="text-sm font-bold text-foreground mb-1">{event.title}</h4>
    <p className="text-xs text-muted-foreground mb-3">Source: {event.source}</p>
    <button
      onClick={onTrace}
      className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
    >
      <Zap size={13} />
      Trace impact
    </button>
  </div>
);

// ── Causal Step Accordion ──────────────────────────────

const CausalStepItem = ({
  step,
  eli10,
  isOpen,
  onToggle,
}: {
  step: PricedCausalStep;
  eli10: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className="bg-card rounded-xl border border-border overflow-hidden mb-2">
    <button onClick={onToggle} className="w-full flex items-center gap-3 p-4">
      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{step.step_number}</span>
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <DirectionIcon dir={step.direction} />
          <span className="text-sm font-semibold text-foreground truncate">{step.affected_entity}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ConfidenceBadge level={step.confidence} />
          {step.ticker && (
            <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono font-semibold text-foreground">
              {step.ticker}
            </span>
          )}
          {step.confidence === "low" && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
              <AlertTriangle size={10} /> Speculative
            </span>
          )}
        </div>
      </div>
      {isOpen ? (
        <ChevronUp size={16} className="text-muted-foreground shrink-0" />
      ) : (
        <ChevronDown size={16} className="text-muted-foreground shrink-0" />
      )}
    </button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-foreground/80 leading-relaxed">
              {eli10 ? step.plain_english_eli10 : step.plain_english}
            </p>
            <div className="bg-secondary rounded-lg p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mechanism</p>
              <p className="text-xs text-foreground/70">{step.mechanism}</p>
            </div>
            {step.ticker && <TimelineWithEventChart step={step} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ── Why This Matters Card ──────────────────────────────

const WhyThisMattersCard = ({
  chain,
  eli10,
}: {
  chain: CausalChainResponse;
  eli10: boolean;
}) => {
  const spendSnapshot = useMemo(() => getSpendSnapshot(), []);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart size={16} className="text-primary" />
        <h4 className="text-sm font-bold text-foreground">Why this matters to you</h4>
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed mb-3">
        {eli10 ? chain.user_connection_eli10 : chain.user_connection}
      </p>

      {spendSnapshot.length > 0 && (
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Spend snapshot (last month)
          </p>
          {spendSnapshot.map((s) => (
            <div key={s.merchant} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-foreground">{s.merchant}</span>
              <div className="flex items-center gap-2">
                {s.ticker && (
                  <span className="px-1.5 py-0.5 rounded bg-card text-[10px] font-mono font-semibold text-foreground">
                    {s.ticker}
                  </span>
                )}
                <span className="text-xs font-medium text-foreground">€{s.totalSpent.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Relevance score:</span>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${chain.user_relevance_score * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-foreground">
          {(chain.user_relevance_score * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// ── Main MacroTab component ────────────────────────────

const MacroTab = () => {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [chain, setChain] = useState<CausalChainResponse | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState(false);

  const [eli10, setEli10] = useState(false);
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]));

  // Load events from backend on mount
  useEffect(() => {
    fetchFeedEvents(8)
      .then((data) => {
        setEvents(data);
        setEventsLoading(false);
      })
      .catch(() => {
        setEventsError(true);
        setEventsLoading(false);
      });
  }, []);

  // Fetch causal chain when an event is selected
  const handleTrace = async (articleId: string) => {
    setSelectedEvent(articleId);
    setChain(null);
    setChainError(false);
    setChainLoading(true);
    setOpenSteps(new Set([1]));

    try {
      const data = await fetchCausalChain(articleId);
      setChain(data);
    } catch {
      setChainError(true);
    } finally {
      setChainLoading(false);
    }
  };

  const toggleStep = (n: number) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const hasLowConfidenceOnly = chain?.chain.every((s) => s.confidence === "low");

  // ── Detail View ──
  if (selectedEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-4"
      >
        {/* Back + controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setSelectedEvent(null);
              setChain(null);
              setOpenSteps(new Set([1]));
            }}
            className="flex items-center gap-1.5 text-sm text-primary font-medium"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {chain && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">ELI10</span>
              <Switch checked={eli10} onCheckedChange={setEli10} />
            </div>
          )}
        </div>

        {/* Loading state */}
        {chainLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Tracing macro impact…</p>
          </div>
        )}

        {/* Error state */}
        {chainError && !chainLoading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-sm text-red-400 mb-2">Could not generate causal chain.</p>
            <button
              onClick={() => handleTrace(selectedEvent)}
              className="text-xs text-primary font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Chain content */}
        {chain && !chainLoading && (
          <>
            {/* Event summary */}
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <h3 className="text-base font-bold text-foreground mb-2">{chain.trigger_event}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {chain.trigger_date} · {chain.trigger_source_url}
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {eli10 ? chain.summary_eli10 : chain.summary}
              </p>
            </div>

            {/* Speculative warning */}
            {hasLowConfidenceOnly && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">
                  All links in this chain are speculative. Treat with extra caution.
                </p>
              </div>
            )}

            {/* Causal Chain */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Zap size={14} className="text-primary" />
                Causal Chain
              </h4>
              <div className="relative">
                <div className="absolute left-[17px] top-4 bottom-4 w-px bg-border" />
                <div className="space-y-0">
                  {chain.chain.map((step) => (
                    <CausalStepItem
                      key={step.step_number}
                      step={step}
                      eli10={eli10}
                      isOpen={openSteps.has(step.step_number)}
                      onToggle={() => toggleStep(step.step_number)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Why this matters */}
            <div className="mb-4">
              <WhyThisMattersCard chain={chain} eli10={eli10} />
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground text-center pb-4 leading-relaxed">
              {chain.disclaimer}
            </p>
          </>
        )}
      </motion.div>
    );
  }

  // ── Events List View ──
  return (
    <div className="px-4">
      {/* Header card */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            Macro Reasoning Engine
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Live</span>
          </div>
        </div>
        <p className="text-xs text-foreground/70 mb-1">
          See how big news ripples into stocks and your life.
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          Educational only — not financial advice.
        </p>
      </div>

      {/* Today's Events */}
      <h4 className="text-sm font-bold text-foreground mb-3">Today's Events</h4>

      {/* Loading */}
      {eventsLoading && (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 size={22} className="text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Loading today's events…</span>
        </div>
      )}

      {/* Error */}
      {eventsError && !eventsLoading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-sm text-red-400">Could not load events. Is the backend running?</p>
        </div>
      )}

      {/* Event list */}
      {!eventsLoading && !eventsError && events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onTrace={() => handleTrace(event.id)}
        />
      ))}

      {/* Empty state */}
      {!eventsLoading && !eventsError && events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No events found.</p>
        </div>
      )}
    </div>
  );
};

export default MacroTab;
