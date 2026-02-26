"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL as string;

/* ─────────────────────── constants ─────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgba(245,158,11,0.12)", color: "#d97706", label: "Pending" },
  confirmed: { bg: "rgba(59,130,246,0.12)", color: "#2563eb", label: "Confirmed" },
  processing: { bg: "rgba(99,102,241,0.12)", color: "#4f46e5", label: "Processing" },
  shipped: { bg: "rgba(139,92,246,0.12)", color: "#7c3aed", label: "Shipped" },
  delivered: { bg: "rgba(34,197,94,0.12)", color: "#16a34a", label: "Delivered" },
  cancelled: { bg: "rgba(239,68,68,0.12)", color: "#dc2626", label: "Cancelled" },
  refunded: { bg: "rgba(249,115,22,0.12)", color: "#ea580c", label: "Refunded" },
};

const PAYMENT_STYLES: Record<string, { bg: string; color: string }> = {
  COD: { bg: "rgba(100,116,139,0.12)", color: "#475569" },
  Bkash: { bg: "rgba(236,72,153,0.12)", color: "#db2777" },
};

function fmt(n: number, currency = "BDT") {
  return `${currency === "BDT" ? "৳" : currency}${n.toFixed(2)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════ */

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [sort, setSort] = useState("newest");

  const [applied, setApplied] = useState({ q: "", status: "", method: "", sort: "newest", page: 1 });

  /* ─────────────────────── fetch ─────────────────────── */

  async function load(a: typeof applied) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(a.page));
      params.set("limit", "15");
      if (a.q) params.set("q", a.q);
      if (a.status) params.set("status", a.status);
      if (a.method) params.set("method", a.method);
      if (a.sort) params.set("sort", a.sort);
      const res = await fetch(`${API}/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.data || []);
      setMeta(data.meta || null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(applied); }, [applied]);

  function apply() { setApplied({ q, status, method, sort, page: 1 }); setPage(1); }
  function reset() {
    setQ(""); setStatus(""); setMethod(""); setSort("newest"); setPage(1);
    setApplied({ q: "", status: "", method: "", sort: "newest", page: 1 });
  }
  function goPage(p: number) { setPage(p); setApplied(a => ({ ...a, page: p })); }

  const hasPending = q !== applied.q || status !== applied.status || method !== applied.method || sort !== applied.sort;
  const hasFilters = !!(applied.q || applied.status || applied.method || applied.sort !== "newest");

  /* ─────────────────────── shared input style ─────────────────────── */
  const selectCls = [
    "h-9 px-3 rounded-[var(--bw-radius-md)] text-[13px] font-medium",
    "bg-[var(--bw-input-bg)] text-[var(--bw-ink)]",
    "border border-[var(--bw-border)] outline-none",
    "transition-colors duration-150 cursor-pointer",
    "focus:border-[var(--bw-border-strong)] focus:bg-[var(--bw-input-focus)]",
    "hover:border-[var(--bw-border-strong)]",
  ].join(" ");

  /* ═══════════════════════════════════════════════════════ */

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        background: "var(--bw-bg)",
        color: "var(--bw-ink)",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      {/* shimmer keyframe */}
      <style>{`
        @keyframes bw-shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes bw-pulse {
          0%,100% { opacity:1 }
          50%      { opacity:.3 }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── Title row ── */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1
              className="text-[28px] font-bold tracking-tight leading-none"
              style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
            >
              Orders
            </h1>
            {meta && (
              <p className="mt-1 text-[13px]" style={{ color: "var(--bw-muted)" }}>
                {meta.total} order{meta.total !== 1 ? "s" : ""}
                {meta.totalPages > 1 && ` · Page ${meta.page} of ${meta.totalPages}`}
              </p>
            )}
          </div>
          <a
            href="/admin/orders/create"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-[var(--bw-radius-md)] text-[13px] font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
          >
            + Test Order
          </a>
        </div>

        {/* ── Filters ── */}
        <div
          className="flex flex-wrap gap-2.5 items-center p-4 mb-5 rounded-[var(--bw-radius-xl)]"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none select-none"
              style={{ color: "var(--bw-ghost)" }}
            >
              🔍
            </span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && apply()}
              placeholder="Search by order #, name, phone, email…"
              className="w-full h-9 pl-9 pr-3 rounded-[var(--bw-radius-md)] text-[13px] outline-none transition-all duration-150"
              style={{
                background: "var(--bw-input-bg)",
                color: "var(--bw-ink)",
                border: "1.5px solid transparent",
                fontFamily: "var(--bw-font-body)",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--bw-border-strong)"; e.currentTarget.style.background = "var(--bw-input-focus)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "var(--bw-input-bg)"; }}
            />
          </div>

          {/* Selects */}
          <select className={selectCls} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <select className={selectCls} value={method} onChange={e => setMethod(e.target.value)}>
            <option value="">All payments</option>
            <option value="COD">COD</option>
            <option value="Bkash">Bkash</option>
          </select>

          <select className={selectCls} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total_desc">Highest total</option>
            <option value="total_asc">Lowest total</option>
          </select>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            {hasFilters && (
              <button
                onClick={reset}
                className="px-3.5 h-9 rounded-[var(--bw-radius-md)] text-[12px] font-semibold transition-colors duration-150"
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--bw-border)",
                  color: "var(--bw-muted)",
                  fontFamily: "var(--bw-font-body)",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--bw-red)"; e.currentTarget.style.color = "var(--bw-red)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bw-border)"; e.currentTarget.style.color = "var(--bw-muted)"; }}
              >
                ✕ Reset
              </button>
            )}
            <button
              onClick={apply}
              className="flex items-center gap-1.5 px-4 h-9 rounded-[var(--bw-radius-md)] text-[13px] font-bold transition-all duration-150"
              style={{
                background: hasPending ? "var(--bw-amber)" : "var(--bw-ink)",
                color: hasPending ? "#0a0a0a" : "var(--bw-bg)",
                border: "none",
                fontFamily: "var(--bw-font-body)",
                cursor: "pointer",
              }}
            >
              {hasPending && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "var(--bw-ink)",
                    animation: "bw-pulse 1.2s infinite",
                    display: "inline-block",
                  }}
                />
              )}
              {hasPending ? "Apply" : "Search"}
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div
          className="rounded-[var(--bw-radius-xl)] overflow-hidden"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--bw-surface-alt)", borderBottom: "1px solid var(--bw-border)" }}>
                {["Order", "Customer", "Items", "Total", "Payment", "Status", "Location"].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "var(--bw-ghost)", fontFamily: "var(--bw-font-body)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[100, 140, 180, 80, 70, 80, 100].map((w, j) => (
                      <td key={j} className="px-4 py-4">
                        <div
                          style={{
                            height: 14,
                            width: w,
                            borderRadius: 4,
                            background: `linear-gradient(90deg, var(--bw-surface-alt) 25%, var(--bw-border) 50%, var(--bw-surface-alt) 75%)`,
                            backgroundSize: "200% 100%",
                            animation: `bw-shimmer 1.4s ${i * 0.05}s infinite`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="text-4xl opacity-30 mb-3">📋</div>
                    <p className="text-[15px] font-semibold" style={{ color: "var(--bw-ink)" }}>No orders found</p>
                    <p className="text-[13px] mt-1" style={{ color: "var(--bw-ghost)" }}>Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                orders.map((o: any) => {
                  const st = STATUS_STYLES[o.status] || STATUS_STYLES.pending;
                  const pm = PAYMENT_STYLES[o.payment?.method] || PAYMENT_STYLES.COD;
                  const mgn = o.analytics?.estimatedProfit;
                  const cur = o.pricing?.currency || "BDT";
                  const delivery = o.pricing?.deliveryCharge || null;
                  const partialRefund = o.refund?.refundType;
                  const promo = o.promo || null;
                  return (
                    <tr
                      key={o._id}
                      style={{ borderBottom: "1px solid var(--bw-divider)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bw-bg-alt)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Order # */}
                      <td className="px-4 py-3">
                        <a href={`/admin/orders/${o._id}`} className="no-underline">
                          <div
                            className="text-[12px] font-bold tracking-wide"
                            style={{ fontFamily: "var(--bw-font-mono)", color: "var(--bw-ink)" }}
                          >
                            {o.orderNumber}
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: "var(--bw-ghost)" }}>
                            {timeAgo(o.createdAt)}
                          </div>
                        </a>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold" style={{ color: "var(--bw-ink)" }}>
                          {o.delivery?.fullName}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--bw-muted)" }}>{o.delivery?.phone}</div>
                        <div className="text-[11px]" style={{ color: "var(--bw-muted)" }}>{o.delivery?.email}</div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3">
                        <div className="text-[12px]" style={{ color: "var(--bw-muted)" }}>
                          {o.items?.length ?? 0} product{o.items?.length !== 1 ? "s" : ""}
                          {o.addons?.length > 0 && ` · ${o.addons.length} addon${o.addons.length !== 1 ? "s" : ""}`}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3">
                        <div className="text-[14px] font-bold tabular-nums" style={{ color: "var(--bw-ink)" }}>
                          {fmt(o.pricing?.subtotal ?? 0, cur)}
                        </div>
                        {mgn != null ? (
                          <div
                            className="text-[11px] font-semibold tabular-nums mt-0.5"
                            style={{ color: mgn >= 0 ? "var(--bw-green)" : "var(--bw-red)" }}
                          >
                            {mgn >= 0 ? "+" : ""}{fmt(mgn, cur)} margin
                          </div>

                        ) : (
                          <div className="text-[11px] mt-0.5" style={{ color: "var(--bw-ghost)" }}>no cost data</div>
                        )}
                        {delivery != null ? (
                          <div
                            className="text-[11px] font-semibold tabular-nums mt-0.5"
                            style={{ color: delivery >= 0 ? "var(--bw-green)" : "var(--bw-red)" }}
                          >
                            {delivery >= 0 ? "+" : ""}{delivery} delivery charge
                          </div>

                        ) : (
                          <div className="text-[11px] mt-0.5" style={{ color: "var(--bw-ghost)" }}>no delivery charge Data</div>
                        )}
                        {
                          promo != null ? (
                            <div
                              className="text-[11px] font-semibold tabular-nums mt-0.5"
                              style={{ color: promo >= 0 ? "var(--bw-green)" : "var(--bw-red)" }}
                            >
                              {promo >= 0 ? "+" : ""}{fmt(promo.discountAmount, cur)} promo discount
                            </div>

                          ) : (
                            ''
                          )
                        }
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap"
                          style={{ background: pm.bg, color: pm.color }}
                        >
                          {o.payment?.method}
                        </span>
                        {o.payment?.method === "COD" && o.payment?.cod?.confirmed && (
                          <div className="text-[10px] mt-0.5 font-semibold" style={{ color: "var(--bw-green)" }}>
                            ✓ Confirmed
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {
                          partialRefund == 'partial' ? (
                            <div
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap text-red-100 bg-red-400 rounded-lg">
                              Partially Refunded : {o.refund?.refundedAmount ? fmt(o.refund.refundedAmount, cur) : "N/A"}
                            </div>) : <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap"
                              style={{ background: st.bg, color: st.color }}
                            >
                            {st.label}
                          </span>
                        }
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-medium" style={{ color: "var(--bw-muted)" }}>{o.delivery?.zilla}</div>
                        <div className="text-[11px]" style={{ color: "var(--bw-ghost)" }}>{o.delivery?.thana}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* ── Pagination ── */}
          {meta && meta.totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-2 px-6 py-5"
              style={{ borderTop: "1px solid var(--bw-border)" }}
            >
              <PagBtn disabled={page <= 1} onClick={() => goPage(page - 1)}>←</PagBtn>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="text-[13px]" style={{ color: "var(--bw-ghost)" }}>…</span>
                  ) : (
                    <PagBtn key={p} active={p === page} onClick={() => goPage(p as number)}>
                      {p}
                    </PagBtn>
                  )
                )}
              <PagBtn disabled={page >= meta.totalPages} onClick={() => goPage(page + 1)}>→</PagBtn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Pagination button ─── */
function PagBtn({
  children, active, disabled, onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-[34px] h-[34px] rounded-[var(--bw-radius-md)] flex items-center justify-center text-[13px] font-medium transition-all duration-100"
      style={{
        background: active ? "var(--bw-ink)" : "var(--bw-surface)",
        color: active ? "var(--bw-bg)" : "var(--bw-muted)",
        border: active ? "1.5px solid var(--bw-ink)" : "1.5px solid var(--bw-border)",
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      {children}
    </button>
  );
}