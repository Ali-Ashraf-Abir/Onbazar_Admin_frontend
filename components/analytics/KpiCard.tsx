"use client";

import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: string | null;
  sub?: string;
  icon: ReactNode;
  accent?: "green" | "red" | "blue" | "amber" | "indigo";
  loading?: boolean;
}

const accentMap = {
  green:  { icon: "bg-[var(--bw-green-bg)] text-[var(--bw-green)]",  ring: "ring-[var(--bw-green)]" },
  red:    { icon: "bg-[var(--bw-red-bg)] text-[var(--bw-red)]",      ring: "ring-[var(--bw-red)]" },
  blue:   { icon: "bg-[var(--bw-blue-bg)] text-[var(--bw-blue)]",    ring: "ring-[var(--bw-blue)]" },
  amber:  { icon: "bg-amber-50 text-amber-600",                        ring: "ring-amber-400" },
  indigo: { icon: "bg-[var(--bw-indigo-bg)] text-[var(--bw-indigo)]", ring: "ring-[var(--bw-indigo)]" },
};

export default function KpiCard({ label, value, change, sub, icon, accent = "blue", loading }: KpiCardProps) {
  const isPositive = change && parseFloat(change) > 0;
  const isNegative = change && parseFloat(change) < 0;

  return (
    <div
      className="relative overflow-hidden rounded-[var(--bw-radius-lg)] bg-[var(--bw-surface)] border border-[var(--bw-border)] p-5"
      style={{ boxShadow: "var(--bw-shadow-sm)" }}
    >
      {/* subtle top gradient stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, currentColor, transparent)` }}
      />

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[var(--bw-border)] rounded w-2/3" />
          <div className="h-8 bg-[var(--bw-border)] rounded w-1/2" />
          <div className="h-3 bg-[var(--bw-border)] rounded w-1/3" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--bw-muted)] mb-2">{label}</p>
            <p className="text-2xl font-semibold text-[var(--bw-ink)] leading-none mb-1.5" style={{ fontFamily: "var(--bw-font-body)" }}>
              {value}
            </p>
            {sub && <p className="text-xs text-[var(--bw-ghost)]">{sub}</p>}
            {change != null && (
              <span
                className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  isPositive ? "bg-[var(--bw-green-bg)] text-[var(--bw-green)]"
                  : isNegative ? "bg-[var(--bw-red-bg)] text-[var(--bw-red)]"
                  : "bg-[var(--bw-surface-alt)] text-[var(--bw-muted)]"
                }`}
              >
                {isPositive ? "↑" : isNegative ? "↓" : "→"} {Math.abs(parseFloat(change))}% vs prev
              </span>
            )}
          </div>
          <div className={`shrink-0 w-10 h-10 rounded-[var(--bw-radius-md)] flex items-center justify-center ${accentMap[accent].icon}`}>
            {icon}
          </div>
        </div>
      )}
    </div>
  );
}