"use client";

import { InventoryProduct } from "../../lib/analyticsApi";

interface InventoryTableProps {
  data: InventoryProduct[];
  summary: {
    total: number;
    outOfStock: number;
    lowStock: number;
    threshold: number;
  } | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading?: boolean;
  onPageChange?: (page: number) => void;
}

export default function InventoryTable({
  data,
  summary,
  meta,
  loading,
  onPageChange,
}: InventoryTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-[var(--bw-border)] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-8 text-[var(--bw-ghost)] text-sm">
        No managed stock products found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Managed Products", value: summary.total, color: "text-[var(--bw-ink)]" },
            { label: "Out of Stock", value: summary.outOfStock, color: "text-[var(--bw-red)]" },
            { label: `Low Stock (≤${summary.threshold})`, value: summary.lowStock, color: "text-amber-600" },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center bg-[var(--bw-surface-alt)] rounded-[var(--bw-radius-md)] p-3"
            >
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[var(--bw-ghost)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Products */}
      <div className="divide-y divide-[var(--bw-divider)] max-h-72 overflow-y-auto">
        {data.map((p) => (
          <div
            key={p._id}
            className="flex items-center gap-3 py-2.5 px-1 hover:bg-[var(--bw-surface-alt)] rounded transition-colors"
          >
            <div className="w-8 h-8 shrink-0 rounded-[var(--bw-radius-sm)] bg-[var(--bw-surface-alt)] border border-[var(--bw-border)] overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--bw-ghost)] text-xs">
                  ?
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--bw-ink)] truncate">
                {p.name}
              </p>

              {p.hasSize && p.stockBySize && (
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {Object.entries(p.stockBySize).slice(0, 5).map(([size, qty]) => (
                    <span
                      key={size}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        qty === 0
                          ? "bg-[var(--bw-red-bg)] text-[var(--bw-red)]"
                          : qty <= 3
                          ? "bg-amber-50 text-amber-600"
                          : "bg-[var(--bw-surface-alt)] text-[var(--bw-ghost)]"
                      }`}
                    >
                      {size}: {qty}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  p.isOutOfStock
                    ? "bg-[var(--bw-red-bg)] text-[var(--bw-red)]"
                    : p.isLow
                    ? "bg-amber-50 text-amber-600"
                    : "bg-[var(--bw-green-bg)] text-[var(--bw-green)]"
                }`}
              >
                {p.isOutOfStock ? "Out" : p.isLow ? "Low" : "OK"} · {p.totalStock}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--bw-ghost)]">
          <button
            disabled={meta.page <= 1}
            onClick={() => onPageChange?.(meta.page - 1)}
            className="px-3 py-1 rounded border border-[var(--bw-border)] disabled:opacity-40"
          >
            Previous
          </button>

          <span>
            Page {meta.page} of {meta.totalPages}
          </span>

          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange?.(meta.page + 1)}
            className="px-3 py-1 rounded border border-[var(--bw-border)] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}