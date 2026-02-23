"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ComparisonData } from "../../lib/analyticsApi";

interface ComparisonChartProps {
  data: ComparisonData | null;
  loading?: boolean;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bw-surface)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] p-3 shadow-lg text-xs">
      <p className="font-semibold text-[var(--bw-ink)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-[var(--bw-muted)]">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            {p.name}
          </span>
          <span className="font-medium text-[var(--bw-ink)]">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ComparisonChart({ data, loading }: ComparisonChartProps) {
  if (loading) return <div className="h-56 bg-[var(--bw-border)] rounded animate-pulse" />;
  if (!data)   return <div className="h-56 flex items-center justify-center text-[var(--bw-ghost)] text-sm">No comparison data</div>;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const merged = data.current.data.map((cur, i) => {
    const prev       = data.previous.data[i];
    const labelParts = cur.label.split("-");
    const shortLabel = MONTHS[(parseInt(labelParts[1] || "1") - 1)] ?? cur.label.slice(5);
    return {
      label:    shortLabel,
      current:  cur.grossRevenue,           // ← was cur.netRevenue (removed)
      previous: prev?.grossRevenue ?? 0,    // ← was prev.netRevenue (removed)
      currentLost:  cur.lostRevenue  ?? 0,
      previousLost: prev?.lostRevenue ?? 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={merged} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bw-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--bw-ghost)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "var(--bw-ghost)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmt}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v) => <span style={{ color: "var(--bw-muted)" }}>{v}</span>}
        />
        <Bar dataKey="current"  name="This Year"  fill="var(--bw-ink)"          radius={[3, 3, 0, 0]} barSize={14} />
        <Bar dataKey="previous" name="Last Year"  fill="var(--bw-border-strong)" radius={[3, 3, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}