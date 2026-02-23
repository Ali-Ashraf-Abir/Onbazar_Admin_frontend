"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import api from "../../lib/api";
import { analyticsApi, DateRange, RefundData } from "../../lib/analyticsApi";

/* ── Types ──────────────────────────────────────────── */
interface RefundListItem {
  _id:             string;
  orderNumber:     string;
  status:          string;
  refundType:      "full" | "partial" | "damaged" | null;
  orderSubtotal:   number;
  originalRevenue: number;
  refundedAmount:  number | null;
  netRevenue:      number | null;
  netProfit:       number | null;
  refundedAt:      string | null;
  refundNote:      string | null;
  paymentMethod:   string;
  customerName:    string;
  customerPhone:   string;
  orderedAt:       string;
}

interface RefundListResponse {
  success: boolean;
  meta:    { page: number; limit: number; total: number; totalPages: number };
  data:    RefundListItem[];
}

interface Props { range: DateRange; }

/* ── Helpers ─────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${Math.round(n).toLocaleString()}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bw-surface)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] p-3 shadow-lg text-xs min-w-[180px]">
      <p className="font-semibold text-[var(--bw-ink)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-[var(--bw-muted)]">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
            {p.name}
          </span>
          <span className="font-medium text-[var(--bw-ink)]">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const RefundTypeBadge = ({ type, status }: { type: string | null; status: string }) => {
  if (type === "partial") return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      partial
    </span>
  );
  if (type === "damaged") return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
      damaged
    </span>
  );
  if (status === "cancelled") return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bw-red-bg)] text-[var(--bw-red)]">
      cancelled
    </span>
  );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bw-blue-bg)] text-[var(--bw-blue)]">
      full refund
    </span>
  );
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function RefundAnalyticsSection({ range }: Props) {
  const [analytics,   setAnalytics]   = useState<RefundData | null>(null);
  const [list,        setList]        = useState<RefundListItem[]>([]);
  const [meta,        setMeta]        = useState<{ total: number; totalPages: number } | null>(null);
  const [page,        setPage]        = useState(1);
  // Filter: "" = all refund types, "full", "partial", "damaged"
  const [listFilter,  setListFilter]  = useState<"" | "full" | "partial" | "damaged">("");
  const [loading,     setLoading]     = useState(true);
  const [listLoading, setListLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getRefundAnalytics(range);
      setAnalytics(res);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(range)]);

  const fetchList = useCallback(async (p = 1) => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (range.period) params.set("period", range.period);
      if (range.from)   params.set("from",   range.from);
      if (range.to)     params.set("to",     range.to);
      // Backend filters by refundType (not status) — works for all types including partial
      if (listFilter)   params.set("refundType", listFilter);
      params.set("page",  String(p));
      params.set("limit", "15");
      const res = await api.get<RefundListResponse>(`/admin/analytics/refunds/list?${params}`);
      setList(res.data);
      setMeta({ total: res.meta.total, totalPages: res.meta.totalPages });
      setPage(p);
    } finally {
      setListLoading(false);
    }
  }, [JSON.stringify(range), listFilter]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { fetchList(1);    }, [fetchList]);

  const summary = analytics?.data?.summary;

  /* ── Chart data ── */
  const timeseriesData = analytics?.data?.timeseries?.map((r) => ({
    label:       r.label.slice(5),
    lostRevenue: r.lostRevenue,
    partialAmt:  r.partialAmt,
  })) ?? [];

  // byNote (renamed from byReason in old code)
  const noteData = analytics?.data?.byNote?.slice(0, 8).map((r) => ({
    name:        r.note.length > 24 ? r.note.slice(0, 22) + "…" : r.note,
    count:       r.count,
    lostRevenue: r.lostRevenue,
    partialAmt:  r.partialAmt,
  })) ?? [];

  // byType breakdown
  const byType = analytics?.data?.byType ?? [];

  // Derived totals for the revenue split bar
  const totalActive = summary
    ? (/* gross = active revenue, compute from what we know */
       (summary.lostRevenue != null ? summary.lostRevenue : 0))
    : 0;

  return (
    <div className="space-y-5">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Refund Rate",
            value: loading ? "—" : `${summary?.refundRate ?? 0}%`,
            sub:   loading ? "" : `${(summary?.refundedOrders ?? 0) + (summary?.cancelledOrders ?? 0)} orders closed`,
            color: (summary?.refundRate ?? 0) > 5 ? "text-[var(--bw-red)]" : "text-[var(--bw-ink)]",
          },
          {
            label: "Lost Revenue",
            value: loading ? "—" : fmt(summary?.lostRevenue ?? 0),
            sub:   loading ? "" : `avg ${fmt(summary?.avgLostPerOrder ?? 0)} per order`,
            color: "text-[var(--bw-red)]",
          },
          {
            label: "Partial Refunds",
            value: loading ? "—" : fmt(summary?.partialRefundAmt ?? 0),
            sub:   loading ? "" : `${summary?.partialCount ?? 0} orders affected`,
            color: "text-amber-500",
          },
          {
            label: "Lost Profit",
            // lostProfit is 0 for full refunds (product returned), positive for damaged goods
            value: loading ? "—" : fmt(summary?.lostProfit ?? 0),
            sub:   "Damaged goods only · full refunds = ৳0",
            color: (summary?.lostProfit ?? 0) > 0 ? "text-orange-500" : "text-[var(--bw-muted)]",
          },
        ].map((k) => (
          <div key={k.label} className="bg-[var(--bw-surface-alt)] rounded-[var(--bw-radius-md)] p-4">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-[var(--bw-border)] rounded w-2/3" />
                <div className="h-6 bg-[var(--bw-border)] rounded w-1/2" />
              </div>
            ) : (
              <>
                <p className="text-xs text-[var(--bw-ghost)] uppercase tracking-wide">{k.label}</p>
                <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                <p className="text-xs text-[var(--bw-ghost)] mt-0.5">{k.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Breakdown by refund type ── */}
      {!loading && byType.length > 0 && (
        <div className="bg-[var(--bw-surface-alt)] rounded-[var(--bw-radius-md)] p-4">
          <p className="text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide mb-3">
            Breakdown by Type
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {byType.map((t) => (
              <div key={t.refundType} className="bg-[var(--bw-surface)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <RefundTypeBadge type={t.refundType} status={t.refundType} />
                  <span className="text-xs text-[var(--bw-ghost)]">{t.count} orders</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--bw-ghost)]">
                      {t.refundType === "partial" ? "Amount returned" : "Revenue lost"}
                    </span>
                    <span className="font-semibold text-[var(--bw-red)]">{fmt(t.lostRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--bw-ghost)]">
                      {t.refundType === "partial" ? "Margin reduced" : "Profit lost"}
                    </span>
                    <span className={`font-semibold ${t.lostProfit > 0 ? "text-orange-500" : "text-[var(--bw-muted)]"}`}>
                      {t.lostProfit > 0 ? fmt(t.lostProfit) : "৳0"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Explanatory note */}
          <p className="text-xs text-[var(--bw-ghost)] mt-3 leading-relaxed">
            Full refunds show ৳0 profit lost because the product comes back to stock.
            Damaged goods show a real cost loss since the product is unrecoverable.
            Partial refunds show how much margin was sacrificed.
          </p>
        </div>
      )}

      {/* ── Timeseries chart ── */}
      {timeseriesData.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide mb-3">
            Refund Activity by Day (keyed by refund date)
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={timeseriesData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bw-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--bw-ghost)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "var(--bw-ghost)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmt}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(v) => <span style={{ color: "var(--bw-muted)" }}>{v}</span>}
              />
              <Bar dataKey="lostRevenue" name="Lost Revenue"   fill="var(--bw-red)"  radius={[3, 3, 0, 0]} />
              <Bar dataKey="partialAmt"  name="Partial Refund" fill="#f59e0b"         radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Refund notes breakdown ── */}
      {noteData.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide mb-3">
            Top Refund Notes
          </p>
          <div className="space-y-2">
            {noteData.map((r) => {
              const maxCount = Math.max(...noteData.map((x) => x.count));
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--bw-ink)] truncate">{r.name}</span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {r.lostRevenue > 0 && (
                          <span className="text-xs font-medium text-[var(--bw-red)]">{fmt(r.lostRevenue)}</span>
                        )}
                        {r.partialAmt > 0 && (
                          <span className="text-xs font-medium text-amber-500">{fmt(r.partialAmt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 bg-[var(--bw-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--bw-ink)] rounded-full"
                        style={{ width: `${(r.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--bw-ghost)] shrink-0 w-8 text-right">{r.count}×</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ledger table ── */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <p className="text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide">
            Refund Ledger {meta ? `(${meta.total})` : ""}
          </p>
          {/* Filter by refundType — "partial" shows active orders that had money returned */}
          <div className="flex items-center gap-1 bg-[var(--bw-surface-alt)] p-0.5 rounded-[var(--bw-radius-sm)] border border-[var(--bw-border)]">
            {([
              { value: "",         label: "All"      },
              { value: "full",     label: "Full"     },
              { value: "partial",  label: "Partial"  },
              { value: "damaged",  label: "Damaged"  },
            ] as const).map((f) => (
              <button
                key={f.value}
                onClick={() => { setListFilter(f.value); fetchList(1); }}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  listFilter === f.value
                    ? "bg-[var(--bw-ink)] text-[var(--bw-bg)]"
                    : "text-[var(--bw-muted)] hover:text-[var(--bw-ink)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-[var(--bw-radius-md)] border border-[var(--bw-border)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--bw-surface-alt)] border-b border-[var(--bw-border)]">
                {["Order", "Customer", "Type", "Original", "Refunded", "Net Revenue", "Payment", "Date", "Note"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-medium text-[var(--bw-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-divider)]">
              {listLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-2.5">
                        <div className="h-3 bg-[var(--bw-border)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-[var(--bw-ghost)]">
                    No refund records in this period
                  </td>
                </tr>
              ) : (
                list.map((r) => (
                  <tr key={r._id} className="hover:bg-[var(--bw-surface-alt)] transition-colors">
                    <td className="px-3 py-2.5 font-mono text-[var(--bw-ink)] whitespace-nowrap">
                      {r.orderNumber}
                      {/* Show status if it's not the default active status */}
                      {(r.status === "refunded" || r.status === "cancelled") && (
                        <span className="ml-1.5 text-[var(--bw-ghost)]">({r.status})</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="text-[var(--bw-ink)]">{r.customerName}</div>
                      <div className="text-[var(--bw-ghost)]">{r.customerPhone}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <RefundTypeBadge type={r.refundType} status={r.status} />
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[var(--bw-ink)] whitespace-nowrap">
                      {fmt(r.originalRevenue)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {r.refundedAmount != null
                        ? <span className="font-semibold text-[var(--bw-red)]">{fmt(r.refundedAmount)}</span>
                        : <span className="text-[var(--bw-ghost)]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {r.refundType === "full" ? (
                        <span className="text-[var(--bw-ghost)]">৳0</span>
                      ) : r.netRevenue != null ? (
                        <span className="font-semibold text-[var(--bw-green)]">{fmt(r.netRevenue)}</span>
                      ) : (
                        <span className="text-[var(--bw-ghost)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--bw-muted)] whitespace-nowrap">{r.paymentMethod}</td>
                    <td className="px-3 py-2.5 text-[var(--bw-muted)] whitespace-nowrap">{fmtDate(r.refundedAt)}</td>
                    <td className="px-3 py-2.5 text-[var(--bw-ghost)] max-w-[160px] truncate">
                      {r.refundNote || <span className="italic">No note</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[var(--bw-ghost)]">
              Page {page} of {meta.totalPages} · {meta.total} total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchList(page - 1)}
                disabled={page <= 1 || listLoading}
                className="px-2.5 py-1 text-xs rounded border border-[var(--bw-border)] text-[var(--bw-muted)] hover:bg-[var(--bw-surface-alt)] disabled:opacity-40 cursor-pointer"
              >
                ← Prev
              </button>
              <button
                onClick={() => fetchList(page + 1)}
                disabled={page >= meta.totalPages || listLoading}
                className="px-2.5 py-1 text-xs rounded border border-[var(--bw-border)] text-[var(--bw-muted)] hover:bg-[var(--bw-surface-alt)] disabled:opacity-40 cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}