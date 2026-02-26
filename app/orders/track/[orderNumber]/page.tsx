"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

/* ─────────────────────── types ─────────────────────── */

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface OrderSnapshot {
  name: string;
  slug?: string;
  imageUrl?: string;
  unitPrice: number;
  effectiveUnitPrice: number;
  currency: string;
  discount?: { type: string | null; value: number | null };
}

interface OrderItem {
  product: { _id: string; name: string; slug: string; images?: string[] };
  snapshot: OrderSnapshot;
  size: string | null;
  quantity: number;
  subtotal: number;
}

interface OrderAddon {
  addon: { _id: string; name: string; image?: string };
  snapshot: { name: string; imageUrl?: string; unitPrice: number; currency: string };
  customerNote: string | null;
  quantity: number;
  subtotal: number;
}

interface Pricing {
  itemsSubtotal: number;
  addonsSubtotal: number;
  subtotalBeforePromo?: number;
  promoDiscount: number;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  currency: string;
}

interface Delivery {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  thana: string;
  zilla: string;
  country: string;
  note?: string | null;
}

interface Payment {
  method: "COD" | "Bkash";
  cod?: { confirmed: boolean };
  bkash?: { customerPhone: string | null; transactionId: string | null };
  paidAt?: string | null;
}

interface PromoSnap {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  addons: OrderAddon[];
  pricing: Pricing;
  delivery: Delivery;
  payment: Payment;
  promo: PromoSnap | null;
  createdAt: string;
  updatedAt: string;
}

/* ─────────────────────── status config ─────────────────────── */

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; icon: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Order Placed",
    description: "We've received your order and are reviewing it.",
    icon: "📋",
    color: "var(--bw-amber)",
    bgColor: "#fffbeb",
  },
  confirmed: {
    label: "Confirmed",
    description: "Your order has been confirmed and is queued for processing.",
    icon: "✅",
    color: "var(--bw-blue)",
    bgColor: "var(--bw-blue-bg)",
  },
  processing: {
    label: "Processing",
    description: "Your items are being picked and packed.",
    icon: "📦",
    color: "var(--bw-indigo)",
    bgColor: "var(--bw-indigo-bg)",
  },
  shipped: {
    label: "Shipped",
    description: "Your order is on its way to you.",
    icon: "🚚",
    color: "#0891b2",
    bgColor: "#ecfeff",
  },
  delivered: {
    label: "Delivered",
    description: "Your order has been delivered. Enjoy!",
    icon: "🎉",
    color: "var(--bw-green)",
    bgColor: "var(--bw-green-bg)",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order has been cancelled.",
    icon: "✕",
    color: "var(--bw-red)",
    bgColor: "var(--bw-red-bg)",
  },
  refunded: {
    label: "Refunded",
    description: "A refund has been issued for this order.",
    icon: "↩",
    color: "var(--bw-muted)",
    bgColor: "var(--bw-bg-alt)",
  },
};

/* ─────────────────────── helpers ─────────────────────── */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function fmt(n: number, currency = "BDT") {
  return `${currency === "BDT" ? "৳" : currency}${n.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStepIndex(status: OrderStatus): number {
  const idx = STATUS_STEPS.indexOf(status);
  return idx === -1 ? -1 : idx; // -1 for cancelled/refunded
}

/* ─────────────────────── search form ─────────────────────── */

function SearchForm({ onSearch }: { onSearch: (num: string) => void }) {
  const [input, setInput] = useState("");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "var(--bw-bg)" }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-12">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--bw-ghost)" }}
          >
            onBazar
          </p>
          <h1
            className="text-4xl leading-tight"
            style={{
              fontFamily: "var(--bw-font-display)",
              color: "var(--bw-ink)",
            }}
          >
            Track Your
            <br />
            <em>Order</em>
          </h1>
          <p
            className="mt-4 text-sm"
            style={{ color: "var(--bw-muted)", fontFamily: "var(--bw-font-body)" }}
          >
            Enter your order number to see live status updates.
          </p>
        </div>

        {/* Input */}
        <div
          className="rounded-2xl p-1 flex gap-2"
          style={{
            background: "var(--bw-bg-alt)",
            border: "1px solid var(--bw-border)",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && input.trim() && onSearch(input.trim())}
            placeholder="ORD-20250101-0001"
            spellCheck={false}
            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:opacity-40"
            style={{
              fontFamily: "var(--bw-font-mono)",
              color: "var(--bw-ink)",
              letterSpacing: "0.06em",
            }}
          />
          <button
            onClick={() => input.trim() && onSearch(input.trim())}
            disabled={!input.trim()}
            className="px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
            style={{
              background: "var(--bw-ink)",
              color: "var(--bw-bg)",
              fontFamily: "var(--bw-font-body)",
            }}
          >
            Track →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── timeline ─────────────────────── */

function StatusTimeline({ status }: { status: OrderStatus }) {
  const isCancelled = status === "cancelled" || status === "refunded";
  const currentMeta = STATUS_META[status];
  const activeIdx = getStepIndex(status);

  if (isCancelled) {
    return (
      <div
        className="rounded-2xl p-6 flex items-start gap-4"
        style={{ background: currentMeta.bgColor, border: `1px solid var(--bw-border)` }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
        >
          {currentMeta.icon}
        </div>
        <div>
          <p
            className="text-base font-black tracking-tight"
            style={{ color: currentMeta.color, fontFamily: "var(--bw-font-body)" }}
          >
            {currentMeta.label}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--bw-muted)" }}>
            {currentMeta.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
    >
      {/* Active status banner */}
      <div
        className="rounded-xl p-4 mb-6 flex items-center gap-3"
        style={{ background: currentMeta.bgColor }}
      >
        <span className="text-2xl">{currentMeta.icon}</span>
        <div>
          <p
            className="text-sm font-black"
            style={{ color: currentMeta.color, fontFamily: "var(--bw-font-body)" }}
          >
            {currentMeta.label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--bw-muted)" }}>
            {currentMeta.description}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connector line */}
        <div
          className="absolute left-[19px] top-5 bottom-5 w-px"
          style={{ background: "var(--bw-border)" }}
        />
        {/* Progress fill */}
        <div
          className="absolute left-[19px] top-5 w-px transition-all duration-700"
          style={{
            background: "var(--bw-ink)",
            height: `${(activeIdx / (STATUS_STEPS.length - 1)) * 100}%`,
          }}
        />

        <div className="space-y-0">
          {STATUS_STEPS.map((step, idx) => {
            const meta = STATUS_META[step];
            const isDone = idx < activeIdx;
            const isActive = idx === activeIdx;
            const isPending = idx > activeIdx;

            return (
              <div key={step} className="relative flex items-start gap-4 pb-6 last:pb-0">
                {/* Node */}
                <div
                  className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: isDone || isActive ? "var(--bw-ink)" : "var(--bw-surface)",
                    border: isPending ? "2px solid var(--bw-border)" : "2px solid var(--bw-ink)",
                  }}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: "var(--bw-border)" }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="pt-2">
                  <p
                    className="text-sm font-bold leading-none"
                    style={{
                      color: isPending ? "var(--bw-ghost)" : "var(--bw-ink)",
                      fontFamily: "var(--bw-font-body)",
                    }}
                  >
                    {meta.label}
                  </p>
                  {isActive && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--bw-muted)" }}
                    >
                      {meta.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── order page ─────────────────────── */

function OrderDetails({ order }: { order: Order }) {
  const meta = STATUS_META[order.status];
  const cur = order.pricing.currency || "BDT";

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bw-bg-alt)", fontFamily: "var(--bw-font-body)" }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          background: "var(--bw-surface)",
          borderColor: "var(--bw-border)",
        }}
      >
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <span
            className="text-base font-black tracking-tight"
            style={{ color: "var(--bw-ink)", fontFamily: "var(--bw-font-display)" }}
          >
            on<em>Bazar</em>
          </span>
          <span
            className="text-xs px-3 py-1 rounded-full font-bold"
            style={{
              background: meta.bgColor,
              color: meta.color,
            }}
          >
            {meta.label}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-5">

        {/* ── Order number + date ── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
            style={{ color: "var(--bw-ghost)" }}
          >
            Order Number
          </p>
          <p
            className="text-2xl font-black tracking-widest mb-1"
            style={{ fontFamily: "var(--bw-font-mono)", color: "var(--bw-ink)" }}
          >
            {order.orderNumber}
          </p>
          <p className="text-xs" style={{ color: "var(--bw-muted)" }}>
            Placed {fmtDate(order.createdAt)}
          </p>
        </div>

        {/* ── Status timeline ── */}
        <StatusTimeline status={order.status} />

        {/* ── Items ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
        >
          <div
            className="px-6 py-4 border-b flex items-center gap-2"
            style={{ borderColor: "var(--bw-divider)" }}
          >
            <span className="text-base">📦</span>
            <span className="text-sm font-bold" style={{ color: "var(--bw-ink)" }}>
              Your Items
            </span>
            <span
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--bw-bg-alt)", color: "var(--bw-muted)" }}
            >
              {order.items.length + order.addons.length}
            </span>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--bw-divider)" }}>
            {order.items.map((item, i) => {
              const hasDiscount =
                item.snapshot.effectiveUnitPrice < item.snapshot.unitPrice;
              return (
                <div key={i} className="px-6 py-4 flex gap-4 items-start">
                  {item.snapshot.imageUrl ? (
                    <img
                      src={item.snapshot.imageUrl}
                      alt={item.snapshot.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      style={{ border: "1px solid var(--bw-border)" }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                      style={{ background: "var(--bw-bg-alt)" }}
                    >
                      📷
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: "var(--bw-ink)" }}
                    >
                      {item.snapshot.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.size && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--bw-bg-alt)",
                            color: "var(--bw-muted)",
                          }}
                        >
                          Size {item.size}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--bw-muted)" }}>
                        Qty {item.quantity}
                      </span>
                      {hasDiscount && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "#ecfdf5", color: "var(--bw-green)" }}
                        >
                          Sale
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span
                        className="text-sm font-black"
                        style={{ color: "var(--bw-ink)" }}
                      >
                        {fmt(item.snapshot.effectiveUnitPrice, cur)}
                      </span>
                      {hasDiscount && (
                        <span
                          className="text-xs line-through"
                          style={{ color: "var(--bw-ghost)" }}
                        >
                          {fmt(item.snapshot.unitPrice, cur)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-sm font-black"
                      style={{ color: "var(--bw-ink)" }}
                    >
                      {fmt(item.subtotal, cur)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Addons */}
            {order.addons.map((a, i) => (
              <div key={`addon-${i}`} className="px-6 py-4 flex gap-4 items-start">
                {a.snapshot.imageUrl ? (
                  <img
                    src={a.snapshot.imageUrl}
                    alt={a.snapshot.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    style={{ border: "1px solid var(--bw-border)" }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                    style={{ background: "var(--bw-bg-alt)" }}
                  >
                    🎁
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: "var(--bw-ink)" }}
                    >
                      {a.snapshot.name}
                    </p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "#fdf4ff", color: "#9333ea" }}
                    >
                      Add-on
                    </span>
                  </div>
                  {a.customerNote && (
                    <p
                      className="text-xs mt-0.5 italic"
                      style={{ color: "var(--bw-muted)" }}
                    >
                      "{a.customerNote}"
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "var(--bw-muted)" }}>
                    Qty {a.quantity}
                  </p>
                </div>
                <p
                  className="text-sm font-black flex-shrink-0"
                  style={{ color: "var(--bw-ink)" }}
                >
                  {fmt(a.subtotal, cur)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pricing summary ── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4"
            style={{ color: "var(--bw-ghost)" }}
          >
            Order Summary
          </p>

          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--bw-muted)" }}>Items</span>
              <span className="font-semibold" style={{ color: "var(--bw-ink)" }}>
                {fmt(order.pricing.itemsSubtotal, cur)}
              </span>
            </div>

            {order.pricing.addonsSubtotal > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--bw-muted)" }}>Add-ons</span>
                <span className="font-semibold" style={{ color: "var(--bw-ink)" }}>
                  {fmt(order.pricing.addonsSubtotal, cur)}
                </span>
              </div>
            )}

            {order.promo && order.pricing.promoDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: "#059669" }}>
                  Promo code
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{
                      background: "#ecfdf5",
                      color: "#065f46",
                      fontFamily: "var(--bw-font-mono)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {order.promo.code}
                  </span>
                </span>
                <span className="font-bold" style={{ color: "#059669" }}>
                  − {fmt(order.pricing.promoDiscount, cur)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--bw-muted)" }}>Delivery</span>
              <span className="font-semibold" style={{ color: "var(--bw-ink)" }}>
                {fmt(order.pricing.deliveryCharge, cur)}
              </span>
            </div>

            <div
              className="flex justify-between pt-3 border-t"
              style={{ borderColor: "var(--bw-divider)" }}
            >
              <span className="text-base font-black" style={{ color: "var(--bw-ink)" }}>
                Grand Total
              </span>
              <span
                className="text-lg font-black"
                style={{ color: "var(--bw-ink)", fontFamily: "var(--bw-font-display)" }}
              >
                {fmt(order.pricing.grandTotal, cur)}
              </span>
            </div>

            {order.promo && order.pricing.promoDiscount > 0 && (
              <div
                className="mt-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
                style={{ background: "#ecfdf5", color: "#065f46" }}
              >
                🎉 You saved {fmt(order.pricing.promoDiscount, cur)} with your promo code!
              </div>
            )}
          </div>
        </div>

        {/* ── Delivery info ── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4"
            style={{ color: "var(--bw-ghost)" }}
          >
            Delivering To
          </p>
          <p className="text-sm font-black mb-1" style={{ color: "var(--bw-ink)" }}>
            {order.delivery.fullName}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--bw-ink-secondary)" }}>
            {order.delivery.address}
            <br />
            {order.delivery.thana}, {order.delivery.zilla}
            <br />
            {order.delivery.country}
          </p>
          <div
            className="mt-4 pt-4 border-t grid grid-cols-2 gap-3"
            style={{ borderColor: "var(--bw-divider)" }}
          >
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
                style={{ color: "var(--bw-ghost)" }}
              >
                Phone
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--bw-ink)" }}>
                {order.delivery.phone}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
                style={{ color: "var(--bw-ghost)" }}
              >
                Email
              </p>
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--bw-ink)" }}
              >
                {order.delivery.email}
              </p>
            </div>
          </div>
          {order.delivery.note && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-xs italic"
              style={{
                background: "var(--bw-bg-alt)",
                color: "var(--bw-muted)",
              }}
            >
              Note: "{order.delivery.note}"
            </div>
          )}
        </div>

        {/* ── Payment method ── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4"
            style={{ color: "var(--bw-ghost)" }}
          >
            Payment
          </p>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                background:
                  order.payment.method === "Bkash" ? "#fce7f3" : "var(--bw-bg-alt)",
              }}
            >
              {order.payment.method === "Bkash" ? "📱" : "💵"}
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: "var(--bw-ink)" }}>
                {order.payment.method === "COD" ? "Cash on Delivery" : "Bkash"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--bw-muted)" }}>
                {order.payment.method === "COD"
                  ? order.payment.cod?.confirmed
                    ? "✓ Payment confirmed"
                    : "Pay on delivery"
                  : `Txn: ${order.payment.bkash?.transactionId || "—"}`}
              </p>
            </div>
            {order.payment.paidAt && (
              <span
                className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "#ecfdf5", color: "var(--bw-green)" }}
              >
                Paid
              </span>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="pb-4 text-center">
          <p className="text-xs" style={{ color: "var(--bw-ghost)" }}>
            Need help?{" "}
            <a
              href="mailto:support@onbazar.com"
              className="underline underline-offset-2 hover:opacity-70 transition-opacity"
              style={{ color: "var(--bw-muted)" }}
            >
              Contact support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────── loading skeleton ─────────────────────── */

function Skeleton() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bw-bg-alt)", fontFamily: "var(--bw-font-body)" }}
    >
      <header
        className="sticky top-0 z-20 border-b"
        style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)" }}
      >
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center">
          <div
            className="h-5 w-24 rounded-full animate-pulse"
            style={{ background: "var(--bw-border)" }}
          />
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-4">
        {[120, 280, 200, 160].map((h, i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse"
            style={{ height: h, background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── not found ─────────────────────── */

function NotFound({ orderNumber, onReset }: { orderNumber: string; onReset: () => void }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "var(--bw-bg)" }}
    >
      <div className="text-center max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6"
          style={{ background: "var(--bw-bg-alt)", border: "1px solid var(--bw-border)" }}
        >
          🔍
        </div>
        <h2
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
        >
          Order Not Found
        </h2>
        <p className="text-sm mb-2" style={{ color: "var(--bw-muted)" }}>
          We couldn't find an order matching
        </p>
        <p
          className="text-sm font-black mb-6 px-3 py-1.5 rounded-lg inline-block"
          style={{
            fontFamily: "var(--bw-font-mono)",
            background: "var(--bw-bg-alt)",
            color: "var(--bw-ink)",
            letterSpacing: "0.06em",
          }}
        >
          {orderNumber}
        </p>
        <br />
        <button
          onClick={onReset}
          className="text-sm font-bold underline underline-offset-2 hover:opacity-70 transition-opacity"
          style={{ color: "var(--bw-ink)" }}
        >
          Try a different order number
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── page ─────────────────────── */

export default function TrackOrderPage() {
  const params = useParams();
  const routeOrderNumber = params?.orderNumber as string | undefined;

  const [orderNumber, setOrderNumber] = useState<string>(routeOrderNumber || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "not_found" | "error">(
    routeOrderNumber ? "loading" : "idle"
  );

  const fetchOrder = useCallback(async (num: string) => {
    setStatus("loading");
    setOrder(null);
    try {
      const res = await fetch(`${API}/orders/track/${encodeURIComponent(num)}`);
      if (res.status === 404) { setStatus("not_found"); return; }
      if (!res.ok) { setStatus("error"); return; }
      const data = await res.json();
      setOrder(data.data);
      setStatus("found");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (routeOrderNumber) {
      setOrderNumber(routeOrderNumber);
      fetchOrder(routeOrderNumber);
    }
  }, [routeOrderNumber, fetchOrder]);

  function handleSearch(num: string) {
    setOrderNumber(num);
    fetchOrder(num);
    // Update URL without hard navigation
    window.history.pushState({}, "", `/orders/track/${encodeURIComponent(num)}`);
  }

  function handleReset() {
    setStatus("idle");
    setOrder(null);
    setOrderNumber("");
    window.history.pushState({}, "", "/orders/track");
  }

  if (status === "idle") return <SearchForm onSearch={handleSearch} />;
  if (status === "loading") return <Skeleton />;
  if (status === "not_found") return <NotFound orderNumber={orderNumber} onReset={handleReset} />;
  if (status === "error")
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{ background: "var(--bw-bg)" }}
      >
        <div className="text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-sm font-bold mb-4" style={{ color: "var(--bw-ink)" }}>
            Something went wrong. Please try again.
          </p>
          <button
            onClick={handleReset}
            className="text-sm underline underline-offset-2"
            style={{ color: "var(--bw-muted)" }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  if (status === "found" && order) return <OrderDetails order={order} />;
  return null;
}