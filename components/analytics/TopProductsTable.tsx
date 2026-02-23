"use client";

import { TopProduct } from "../../lib/analyticsApi";

interface TopProductsTableProps {
  data: TopProduct[];
  loading?: boolean;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

export default function TopProductsTable({ data, loading }: TopProductsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-[var(--bw-border)] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return <p className="text-center text-[var(--bw-ghost)] text-sm py-8">No product data</p>;
  }

  const maxRevenue = Math.max(...data.map((p) => p.totalRevenue));

  return (
    <div className="space-y-1">
      {data.map((product, i) => (
        <div key={product._id} className="group flex items-center gap-3 px-3 py-2.5 rounded-[var(--bw-radius-md)] hover:bg-[var(--bw-surface-alt)] transition-colors">
          {/* Rank */}
          <span className="w-5 text-center text-xs font-semibold text-[var(--bw-ghost)]">
            {i + 1}
          </span>

          {/* Image */}
          <div className="w-8 h-8 rounded-[var(--bw-radius-sm)] bg-[var(--bw-surface-alt)] overflow-hidden shrink-0 border border-[var(--bw-border)]">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--bw-ghost)] text-xs">?</div>
            )}
          </div>

          {/* Name + bar */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--bw-ink)] truncate">{product.name}</p>
            <div className="mt-1 h-1 bg-[var(--bw-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--bw-ink)] rounded-full transition-all duration-500"
                style={{ width: `${maxRevenue ? (product.totalRevenue / maxRevenue) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-[var(--bw-ink)]">{fmt(product.totalRevenue)}</p>
            <p className="text-xs text-[var(--bw-ghost)]">{product.totalSold.toLocaleString()} sold</p>
          </div>
        </div>
      ))}
    </div>
  );
}