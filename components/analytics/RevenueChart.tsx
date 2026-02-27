"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TimeseriesPoint } from "../../lib/analyticsApi";

interface RevenueChartProps {
  data: TimeseriesPoint[];
  granularity: string;
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
    <div className="bg-[var(--bw-surface)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] p-3 shadow-lg text-xs min-w-[160px]" style={{ boxShadow: "var(--bw-shadow-lg)" }}>
      <p className="font-semibold text-[var(--bw-ink)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-[var(--bw-muted)]">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium text-[var(--bw-ink)]">
            {p.dataKey === "orders" || p.dataKey === "items" ? p.value : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart({ data, granularity, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="h-64 flex items-end gap-1 px-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 bg-[var(--bw-border)] rounded-t animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return <div className="h-64 flex items-center justify-center text-[var(--bw-ghost)] text-sm">No data for this period</div>;
  }

  // Thin labels for dense datasets
  const tickInterval = data.length > 30 ? Math.floor(data.length / 10) : 0;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--bw-ink)"  stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--bw-ink)"  stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--bw-green)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--bw-green)" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="gradLost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--bw-red)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--bw-red)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bw-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--bw-ghost)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          tickFormatter={(v) => v.slice(5)} // strip year prefix
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
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          formatter={(v) => <span style={{ color: "var(--bw-muted)" }}>{v}</span>}
        />
        <Area type="monotone" dataKey="grossRevenue" name="Net Revenue"  stroke="var(--bw-ink)"   strokeWidth={2}   fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4 }} />
        <Area type="monotone" dataKey="profit"       name="Profit"       stroke="var(--bw-green)"  strokeWidth={1.5} fill="url(#gradProfit)"  dot={false} activeDot={{ r: 3 }} strokeDasharray="4 2" />
        <Area type="monotone" dataKey="lostRevenue"  name="Lost Revenue" stroke="var(--bw-red)"    strokeWidth={1.5} fill="url(#gradLost)"    dot={false} activeDot={{ r: 3 }} strokeDasharray="4 2" />
      </AreaChart>
    </ResponsiveContainer>
  );
}