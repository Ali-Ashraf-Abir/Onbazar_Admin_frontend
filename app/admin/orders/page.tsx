"use client";

import { useEffect, useState, useCallback } from "react";
import api, { ApiError } from "@/lib/api";

/* ─── Config ───────────────────────────────────────────────────────── */

type StatusKey = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

const STATUS: Record<StatusKey, { bg: string; color: string; dot: string; label: string }> = {
  pending: { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b", label: "Pending" },
  confirmed: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6", label: "Confirmed" },
  processing: { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6", label: "Processing" },
  shipped: { bg: "#f0fdf4", color: "#166534", dot: "#22c55e", label: "Shipped" },
  delivered: { bg: "#d1fae5", color: "#065f46", dot: "#10b981", label: "Delivered" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", label: "Cancelled" },
  refunded: { bg: "#ffedd5", color: "#9a3412", dot: "#f97316", label: "Refunded" },
};

const ALL_STATUSES: StatusKey[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

/* ─── Types ─────────────────────────────────────────────────────────── */

interface OrderItem { snapshot: { name: string }; size?: string; quantity: number; }
interface Order {
  _id: string;
  orderNumber: string;
  status: StatusKey;
  createdAt: string;
  delivery: { fullName: string; phone: string; thana?: string; zilla?: string; address?: string };
  items: OrderItem[];
  addons?: { snapshot: { name: string }; quantity: number }[];
  pricing?: { grandTotal: number; deliveryCharge: number };
  payment?: { method: string; cod?: { confirmed: boolean } };
  adminNote?: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function todayDhaka(): string {
  // Get today's date in Asia/Dhaka timezone as YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function fmtDateLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const today = todayDhaka();
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    .toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka",
  });
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

export default function AdminOrdersByDate() {
  const [date, setDate] = useState(todayDhaka);
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<{ total: number; totalPages: number; page: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // ── Selection state ──────────────────────────────────────────────
  // selectedIds: which order cards are checked
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk action controls
  const [filterFrom, setFilterFrom] = useState<StatusKey | "">("");  // "" = all non-terminal
  const [targetStatus, setTargetStatus] = useState<StatusKey | "">("");

  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "warn" } | null>(null);

  /* ── Load orders ─────────────────────────────────────────────── */
  const load = useCallback(async (d: string, p: number) => {
    setLoading(true);
    setToast(null);
    try {
      const params = new URLSearchParams({ date: d, page: String(p), limit: "50", sort: "oldest" });
      const data = await api.get<{ data: Order[]; meta: typeof meta }>(`/admin/orders?${params}`);
      setOrders(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date, page); }, [date, page, load]);

  /* ── Selection helpers ────────────────────────────────────────── */
  const toggleCard = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // Select all = every order, no restrictions
  const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o._id));

  const selectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map(o => o._id)));
    }
  };

  // wouldAffect: all selected, optionally filtered by current status
  const wouldAffect = [...selectedIds].filter(id => {
    const o = orders.find(x => x._id === id);
    if (!o) return false;
    if (filterFrom) return o.status === filterFrom;
    return true;
  });

  /* ── Bulk update ──────────────────────────────────────────────── */
  const doBulk = async () => {
    if (!targetStatus || wouldAffect.length === 0) return;
    setBulkLoading(true);
    setToast(null);
    try {
      const body: Record<string, unknown> = {
        orderIds: wouldAffect,
        newStatus: targetStatus,
      };
      if (filterFrom) body.fromStatus = filterFrom;

      const data = await api.post<{ updated: number; total: number; skipped: number }>(
        "/admin/orders/bulk-status",
        body
      );
      const skipped = selectedIds.size - data.updated;
      setToast({
        msg: data.updated > 0
          ? `✓ ${data.updated} order${data.updated !== 1 ? "s" : ""} updated to "${STATUS[targetStatus]?.label}"${skipped > 0 ? ` · ${skipped} skipped` : ""}`
          : `No orders matched — ${skipped} skipped`,
        type: data.updated > 0 ? "ok" : "warn",
      });
      await load(date, page);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Request failed";
      setToast({ msg, type: "warn" });
    } finally {
      setBulkLoading(false);
    }
  };

  /* ── Status summary counts ────────────────────────────────────── */
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  /* ─────────────────────────────────────────────────────────────── */

  return (
    <div style={{ minHeight: "100vh", background: "#f1f3f5", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Cards ── */
        .ocard {
          background: white;
          border-radius: 14px;
          border: 2px solid #e8eaed;
          overflow: hidden;
          cursor: pointer;
          transition: border-color .15s, box-shadow .15s, transform .12s;
          user-select: none;
          display: flex;
          flex-direction: column;
        }
        .ocard:hover { border-color: #c5c9d0; box-shadow: 0 4px 16px rgba(0,0,0,.07); transform: translateY(-1px); }
        .ocard.checked { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
        .ocard.terminal { opacity: .72; cursor: default; }
        .ocard.terminal:hover { transform: none; box-shadow: none; border-color: #e8eaed; }

        .card-header {
          padding: 14px 16px 10px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .card-body { padding: 0 16px 14px; flex: 1; }
        .card-footer {
          padding: 10px 16px;
          border-top: 1px solid #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        /* ── Status badge ── */
        .sbadge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
        }
        .sdot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── Product chips ── */
        .chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 6px;
          background: #f8f9fa; border: 1px solid #e9ecef;
          font-size: 12px; color: #374151; font-weight: 500;
          margin: 3px 3px 0 0;
        }
        .chip-qty {
          background: #e5e7eb; color: #6b7280; border-radius: 4px;
          padding: 1px 5px; font-family: 'DM Mono', monospace; font-size: 10px;
        }

        /* ── Checkbox ── */
        .cb {
          width: 20px; height: 20px; flex-shrink: 0;
          border: 2px solid #d1d5db; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          transition: border-color .1s, background .1s;
          font-size: 11px; font-weight: 800; color: white;
        }
        .cb.on { border-color: #4f46e5; background: #4f46e5; }

        /* ── Controls ── */
        select.ctrl, input.ctrl {
          height: 38px; padding: 0 12px;
          border: 1.5px solid #e2e5ea; border-radius: 9px;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: #1f2937; background: white; outline: none; cursor: pointer;
        }
        select.ctrl:focus, input.ctrl:focus { border-color: #4f46e5; }
        select.ctrl:disabled { opacity: .5; cursor: not-allowed; }

        .btn {
          height: 38px; padding: 0 18px; border-radius: 9px;
          font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 700;
          border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
          transition: opacity .1s, transform .1s;
          white-space: nowrap;
        }
        .btn:active { transform: scale(.97); }
        .btn:disabled { opacity: .4; cursor: not-allowed; }
        .btn-dark { background: #1f2937; color: white; }
        .btn-indigo { background: #4f46e5; color: white; }
        .btn-outline { background: white; color: #6b7280; border: 1.5px solid #e2e5ea; }

        /* ── Date nav ── */
        .dnav {
          width: 36px; height: 36px; border-radius: 9px;
          border: 1.5px solid #e2e5ea; background: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: #374151; cursor: pointer;
          transition: border-color .1s, background .1s;
        }
        .dnav:hover { border-color: #4f46e5; background: #f5f3ff; color: #4f46e5; }

        /* ── Toast ── */
        .toast {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          animation: pop .2s ease;
        }
        .toast-ok   { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
        .toast-warn { background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; }
        @keyframes pop { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Skeleton ── */
        .skel {
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
          background-size: 200% 100%; animation: sh 1.3s infinite; border-radius: 6px;
        }
        @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Grid ── */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }

        @media (max-width: 520px) {
          .cards-grid { grid-template-columns: 1fr; }
        }

        /* ── Print styles ── */
        @media print {
          @page { size: A4; margin: 14mm 12mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .cards-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 10px !important;
          }
          .ocard {
            border: 1.5px solid #d1d5db !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
            transform: none !important;
            cursor: default !important;
          }
          .ocard.checked { border-color: #d1d5db !important; box-shadow: none !important; }
          .cb { display: none !important; }
          .card-footer a { display: none !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "26px 16px" }}>

        {/* ══ Page header ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.02em" }}>Daily Orders</h1>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 3 }}>View and manage orders by date</p>
          </div>
          {!loading && orders.length > 0 && (
            <button
              className="btn no-print"
              onClick={() => window.print()}
              style={{ background: "white", color: "#374151", border: "1.5px solid #e2e5ea", height: 38, fontSize: 13 }}
            >
              🖨 Print / Save PDF
            </button>
          )}
        </div>

        {/* Print header — only visible when printing */}
        <div className="print-only" style={{ marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #111827" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Orders — {fmtDateLabel(date)}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{meta?.total ?? orders.length} orders · Printed {new Date().toLocaleString("en-BD")}</div>
        </div>

        {/* ══ Date picker bar ════════════════════════════════════════ */}
        <div className="no-print" style={{ background: "white", border: "1.5px solid #e2e5ea", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <button className="dnav" onClick={() => { setDate(d => shiftDate(d, -1)); setPage(1); }}>‹</button>

          <input
            type="date"
            className="ctrl"
            style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}
            value={date}
            onChange={e => { if (e.target.value) { setDate(e.target.value); setPage(1); } }}
          />

          <button className="dnav" onClick={() => { setDate(d => shiftDate(d, 1)); setPage(1); }}>›</button>

          {date !== todayDhaka() && (
            <button className="btn btn-outline" style={{ height: 36, fontSize: 12 }}
              onClick={() => { setDate(todayDhaka()); setPage(1); }}>
              Today
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              {fmtDateLabel(date)}
            </span>
            {meta && (
              <span style={{ fontSize: 13, color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                {meta.total} order{meta.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* ══ Status summary pills ═══════════════════════════════════ */}
        {!loading && Object.keys(counts).length > 0 && (
          <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {ALL_STATUSES.filter(s => counts[s]).map(s => (
              <span key={s} className="sbadge" style={{ background: STATUS[s].bg, color: STATUS[s].color }}>
                <span className="sdot" style={{ background: STATUS[s].dot }} />
                {STATUS[s].label} · {counts[s]}
              </span>
            ))}
          </div>
        )}

        {/* ══ Bulk action bar ════════════════════════════════════════ */}
        {!loading && orders.length > 0 && (
          <div className="no-print" style={{ background: "white", border: "1.5px solid #e2e5ea", borderRadius: 12, padding: "11px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

            {/* Select all toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={selectAll}>
              <div className={`cb${allSelected ? " on" : ""}`}>{allSelected ? "✓" : ""}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                {selectedIds.size === 0 ? "Select all" : `${selectedIds.size} selected`}
              </span>
            </div>

            <div style={{ width: 1, height: 22, background: "#e5e7eb", flexShrink: 0 }} />

            {/* Filter: only change orders currently at this status */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>From</span>
              <select className="ctrl" value={filterFrom}
                onChange={e => setFilterFrom(e.target.value as StatusKey | "")}
                disabled={selectedIds.size === 0}>
                <option value="">Any status</option>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS[s].label}</option>
                ))}
              </select>
            </div>

            <span style={{ fontSize: 13, color: "#9ca3af" }}>→</span>

            {/* Target status */}
            <select className="ctrl" value={targetStatus}
              onChange={e => setTargetStatus(e.target.value as StatusKey | "")}
              disabled={selectedIds.size === 0}>
              <option value="">Set status…</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS[s].label}</option>
              ))}
            </select>

            {/* Affected count */}
            {targetStatus && selectedIds.size > 0 && (
              <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                {wouldAffect.length} will change
                {selectedIds.size - wouldAffect.length > 0 && ` · ${selectedIds.size - wouldAffect.length} skipped`}
              </span>
            )}

            <button
              className="btn btn-indigo"
              style={{ marginLeft: "auto" }}
              disabled={!targetStatus || wouldAffect.length === 0 || bulkLoading}
              onClick={doBulk}
            >
              {bulkLoading ? "Updating…" : `Apply${wouldAffect.length > 0 ? ` (${wouldAffect.length})` : ""}`}
            </button>

            {toast && (
              <span className={`toast toast-${toast.type}`}>{toast.msg}</span>
            )}
          </div>
        )}

        {/* ══ Cards grid ════════════════════════════════════════════ */}
        {loading ? (
          <div className="cards-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, border: "2px solid #e8eaed", padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="skel" style={{ width: 110, height: 11 }} />
                  <div className="skel" style={{ width: 70, height: 20, borderRadius: 20 }} />
                </div>
                <div className="skel" style={{ width: "75%", height: 18, marginBottom: 6 }} />
                <div className="skel" style={{ width: "50%", height: 13, marginBottom: 14 }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <div className="skel" style={{ width: 100, height: 26, borderRadius: 6 }} />
                  <div className="skel" style={{ width: 80, height: 26, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 52, opacity: .15, marginBottom: 14 }}>📦</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No orders on {fmtDateLabel(date)}</p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Use the arrows to check another day</p>
          </div>
        ) : (
          <div className="cards-grid">
            {orders.map(o => (
              <OrderCard
                key={o._id}
                order={o}
                checked={selectedIds.has(o._id)}
                onToggle={() => toggleCard(o._id)}
              />
            ))}
          </div>
        )}

        {/* ══ Pagination ════════════════════════════════════════════ */}
        {meta && meta.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 28, alignItems: "center" }}>
            <PagBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</PagBtn>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p); return acc;
              }, [])
              .map((p, i) =>
                p === "…"
                  ? <span key={`e${i}`} style={{ color: "#9ca3af" }}>…</span>
                  : <PagBtn key={p} active={p === page} onClick={() => setPage(p as number)}>{p}</PagBtn>
              )}
            <PagBtn disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>→</PagBtn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ORDER CARD
═══════════════════════════════════════════════════════════════════ */

function OrderCard({ order: o, checked, onToggle }: {
  order: Order; checked: boolean; onToggle: () => void;
}) {
  const st = STATUS[o.status] || STATUS.pending;

  return (
    <div
      className={`ocard${checked ? " checked" : ""}`}
      onClick={onToggle}
    >
      {/* Header: order# + time + checkbox */}
      <div className="card-header">
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: "black", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>
            {o.orderNumber}
          </div>
          {/* <div style={{ fontSize: 11, color: "#c4c9d4", fontFamily: "'DM Mono', monospace" }}>
            {fmtTime(o.createdAt)}
          </div> */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.2, marginBottom: 3 }}>
            {o.delivery?.fullName || "—"}
          </div>
        </div>


        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          <div className={`cb${checked ? " on" : ""}`} onClick={e => { e.stopPropagation(); onToggle(); }}>
            {checked ? "✓" : ""}
          </div>
        </div>
      </div>
      {/* Body: customer + products */}
      <div className="card-body">

        {/* <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#4f46e5", fontWeight: 500, marginBottom: 12 }}>
          {o.delivery?.phone || "—"}
        </div> */}

        {/* Products - big name + quantity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
          {o.items?.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>{item.snapshot.name}</div>
                {item.size && <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 1 }}>Size: {item.size}</div>}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "black", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>×{item.quantity}</div>
            </div>
          ))}
          {o.addons?.map((a, i) => (
            <div key={`a${i}`} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#7e22ce", lineHeight: 1.2 }}>{a.snapshot.name}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#7e22ce", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>×{a.quantity}</div>
            </div>
          ))}
        </div>

        {o.adminNote && (
          <div style={{ marginTop: 10, fontSize: 11, color: "#6b7280", fontStyle: "italic", background: "#f9fafb", borderRadius: 6, padding: "5px 8px", borderLeft: "3px solid #e5e7eb" }}>
            {o.adminNote}
          </div>
        )}
      </div>

      {/* Footer: payment method + view link */}
      <div className="card-footer">
        <div>
          {/* {o.payment?.method && (
            <span style={{ fontSize: 11, fontWeight: 700, color: o.payment.method === "Bkash" ? "#be185d" : "#475569", background: o.payment.method === "Bkash" ? "#fdf2f8" : "#f1f5f9", padding: "2px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
              {o.payment.method}
              {o.payment.method === "COD" && o.payment.cod?.confirmed && " ✓"}
            </span>
          )} */}
          <span className="sbadge" style={{ background: st.bg, color: st.color }}>
            <span className="sdot" style={{ background: st.dot }} />
            {st.label}
          </span>
        </div>
        <a
          href={`/admin/orders/${o._id}`}
          style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700, textDecoration: "none", padding: "4px 10px", border: "1.5px solid #e0e7ff", borderRadius: 7, background: "#f5f3ff" }}
          onClick={e => e.stopPropagation()}
        >
          View →
        </a>
      </div>
    </div>
  );
}

/* ─── Pagination button ─────────────────────────────────────────── */

function PagBtn({ children, active, disabled, onClick }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 34, height: 34, borderRadius: 8,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      background: active ? "#1f2937" : "white",
      color: active ? "white" : "#6b7280",
      border: `1.5px solid ${active ? "#1f2937" : "#e5e7eb"}`,
      opacity: disabled ? .35 : 1,
      fontFamily: "'DM Sans', sans-serif",
    }}>{children}</button>
  );
}