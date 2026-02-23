"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ProfitPoint } from "../../lib/analyticsApi";

interface ProfitChartProps {
  data: ProfitPoint[];
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
    <div className="bg-[var(--bw-surface)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] p-3 shadow-lg text-xs min-w-[170px]">
      <p className="font-semibold text-[var(--bw-ink)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-[var(--bw-muted)]">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium text-[var(--bw-ink)]">
            {p.dataKey === "margin" ? `${p.value?.toFixed(1)}%` : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ProfitChart({ data, loading }: ProfitChartProps) {
  if (loading) {
    return <div className="h-56 bg-[var(--bw-border)] rounded animate-pulse" />;
  }

  if (!data?.length) {
    return <div className="h-56 flex items-center justify-center text-[var(--bw-ghost)] text-sm">No data</div>;
  }

  const tickInterval = data.length > 30 ? Math.floor(data.length / 10) : 0;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bw-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--bw-ghost)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "var(--bw-ghost)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmt}
          width={52}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "var(--bw-ghost)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v) => <span style={{ color: "var(--bw-muted)" }}>{v}</span>}
        />
        <Bar yAxisId="left" dataKey="revenue"  name="Revenue"  fill="var(--bw-border-strong)" radius={[3, 3, 0, 0]} />
        <Bar yAxisId="left" dataKey="itemCost" name="Cost"     fill="var(--bw-ghost)"         radius={[3, 3, 0, 0]} />
        <Bar yAxisId="left" dataKey="profit"   name="Profit"   fill="var(--bw-ink)"           radius={[3, 3, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="margin" name="Margin %" stroke="var(--bw-green)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}