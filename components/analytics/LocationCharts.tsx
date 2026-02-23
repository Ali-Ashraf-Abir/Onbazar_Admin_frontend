"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface LocationChartProps {
  data: Array<{ zilla: string; orders: number; revenue: number }>;
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
      <p className="font-semibold text-[var(--bw-ink)] mb-1">{label}</p>
      <p className="text-[var(--bw-muted)]">Orders: <span className="font-medium text-[var(--bw-ink)]">{payload[0]?.value}</span></p>
      <p className="text-[var(--bw-muted)]">Revenue: <span className="font-medium text-[var(--bw-ink)]">{fmt(payload[1]?.value || 0)}</span></p>
    </div>
  );
};

export default function LocationChart({ data, loading }: LocationChartProps) {
  if (loading) return <div className="h-64 bg-[var(--bw-border)] rounded animate-pulse" />;
  if (!data?.length) return <div className="h-64 flex items-center justify-center text-[var(--bw-ghost)] text-sm">No location data</div>;

  const top = data.slice(0, 15);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={top} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bw-border)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "var(--bw-ghost)", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => String(v)} />
        <YAxis type="category" dataKey="zilla" tick={{ fill: "var(--bw-ink-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} width={72} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="orders" name="Orders" fill="var(--bw-ink)" radius={[0, 3, 3, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}