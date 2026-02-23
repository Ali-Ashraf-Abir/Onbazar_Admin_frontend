"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  loading?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[var(--bw-surface)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-3 py-2 shadow-lg text-xs">
      <span className="font-medium text-[var(--bw-ink)]">{d.name}</span>
      <span className="text-[var(--bw-muted)] ml-2">{d.value.toLocaleString()}</span>
    </div>
  );
};

export default function DonutChart({ data, loading, centerLabel, centerValue }: DonutChartProps) {
  if (loading) {
    return <div className="h-40 w-40 mx-auto rounded-full bg-[var(--bw-border)] animate-pulse" />;
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={66}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {centerValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-[var(--bw-muted)]">{centerLabel}</span>
            <span className="text-sm font-semibold text-[var(--bw-ink)]">{centerValue}</span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        {data.map((d) => (
          <div key={d.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="text-xs text-[var(--bw-ink-secondary)] truncate capitalize">{d.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-[var(--bw-ink)]">{d.value.toLocaleString()}</span>
              <span className="text-xs text-[var(--bw-ghost)] w-9 text-right">
                {total ? ((d.value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}