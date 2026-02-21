import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { Visualization } from "@/data/feedData";

// ── Shared styles ──────────────────────────────────────────────────────────

const TEAL = "#00D4A8";
const AMBER = "#F59E0B";
const NEGATIVE = "#EF4444";
const POSITIVE = "#4CAF50";
const MUTED = "rgba(255,255,255,0.25)";

const CardShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl border border-border p-4 w-full">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
    {children}
  </div>
);

// ── LineChartCard ──────────────────────────────────────────────────────────

export function LineChartCard({ data }: { data: Visualization }) {
  const points = data.data ?? [];
  const min = Math.min(...points.map((p) => p.value)) * 0.97;
  const max = Math.max(...points.map((p) => p.value)) * 1.03;
  const isPositive = points.length > 1 && points[points.length - 1].value >= points[0].value;

  return (
    <CardShell title={data.title}>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: MUTED }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis domain={[min, max]} hide />
          <Tooltip
            contentStyle={{ background: "#1e2d2a", border: "none", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#fff" }}
            formatter={(v: number) => [`${data.unit ?? ""}${v.toLocaleString()}`, ""]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={isPositive ? TEAL : NEGATIVE}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: isPositive ? TEAL : NEGATIVE }}
          />
        </LineChart>
      </ResponsiveContainer>
      {data.unit && (
        <p className="text-xs text-muted-foreground mt-1 text-right">{data.unit}</p>
      )}
    </CardShell>
  );
}

// ── ComparisonBarCard ──────────────────────────────────────────────────────

export function ComparisonBarCard({ data }: { data: Visualization }) {
  const points = data.data ?? [];

  return (
    <CardShell title={data.title}>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: MUTED }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "#1e2d2a", border: "none", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`${data.unit ?? ""}${v}`, ""]}
          />
          <Bar dataKey="value" fill={TEAL} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </CardShell>
  );
}

// ── SparklineCard ──────────────────────────────────────────────────────────

export function SparklineCard({ data }: { data: Visualization }) {
  const points = data.data ?? [];
  const first = points[0]?.value ?? 0;
  const last = points[points.length - 1]?.value ?? 0;
  const isDown = last < first;
  const pctChange = first ? (((last - first) / first) * 100).toFixed(1) : "0";

  return (
    <CardShell title={data.title}>
      <div className="flex items-end justify-between mb-2">
        <span
          className="text-2xl font-bold"
          style={{ color: isDown ? NEGATIVE : POSITIVE }}
        >
          {last}{data.unit ?? "%"}
        </span>
        <span
          className="text-sm font-medium px-2 py-0.5 rounded-full"
          style={{
            background: isDown ? "rgba(239,68,68,0.15)" : "rgba(76,175,80,0.15)",
            color: isDown ? NEGATIVE : POSITIVE,
          }}
        >
          {isDown ? "" : "+"}{pctChange}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={isDown ? NEGATIVE : TEAL}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </CardShell>
  );
}

// ── SpendDonutCard ──────────────────────────────────────────────────────────

export function SpendDonutCard({ data }: { data: Visualization }) {
  const segments = data.segments ?? [];
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <CardShell title={data.title}>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <PieChart width={100} height={100}>
            <Pie
              data={segments}
              cx={45}
              cy={45}
              innerRadius={30}
              outerRadius={46}
              dataKey="value"
              strokeWidth={0}
            >
              {segments.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">€{(total / 1000).toFixed(1)}k</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-muted-foreground flex-1 truncate">{s.label}</span>
              <span className="text-xs font-semibold text-foreground">
                {((s.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

// ── HorizontalBarCard ──────────────────────────────────────────────────────

export function HorizontalBarCard({ data }: { data: Visualization }) {
  const points = data.data ?? [];
  const max = Math.max(...points.map((p) => Math.abs(p.value)));

  return (
    <CardShell title={data.title}>
      <div className="space-y-2">
        {points.map((p) => {
          const isNeg = p.value < 0;
          const width = `${(Math.abs(p.value) / max) * 100}%`;
          return (
            <div key={p.label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0 truncate">{p.label}</span>
              <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width,
                    background: isNeg ? NEGATIVE : TEAL,
                  }}
                />
              </div>
              <span
                className="text-xs font-semibold w-10 text-right shrink-0"
                style={{ color: isNeg ? NEGATIVE : POSITIVE }}
              >
                {isNeg ? "" : "+"}{p.value}%
              </span>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────

export function StatCard({ data }: { data: Visualization }) {
  const stat = data.stat;
  if (!stat) return null;
  const isPos = stat.changePositive !== false;

  return (
    <CardShell title={data.title}>
      <p
        className="text-4xl font-bold tracking-tight"
        style={{ color: isPos ? TEAL : NEGATIVE }}
      >
        {stat.value}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
      {stat.change && (
        <p
          className="text-sm font-semibold mt-2"
          style={{ color: isPos ? POSITIVE : NEGATIVE }}
        >
          {isPos ? "▲" : "▼"} {stat.change}
        </p>
      )}
    </CardShell>
  );
}

// ── VisualizationRenderer ──────────────────────────────────────────────────

export default function VisualizationRenderer({ viz }: { viz: Visualization }) {
  switch (viz.type) {
    case "line_chart":       return <LineChartCard data={viz} />;
    case "comparison_bar":   return <ComparisonBarCard data={viz} />;
    case "sparkline":        return <SparklineCard data={viz} />;
    case "donut_with_arrow": return <SpendDonutCard data={viz} />;
    case "horizontal_bar":   return <HorizontalBarCard data={viz} />;
    case "simple_number":    return <StatCard data={viz} />;
    default:                 return null;
  }
}
