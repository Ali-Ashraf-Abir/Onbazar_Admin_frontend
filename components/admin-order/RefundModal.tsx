"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../lib/api";

/* ── Types ──────────────────────────────────────────── */
interface OrderItem {
  product: { _id: string; name: string; slug: string };
  snapshot: { name: string; imageUrl: string | null; effectiveUnitPrice: number; currency: string };
  size: string | null;
  quantity: number;
  subtotal: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  pricing: { subtotal: number; currency: string };
  items: OrderItem[];
  payment: { method: string };
  delivery: { fullName: string; phone: string };
}

interface RefundModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

/**
 * UI modes — these map to backend refund.type as follows:
 *
 *   "full"           → type: "full"     — full amount returned
 *   "partial_amount" → type: "partial"  — custom amount returned, rest kept
 *   "partial_items"  → type: "partial"  — item-based amount returned, rest kept
 *   "damaged"        → type: "damaged"  — goods damaged, cost is a loss
 *   "fraud"          → type: "fraud"    — fake order, cost is a loss
 */
type RefundMode = "full" | "partial_amount" | "partial_items" | "damaged" | "fraud";

/** Maps UI mode to the backend refund.type field */
function toBackendType(mode: RefundMode): "full" | "partial" | "damaged" | "fraud" {
  if (mode === "partial_amount" || mode === "partial_items") return "partial";
  return mode; // "full" | "damaged" | "fraud" pass through unchanged
}

/* ── helpers ────────────────────────────────────────── */
function fmt(n: number, _currency = "BDT") {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/* ═══════════════════════════════════════════════════
   REFUND MODAL
   ═══════════════════════════════════════════════════ */
export default function RefundModal({ order, onClose, onSuccess }: RefundModalProps) {
  const [mode, setMode]               = useState<RefundMode>("full");
  const [customAmount, setCustomAmount] = useState<string>(order.pricing.subtotal.toFixed(2));
  const [itemQtys, setItemQtys]       = useState<number[]>(order.items.map((i) => i.quantity));
  const [note, setNote]               = useState("");
  const [status, setStatus]           = useState<"refunded" | "cancelled">("refunded");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const backdropRef                   = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // When mode changes, reset customAmount to a sensible default
  function handleModeChange(next: RefundMode) {
    setMode(next);
    if (next === "full" || next === "damaged" || next === "fraud") {
      // For non-partial modes the amount always equals the full subtotal
      setCustomAmount(order.pricing.subtotal.toFixed(2));
    }
  }

  /* ── Derived values ─────────────────────────────── */
  const itemsRefundTotal = order.items.reduce((sum, item, idx) => {
    return sum + item.snapshot.effectiveUnitPrice * (itemQtys[idx] ?? 0);
  }, 0);

  const computedRefundAmount: number = (() => {
    if (mode === "full")           return order.pricing.subtotal;
    if (mode === "damaged")        return order.pricing.subtotal; // full amount for analytics, type handles the accounting
    if (mode === "fraud")          return order.pricing.subtotal;
    if (mode === "partial_amount") return parseFloat(customAmount) || 0;
    if (mode === "partial_items")  return itemsRefundTotal;
    return 0;
  })();

  const refundPercent = order.pricing.subtotal > 0
    ? Math.min(100, (computedRefundAmount / order.pricing.subtotal) * 100)
    : 0;

  const isPartial = mode === "partial_amount" || mode === "partial_items";

  /* ── Build request body ──────────────────────────── */
  function buildBody() {
    // refund.type is the critical field that was missing before.
    // The backend uses it to correctly compute netRevenue and netProfit.
    const refund: Record<string, unknown> = {
      type:   toBackendType(mode),           // ← THE FIX: always send explicit type
      amount: computedRefundAmount,          // always a JS number, never a string
      note:   note.trim() || null,
    };

    // For item-based partial refunds, also send the items array
    // so the backend knows which stock quantities to restore
    if (mode === "partial_items") {
      refund.items = order.items
        .map((_, idx) => ({ itemIndex: idx, quantity: itemQtys[idx] ?? 0 }))
        .filter((r) => r.quantity > 0);
    }

    return { status, refund };
  }

  /* ── Submit ──────────────────────────────────────── */
  async function handleSubmit() {
    setError(null);

    if (isPartial && computedRefundAmount <= 0) {
      setError("Refund amount must be greater than 0.");
      return;
    }
    if (isPartial && computedRefundAmount > order.pricing.subtotal) {
      setError(`Cannot refund more than the order total (${fmt(order.pricing.subtotal)}).`);
      return;
    }
    if (mode === "partial_items" && itemsRefundTotal === 0) {
      setError("Select at least one item to refund.");
      return;
    }

    setLoading(true);
    try {
      const body = buildBody();
      const res = await api.patch<{ success: boolean; data: Order }>(
        `/admin/orders/${order._id}`,
        body,
      );
      onSuccess(res.data);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Render ──────────────────────────────────────── */
  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        className="relative bg-[var(--bw-surface)] rounded-[var(--bw-radius-xl)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "var(--bw-shadow-lg)" }}
      >
        {/* ── Header ──────────────────────────────── */}
        <div className="sticky top-0 bg-[var(--bw-surface)] border-b border-[var(--bw-divider)] px-6 py-4 flex items-start justify-between gap-4 rounded-t-[var(--bw-radius-xl)] z-10">
          <div>
            <h2 className="text-base font-semibold text-[var(--bw-ink)]" style={{ fontFamily: "var(--bw-font-display)" }}>
              Issue Refund
            </h2>
            <p className="text-xs text-[var(--bw-muted)] mt-0.5">
              {order.orderNumber} · {order.delivery.fullName} · {fmt(order.pricing.subtotal)} total
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--bw-surface-alt)] text-[var(--bw-muted)] hover:text-[var(--bw-ink)] transition-colors text-lg leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Order status to set ──────────────── */}
          <div>
            <label className="block text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide mb-2">
              Mark order as
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["refunded", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2.5 rounded-[var(--bw-radius-md)] text-sm font-medium border transition-all cursor-pointer ${
                    status === s
                      ? s === "refunded"
                        ? "bg-[var(--bw-blue-bg)] border-[var(--bw-blue)] text-[var(--bw-blue)]"
                        : "bg-[var(--bw-red-bg)] border-[var(--bw-red)] text-[var(--bw-red)]"
                      : "border-[var(--bw-border)] text-[var(--bw-muted)] hover:bg-[var(--bw-surface-alt)]"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Refund mode ──────────────────────── */}
          <div>
            <label className="block text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide mb-2">
              Refund type
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "full",
                  label: "Full refund",
                  desc: `Return the full ${fmt(order.pricing.subtotal)} — all revenue lost`,
                },
                {
                  value: "partial_amount",
                  label: "Partial — custom amount",
                  desc: "Type an exact amount to refund; you keep the rest",
                },
                {
                  value: "partial_items",
                  label: "Partial — select items",
                  desc: "Choose which items and quantities to refund",
                },
                {
                  value: "damaged",
                  label: "Damaged goods",
                  desc: "Item damaged or disposed — cost price recorded as a direct loss",
                },
                {
                  value: "fraud",
                  label: "Fraud / fake order",
                  desc: "Fraudulent order — cost price recorded as a direct loss",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-[var(--bw-radius-md)] border cursor-pointer transition-all ${
                    mode === opt.value
                      ? "border-[var(--bw-ink)] bg-[var(--bw-surface-alt)]"
                      : "border-[var(--bw-border)] hover:border-[var(--bw-border-strong)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="refundMode"
                    value={opt.value}
                    checked={mode === (opt.value as RefundMode)}
                    onChange={() => handleModeChange(opt.value as RefundMode)}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--bw-ink)]">{opt.label}</p>
                    <p className="text-xs text-[var(--bw-ghost)] mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Custom amount input ───────────────── */}
          {mode === "partial_amount" && (
            <div>
              <label className="block text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide mb-2">
                Refund amount (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--bw-muted)] pointer-events-none">৳</span>
                <input
                  type="number"
                  min={0}
                  max={order.pricing.subtotal}
                  step={0.01}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 text-sm rounded-[var(--bw-radius-md)] border border-[var(--bw-border)] bg-[var(--bw-input-bg)] text-[var(--bw-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bw-focus-ring)] focus:border-[var(--bw-ink)]"
                />
              </div>
              <p className="text-xs text-[var(--bw-ghost)] mt-1">Max: {fmt(order.pricing.subtotal)}</p>
            </div>
          )}

          {/* ── Per-item quantity selectors ───────── */}
          {mode === "partial_items" && (
            <div>
              <label className="block text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide mb-2">
                Select items to refund
              </label>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-[var(--bw-radius-md)] border transition-colors ${
                      (itemQtys[idx] ?? 0) > 0
                        ? "border-[var(--bw-ink)] bg-[var(--bw-surface-alt)]"
                        : "border-[var(--bw-border)]"
                    }`}
                  >
                    {/* Image */}
                    <div className="w-9 h-9 shrink-0 rounded-[var(--bw-radius-sm)] bg-[var(--bw-surface-alt)] border border-[var(--bw-border)] overflow-hidden">
                      {item.snapshot.imageUrl
                        ? <img src={item.snapshot.imageUrl} alt={item.snapshot.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[var(--bw-ghost)] text-xs">?</div>
                      }
                    </div>

                    {/* Name + size */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--bw-ink)] truncate">{item.snapshot.name}</p>
                      <p className="text-xs text-[var(--bw-ghost)]">
                        {item.size ? `Size ${item.size} · ` : ""}
                        {fmt(item.snapshot.effectiveUnitPrice)} × {item.quantity}
                      </p>
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setItemQtys((q) => q.map((v, i) => i === idx ? Math.max(0, v - 1) : v))}
                        className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold bg-[var(--bw-surface-alt)] hover:bg-[var(--bw-border)] text-[var(--bw-ink)] transition-colors cursor-pointer"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold text-[var(--bw-ink)] w-5 text-center">
                        {itemQtys[idx] ?? 0}
                      </span>
                      <button
                        onClick={() => setItemQtys((q) => q.map((v, i) => i === idx ? Math.min(item.quantity, v + 1) : v))}
                        className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold bg-[var(--bw-surface-alt)] hover:bg-[var(--bw-border)] text-[var(--bw-ink)] transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right shrink-0 w-16">
                      <p className="text-xs font-semibold text-[var(--bw-ink)]">
                        {fmt(item.snapshot.effectiveUnitPrice * (itemQtys[idx] ?? 0))}
                      </p>
                      <p className="text-xs text-[var(--bw-ghost)]">of {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Refund amount summary bar ─────────── */}
          <div className="bg-[var(--bw-surface-alt)] rounded-[var(--bw-radius-md)] p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--bw-muted)]">Refund amount</span>
              <span className="font-bold text-[var(--bw-ink)] text-base">{fmt(computedRefundAmount)}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[var(--bw-border)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  refundPercent >= 100 ? "bg-[var(--bw-red)]" : "bg-[var(--bw-ink)]"
                }`}
                style={{ width: `${refundPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--bw-ghost)]">
              <span>{refundPercent.toFixed(0)}% of order total</span>
              {isPartial && (
                <span className="text-amber-600 font-medium">
                  ৳{(order.pricing.subtotal - computedRefundAmount).toLocaleString()} kept
                </span>
              )}
            </div>

            {/* Contextual hint per mode */}
            {isPartial && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-[var(--bw-radius-sm)] px-2 py-1.5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Partial refund — the {fmt(order.pricing.subtotal - computedRefundAmount)} difference is counted as recovered revenue in analytics.
              </div>
            )}
            {mode === "damaged" && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-[var(--bw-radius-sm)] px-2 py-1.5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Damaged goods — the cost price of this order will be recorded as a direct loss in analytics.
              </div>
            )}
            {mode === "fraud" && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-[var(--bw-radius-sm)] px-2 py-1.5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Fraud order — cost price recorded as a loss. Tracked separately in the refund analytics breakdown.
              </div>
            )}
          </div>

          {/* ── Note ─────────────────────────────── */}
          <div>
            <label className="block text-xs font-medium text-[var(--bw-muted)] uppercase tracking-wide mb-2">
              Reason / note <span className="normal-case font-normal">(optional — shown in analytics)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Wrong size, customer changed mind, item damaged…"
              className="w-full px-3 py-2.5 text-sm rounded-[var(--bw-radius-md)] border border-[var(--bw-border)] bg-[var(--bw-input-bg)] text-[var(--bw-ink)] placeholder:text-[var(--bw-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--bw-focus-ring)] focus:border-[var(--bw-ink)] resize-none"
            />
          </div>

          {/* ── Error ────────────────────────────── */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-[var(--bw-red)] bg-[var(--bw-red-bg)] rounded-[var(--bw-radius-md)] px-3 py-2.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────── */}
        <div className="sticky bottom-0 bg-[var(--bw-surface)] border-t border-[var(--bw-divider)] px-6 py-4 flex items-center gap-3 rounded-b-[var(--bw-radius-xl)]">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-[var(--bw-radius-md)] border border-[var(--bw-border)] text-[var(--bw-muted)] hover:bg-[var(--bw-surface-alt)] hover:text-[var(--bw-ink)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || computedRefundAmount <= 0}
            className={`flex-[2] px-4 py-2.5 text-sm font-semibold rounded-[var(--bw-radius-md)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
              status === "cancelled"
                ? "bg-[var(--bw-red)] hover:opacity-90 text-white"
                : "bg-[var(--bw-ink)] hover:opacity-90 text-[var(--bw-bg)]"
            }`}
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {loading
              ? "Processing…"
              : `${status === "cancelled" ? "Cancel Order" : "Issue Refund"} · ${fmt(computedRefundAmount)}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}