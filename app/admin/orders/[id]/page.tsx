"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL as string;

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Pending"    },
  confirmed:  { bg: "rgba(59,130,246,0.12)",  color: "#2563eb", label: "Confirmed"  },
  processing: { bg: "rgba(99,102,241,0.12)",  color: "#4f46e5", label: "Processing" },
  shipped:    { bg: "rgba(139,92,246,0.12)",  color: "#7c3aed", label: "Shipped"    },
  delivered:  { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Delivered"  },
  cancelled:  { bg: "rgba(239,68,68,0.12)",   color: "#dc2626", label: "Cancelled"  },
  refunded:   { bg: "rgba(249,115,22,0.12)",  color: "#ea580c", label: "Refunded"   },
};

const PAYMENT_STYLES: Record<string, { bg: string; color: string }> = {
  COD:   { bg: "rgba(100,116,139,0.12)", color: "#475569" },
  Bkash: { bg: "rgba(236,72,153,0.12)", color: "#db2777" },
};

function fmt(n: number | null | undefined, currency = "BDT") {
  if (n == null) return "—";
  return `${currency === "BDT" ? "৳" : currency}${n.toFixed(2)}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}

/* ═══════════════════════════════════════════════════════ */

export default function AdminOrderDetailPage() {
  const params  = useParams();
  const id      = params?.id as string;

  const [order,      setOrder]      = useState<any>(null);
  const [saving,     setSaving]     = useState(false);
  const [newStatus,  setNewStatus]  = useState("");
  const [adminNote,  setAdminNote]  = useState("");
  const [codConfirm, setCodConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/admin/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setOrder(d.data);
          setNewStatus(d.data.status);
          setAdminNote(d.data.adminNote || "");
          setCodConfirm(d.data.payment?.cod?.confirmed || false);
        }
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const body: any = { status: newStatus, adminNote: adminNote || null };
      if (order.payment?.method === "COD") body.payment = { cod: { confirmed: codConfirm } };
      const res  = await fetch(`${API}/admin/orders/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Update failed"); return; }
      setOrder(data.data);
      alert("Order updated!");
    } finally { setSaving(false); }
  }

  /* ── Loading ── */
  if (!order) return (
    <div
      className="flex items-center gap-3 p-10 text-[14px]"
      style={{ fontFamily: "var(--bw-font-body)", color: "var(--bw-muted)" }}
    >
      <span className="as-spinner" /> Loading order…
    </div>
  );

  const cur = order.pricing?.currency || "BDT";
  const st  = STATUS_STYLES[order.status]           || STATUS_STYLES.pending;
  const pm  = PAYMENT_STYLES[order.payment?.method] || PAYMENT_STYLES.COD;
  const ana = order.analytics || {};
  const mgn = ana.estimatedProfit;

  /* ── Shared sub-components ── */
  const InfoRow = ({ label, value }: { label: string; value?: string }) => value ? (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--bw-ghost)" }}>{label}</div>
      <div className="text-[13px] font-medium" style={{ color: "var(--bw-ink)" }}>{value}</div>
    </div>
  ) : null;

  const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div
      className={`rounded-[var(--bw-radius-xl)] overflow-hidden ${className}`}
      style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
    >
      {children}
    </div>
  );

  const CardHeader = ({ icon, title, right }: { icon: string; title: string; right?: React.ReactNode }) => (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: "1px solid var(--bw-border)", background: "var(--bw-surface-alt)" }}
    >
      <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "var(--bw-ink)" }}>
        <span>{icon}</span>{title}
      </div>
      {right}
    </div>
  );

  const Badge = ({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) => (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold tracking-wide"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );

  /* ─────────────────────────────────────────────── */

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "var(--bw-font-body)", background: "var(--bw-bg)", color: "var(--bw-ink)" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        {/* ── Title row ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="text-[26px] font-bold tracking-wider leading-none"
              style={{ fontFamily: "var(--bw-font-mono)", color: "var(--bw-ink)" }}
            >
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: "var(--bw-muted)" }}>{fmtDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge bg={st.bg} color={st.color}>{st.label}</Badge>
            <a
              href="/admin/orders"
              className="text-[13px] font-semibold transition-opacity hover:opacity-60"
              style={{ color: "var(--bw-muted)", textDecoration: "none" }}
            >
              ← Orders
            </a>
          </div>
        </div>

        {/* ── Analytics bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Revenue",       value: fmt(ana.totalRevenue, cur),             sub: "Items + Add-ons",  special: null },
            { label: "Total Cost",    value: ana.totalItemCost != null ? fmt(ana.totalItemCost, cur) : "Not set", sub: "Product costs", special: ana.totalItemCost == null ? "na" : null },
            { label: "Est. Profit",   value: mgn == null ? "No data" : (mgn >= 0 ? "+" : "") + fmt(mgn, cur), sub: "Revenue − costs", special: mgn == null ? "na" : mgn >= 0 ? "pos" : "neg" },
            { label: "Add-on Revenue",value: fmt(order.pricing?.addonsSubtotal ?? 0, cur), sub: `${order.addons?.length ?? 0} add-on${order.addons?.length !== 1 ? "s" : ""}`, special: null },
          ].map(({ label, value, sub, special }) => (
            <div
              key={label}
              className="rounded-[var(--bw-radius-lg)] p-4"
              style={{ background: "var(--bw-surface)", border: "1.5px solid var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "var(--bw-ghost)" }}>{label}</div>
              <div
                className="text-[20px] font-bold tracking-tight tabular-nums"
                style={{
                  color: special === "pos" ? "var(--bw-green)"
                       : special === "neg" ? "var(--bw-red)"
                       : special === "na"  ? "var(--bw-ghost)"
                       : "var(--bw-ink)",
                  fontSize: special === "na" ? 14 : undefined,
                }}
              >
                {value}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--bw-muted)" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Additional costs ── */}
        {ana.totalAdditionalCosts && Object.keys(ana.totalAdditionalCosts).length > 0 && (
          <SectionCard className="mb-5">
            <CardHeader icon="📊" title="Additional Cost Breakdown" />
            <div className="px-5 py-4 flex flex-wrap gap-3">
              {Object.entries(ana.totalAdditionalCosts as Record<string, number>).map(([k, v]) => (
                <div
                  key={k}
                  className="min-w-[110px] rounded-[var(--bw-radius-md)] px-3.5 py-2.5"
                  style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--bw-ghost)" }}>{k}</div>
                  <div className="text-[16px] font-bold" style={{ color: "var(--bw-ink)" }}>{fmt(v, cur)}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Two-col layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ══ LEFT ══ */}
          <div className="flex flex-col gap-4">

            {/* Items card */}
            <SectionCard>
              <CardHeader
                icon="📦"
                title="Order Items"
                right={
                  <span className="text-[12px]" style={{ color: "var(--bw-muted)" }}>
                    {order.items?.length} product{order.items?.length !== 1 ? "s" : ""}
                  </span>
                }
              />
              <div className="px-5 py-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["", "Product", "Qty", "Unit Price", "Subtotal"].map(h => (
                        <th
                          key={h}
                          className="text-left pb-3 text-[10px] font-bold uppercase tracking-[0.07em]"
                          style={{ color: "var(--bw-ghost)", paddingLeft: h === "" ? 0 : 10, paddingRight: 10 }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item: any, i: number) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--bw-divider)" }}>
                        <td className="py-3 pr-3">
                          {item.snapshot?.imageUrl ? (
                            <img
                              src={item.snapshot.imageUrl} alt=""
                              className="w-10 h-10 rounded-[var(--bw-radius-sm)] object-cover block flex-shrink-0"
                              style={{ background: "var(--bw-surface-alt)" }}
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-[var(--bw-radius-sm)] flex items-center justify-center text-base opacity-30"
                              style={{ background: "var(--bw-surface-alt)" }}
                            >📷</div>
                          )}
                        </td>
                        <td className="py-3 px-2.5">
                          <div className="text-[13px] font-semibold" style={{ color: "var(--bw-ink)" }}>{item.snapshot?.name}</div>
                          {item.size && <div className="text-[11px] mt-0.5" style={{ color: "var(--bw-muted)" }}>Size: {item.size}</div>}
                          {item.snapshot?.discount?.type && (
                            <div className="text-[11px] mt-0.5" style={{ color: "var(--bw-red)" }}>
                              {item.snapshot.discount.type === "percentage"
                                ? `${item.snapshot.discount.value}% OFF applied`
                                : `৳${item.snapshot.discount.value} OFF applied`}
                            </div>
                          )}
                          {item.snapshot?.unitCost != null && (
                            <div className="text-[10px] mt-0.5 italic" style={{ color: "var(--bw-ghost)" }}>
                              Cost: {fmt(item.snapshot.unitCost, cur)}/unit
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-right">
                          <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--bw-ink)" }}>{item.quantity}</span>
                        </td>
                        <td className="py-3 px-2.5 text-right">
                          <div className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--bw-ink)" }}>
                            {fmt(item.snapshot?.effectiveUnitPrice, cur)}
                          </div>
                          {item.snapshot?.unitPrice !== item.snapshot?.effectiveUnitPrice && (
                            <div className="text-[10px] line-through" style={{ color: "var(--bw-ghost)" }}>
                              {fmt(item.snapshot?.unitPrice, cur)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-right">
                          <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--bw-ink)" }}>{fmt(item.subtotal, cur)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add-ons */}
                {order.addons?.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px" style={{ background: "var(--bw-border)" }} />
                      <div className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "var(--bw-ghost)" }}>Add-ons</div>
                      <div className="flex-1 h-px" style={{ background: "var(--bw-border)" }} />
                    </div>
                    <table className="w-full border-collapse">
                      <tbody>
                        {order.addons.map((a: any, i: number) => (
                          <tr key={i} style={{ borderTop: "1px solid var(--bw-divider)" }}>
                            <td className="py-3 pr-3">
                              {a.snapshot?.imageUrl ? (
                                <img src={a.snapshot.imageUrl} alt="" className="w-10 h-10 rounded-[var(--bw-radius-sm)] object-cover block" style={{ background: "var(--bw-surface-alt)" }} />
                              ) : (
                                <div className="w-10 h-10 rounded-[var(--bw-radius-sm)] flex items-center justify-center text-base opacity-30" style={{ background: "var(--bw-surface-alt)" }}>🎁</div>
                              )}
                            </td>
                            <td className="py-3 px-2.5">
                              <div className="text-[13px] font-semibold" style={{ color: "var(--bw-ink)" }}>{a.snapshot?.name}</div>
                              {a.customerNote && (
                                <div
                                  className="mt-1 text-[11px] italic px-2 py-1 rounded-[var(--bw-radius-sm)]"
                                  style={{ color: "var(--bw-ink-secondary)", background: "var(--bw-bg-alt)", border: "1px solid var(--bw-border)" }}
                                >
                                  "{a.customerNote}"
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-2.5 text-right">
                              <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--bw-ink)" }}>{a.quantity}</span>
                            </td>
                            <td className="py-3 px-2.5 text-right">
                              <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--bw-ink)" }}>{fmt(a.snapshot?.unitPrice, cur)}</span>
                            </td>
                            <td className="py-3 px-2.5 text-right">
                              <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--bw-ink)" }}>{fmt(a.subtotal, cur)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Totals */}
                <div className="mt-4 pt-4" style={{ borderTop: "2px solid var(--bw-border)" }}>
                  {[
                    { label: "Items Subtotal",   value: fmt(order.pricing?.itemsSubtotal, cur),   show: true },
                    { label: "Add-ons Subtotal",  value: fmt(order.pricing?.addonsSubtotal, cur),  show: (order.pricing?.addonsSubtotal ?? 0) > 0 },
                  ].filter(r => r.show).map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-[13px] py-1">
                      <span style={{ color: "var(--bw-muted)" }}>{label}</span>
                      <span className="font-semibold tabular-nums" style={{ color: "var(--bw-ink)" }}>{value}</span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between text-[16px] font-bold mt-2 pt-3"
                    style={{ borderTop: "1px solid var(--bw-border)", color: "var(--bw-ink)" }}
                  >
                    <span>Grand Total</span>
                    <span className="tabular-nums">{fmt(order.pricing?.subtotal, cur)}</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Delivery card */}
            <SectionCard>
              <CardHeader icon="🚚" title="Delivery" />
              <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  ["Name",    order.delivery?.fullName],
                  ["Phone",   order.delivery?.phone],
                  ["Email",   order.delivery?.email],
                  ["Zilla",   order.delivery?.zilla],
                  ["Thana",   order.delivery?.thana],
                  ["Country", order.delivery?.country || "Bangladesh"],
                  ["Address", order.delivery?.address],
                  order.delivery?.note ? ["Note", order.delivery.note] : null,
                ].filter(Boolean).map(([label, val]: any) => (
                  <InfoRow key={label} label={label} value={val} />
                ))}
              </div>
            </SectionCard>

            {/* Billing card */}
            <SectionCard>
              <CardHeader
                icon="🧾"
                title="Billing"
                right={order.billing?.sameAsDelivery && (
                  <span className="text-[11px] font-semibold" style={{ color: "var(--bw-muted)" }}>Same as delivery</span>
                )}
              />
              <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Name"  value={order.billing?.fullName} />
                <InfoRow label="Email" value={order.billing?.email} />
                <InfoRow label="Phone" value={order.billing?.phone} />
              </div>
            </SectionCard>
          </div>

          {/* ══ RIGHT SIDEBAR ══ */}
          <div className="flex flex-col gap-4">

            {/* Payment */}
            <SectionCard>
              <CardHeader icon="💳" title="Payment" right={<Badge bg={pm.bg} color={pm.color}>{order.payment?.method}</Badge>} />
              <div className="px-5 py-4">
                {order.payment?.method === "Bkash" && (
                  <div className="flex flex-col gap-3 mb-4">
                    <InfoRow label="Bkash Phone"    value={order.payment.bkash?.customerPhone} />
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--bw-ghost)" }}>Transaction ID</div>
                      <div className="text-[13px] font-medium" style={{ fontFamily: "var(--bw-font-mono)", color: "var(--bw-ink)" }}>
                        {order.payment.bkash?.transactionId}
                      </div>
                    </div>
                  </div>
                )}
                {order.payment?.method === "COD" && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={codConfirm}
                        onChange={e => setCodConfirm(e.target.checked)}
                      />
                      <div
                        className="w-10 h-6 rounded-full transition-colors duration-200 peer-checked:bg-[var(--bw-green)]"
                        style={{ background: codConfirm ? undefined : "var(--bw-border)" }}
                      />
                      <div
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 shadow-sm"
                        style={{
                          background: "white",
                          transform: codConfirm ? "translateX(16px)" : "translateX(0)",
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: "var(--bw-ink)" }}>COD Confirmed</div>
                      <div className="text-[11px]" style={{ color: "var(--bw-muted)" }}>Mark when cash is collected</div>
                    </div>
                  </label>
                )}
              </div>
            </SectionCard>

            {/* Status */}
            <SectionCard>
              <CardHeader icon="📋" title="Order Status" />
              <div className="px-5 py-4">
                <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--bw-ghost)" }}>
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full rounded-[var(--bw-radius-md)] px-3 pr-9 h-10 text-[14px] font-semibold outline-none transition-all duration-150 cursor-pointer"
                  style={{
                    background:      `var(--bw-input-bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center`,
                    border:          "1.5px solid var(--bw-border)",
                    color:           "var(--bw-ink)",
                    fontFamily:      "var(--bw-font-body)",
                    appearance:      "none",
                    WebkitAppearance:"none",
                  }}
                  onFocus={e  => { e.currentTarget.style.borderColor = "var(--bw-border-strong)"; e.currentTarget.style.background = `var(--bw-input-focus) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center`; }}
                  onBlur={e   => { e.currentTarget.style.borderColor = "var(--bw-border)"; e.currentTarget.style.background = `var(--bw-input-bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center`; }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
                  ))}
                </select>
                {newStatus !== order.status && (
                  <div className="mt-2 text-[12px] font-semibold" style={{ color: "var(--bw-amber)" }}>
                    {STATUS_STYLES[order.status]?.label} → {STATUS_STYLES[newStatus]?.label}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Admin note */}
            <SectionCard>
              <CardHeader icon="📝" title="Admin Note" />
              <div className="px-5 py-4">
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Private note — not visible to customer…"
                  className="w-full rounded-[var(--bw-radius-md)] px-3 py-2.5 text-[13px] outline-none resize-none transition-all duration-150"
                  rows={4}
                  style={{
                    background:  "var(--bw-input-bg)",
                    border:      "1.5px solid var(--bw-border)",
                    color:       "var(--bw-ink)",
                    fontFamily:  "var(--bw-font-body)",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--bw-border-strong)"; e.currentTarget.style.background = "var(--bw-input-focus)"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "var(--bw-border)";        e.currentTarget.style.background = "var(--bw-input-bg)"; }}
                />
              </div>
            </SectionCard>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 rounded-[var(--bw-radius-md)] text-[14px] font-bold flex items-center justify-center gap-2 transition-opacity duration-150 disabled:opacity-60"
              style={{
                background:  "var(--bw-ink)",
                color:       "var(--bw-bg)",
                border:      "none",
                cursor:      saving ? "not-allowed" : "pointer",
                fontFamily:  "var(--bw-font-body)",
                boxShadow:   "var(--bw-shadow-md)",
              }}
            >
              {saving ? <><span className="as-spinner" />Saving…</> : "Save Changes →"}
            </button>

            {/* Meta */}
            <div
              className="rounded-[var(--bw-radius-md)] px-4 py-3"
              style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}
            >
              <div className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--bw-ghost)" }}>Order Meta</div>
              <div className="text-[11px] mb-1.5" style={{ color: "var(--bw-muted)" }}>
                ID: <span style={{ fontFamily: "var(--bw-font-mono)" }}>{order._id}</span>
              </div>
              <div className="text-[11px] mb-1.5" style={{ color: "var(--bw-muted)" }}>
                Created: {fmtDate(order.createdAt)}
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className="text-[11px]" style={{ color: "var(--bw-muted)" }}>
                  Updated: {fmtDate(order.updatedAt)}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}