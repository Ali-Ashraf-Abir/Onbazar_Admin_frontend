"use client";

import { useEffect, useState, useCallback } from "react";
import api, { ApiError } from "@/lib/api";
import type { PromoCode } from "@/types/promo";

/* ─────────────────────── helpers ─────────────────────── */

function fmt(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isExpired(code: PromoCode): boolean {
  if (!code.endDate) return false;
  return new Date(code.endDate).getTime() < Date.now();
}

function isNotStarted(code: PromoCode): boolean {
  if (!code.startDate) return false;
  return new Date(code.startDate).getTime() > Date.now();
}

function codeStatus(code: PromoCode): { label: string; color: string } {
  if (!code.isActive)                          return { label: "Inactive",   color: "text-zinc-400 bg-zinc-100" };
  if (isExpired(code))                         return { label: "Expired",    color: "text-amber-600 bg-amber-50" };
  if (isNotStarted(code))                      return { label: "Scheduled",  color: "text-blue-600 bg-blue-50" };
  if (code.usageLimit && code.usageCount >= code.usageLimit)
                                               return { label: "Exhausted",  color: "text-red-500 bg-red-50" };
  return { label: "Active", color: "text-emerald-600 bg-emerald-50" };
}

/* ─────────────────────── form defaults ─────────────────────── */

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage" as "percentage" | "fixed",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  usageLimit: "",
  usageLimitPerUser: "",
  startDate: "",
  endDate: "",
  isActive: true,
  isPublic: false,
};

type FormState = typeof EMPTY_FORM;

/* ─────────────────────── tiny UI atoms ─────────────────────── */

const inp = "w-full bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-3.5 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all placeholder:text-[var(--bw-placeholder)] focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";
const lbl = "block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--bw-muted)] mb-1.5";
const sel = `${inp} appearance-none cursor-pointer`;

function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div className={half ? "" : "col-span-2 sm:col-span-1"}>
      <label className={lbl}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
    >
      <div className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${checked ? "bg-[var(--bw-ink)]" : "bg-[var(--bw-border-strong)]"}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-4.5" : "translate-x-0"}`} />
      </div>
      <span className="text-sm text-[var(--bw-ink-secondary)]">{label}</span>
    </button>
  );
}

/* ─────────────────────── drawer form ─────────────────────── */

function PromoDrawer({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: PromoCode | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === "edit" && initial) {
      return {
        code: initial.code,
        description: initial.description ?? "",
        discountType: initial.discountType,
        discountValue: String(initial.discountValue),
        maxDiscountAmount: initial.maxDiscountAmount != null ? String(initial.maxDiscountAmount) : "",
        minOrderAmount: String(initial.minOrderAmount ?? ""),
        usageLimit: initial.usageLimit != null ? String(initial.usageLimit) : "",
        usageLimitPerUser: initial.usageLimitPerUser != null ? String(initial.usageLimitPerUser) : "",
        startDate: initial.startDate ? initial.startDate.slice(0, 10) : "",
        endDate: initial.endDate ? initial.endDate.slice(0, 10) : "",
        isActive: initial.isActive,
        isPublic: initial.isPublic,
      };
    }
    return EMPTY_FORM;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof FormState, value: unknown) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        isActive: form.isActive,
        isPublic: form.isPublic,
      };
      if (form.description) payload.description = form.description;
      if (form.maxDiscountAmount) payload.maxDiscountAmount = Number(form.maxDiscountAmount);
      if (form.minOrderAmount) payload.minOrderAmount = Number(form.minOrderAmount);
      if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
      if (form.usageLimitPerUser) payload.usageLimitPerUser = Number(form.usageLimitPerUser);
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();

      if (mode === "create") {
        payload.code = form.code.toUpperCase();
        await api.post("/promocodes", payload);
      } else {
        await api.patch(`/promocodes/${initial!._id}`, payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* panel */}
      <div className="relative ml-auto w-full max-w-lg h-full bg-[var(--bw-surface)] shadow-2xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--bw-border)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--bw-muted)] mb-0.5">
              {mode === "create" ? "New" : "Edit"} Promo Code
            </p>
            <h2 className="text-lg font-black text-[var(--bw-ink)] tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
              {mode === "create" ? "Create Promotion" : initial?.code}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[var(--bw-border)] flex items-center justify-center text-[var(--bw-muted)] hover:border-[var(--bw-ink)] hover:text-[var(--bw-ink)] transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
          {error && (
            <div className="bg-[var(--bw-red-bg)] border border-red-200 text-[var(--bw-red)] text-sm rounded-[var(--bw-radius-md)] px-4 py-3">
              {error}
            </div>
          )}

          {/* Code */}
          {mode === "create" && (
            <Field label="Promo Code *">
              <input
                className={inp}
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                style={{ fontFamily: "var(--bw-font-mono)", letterSpacing: "0.1em" }}
              />
            </Field>
          )}

          {/* Description */}
          <Field label="Description">
            <input
              className={inp}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Internal note (not shown to customer)"
            />
          </Field>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount Type *" half>
              <div className="relative">
                <select className={sel} value={form.discountType} onChange={(e) => set("discountType", e.target.value)}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--bw-muted)] pointer-events-none">▼</span>
              </div>
            </Field>
            <Field label={form.discountType === "percentage" ? "Discount % *" : "Discount ৳ *"} half>
              <input
                className={inp}
                type="number"
                min={0}
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
                placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 150"}
              />
            </Field>
          </div>

          {/* Max discount + min order */}
          <div className="grid grid-cols-2 gap-3">
            {form.discountType === "percentage" && (
              <Field label="Max Discount (৳)" half>
                <input
                  className={inp}
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount}
                  onChange={(e) => set("maxDiscountAmount", e.target.value)}
                  placeholder="No cap"
                />
              </Field>
            )}
            <Field label="Min Order Amount (৳)" half>
              <input
                className={inp}
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(e) => set("minOrderAmount", e.target.value)}
                placeholder="No minimum"
              />
            </Field>
          </div>

          {/* Usage limits */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Uses" half>
              <input
                className={inp}
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Per User" half>
              <input
                className={inp}
                type="number"
                min={1}
                value={form.usageLimitPerUser}
                onChange={(e) => set("usageLimitPerUser", e.target.value)}
                placeholder="Unlimited"
              />
            </Field>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date" half>
              <input className={inp} type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            <Field label="End Date" half>
              <input className={inp} type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </Field>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-1">
            <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active (customers can use this code)" />
            <Toggle checked={form.isPublic} onChange={(v) => set("isPublic", v)} label="Public (show on storefront)" />
          </div>
        </div>

        {/* footer */}
        <div className="px-7 py-5 border-t border-[var(--bw-border)] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[var(--bw-radius-md)] border border-[var(--bw-border)] text-sm font-bold text-[var(--bw-muted)] hover:border-[var(--bw-ink)] hover:text-[var(--bw-ink)] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-[var(--bw-radius-md)] bg-[var(--bw-ink)] text-[var(--bw-bg)] text-sm font-bold hover:opacity-80 transition-all disabled:opacity-50"
          >
            {saving ? "Saving…" : mode === "create" ? "Create Code" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── main page ─────────────────────── */

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [drawer, setDrawer] = useState<{ mode: "create" | "edit"; data: PromoCode | null } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set("q", search);
      if (filterActive) params.set("isActive", filterActive);
      const res = await api.get<{ data: PromoCode[]; meta: { total: number } }>(`/promocodes?${params}`);
      setCodes(res.data);
      setTotal(res.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterActive]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete promo code "${code}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/promocodes/${id}`);
      load();
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(c: PromoCode) {
    setTogglingId(c._id);
    try {
      await api.patch(`/promocodes/${c._id}`, { isActive: !c.isActive });
      load();
    } finally {
      setTogglingId(null);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-[var(--bw-bg-alt)]" style={{ fontFamily: "var(--bw-font-body)" }}>
      {drawer && (
        <PromoDrawer
          mode={drawer.mode}
          initial={drawer.data}
          onClose={() => setDrawer(null)}
          onSaved={() => { setDrawer(null); load(); }}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--bw-muted)] mb-1.5">Marketing</p>
            <h1
              className="text-3xl font-black text-[var(--bw-ink)] tracking-tight leading-none"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Promo Codes
            </h1>
            <p className="text-sm text-[var(--bw-muted)] mt-2">
              {total} code{total !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawer({ mode: "create", data: null })}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bw-ink)] text-[var(--bw-bg)] text-sm font-bold rounded-[var(--bw-radius-md)] hover:opacity-80 transition-all shadow-[var(--bw-shadow-sm)]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Code
          </button>
        </div>

        {/* ── Filters bar ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--bw-ghost)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={`${inp} pl-10`}
              placeholder="Search codes…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2">
            {(["", "true", "false"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { setFilterActive(v); setPage(1); }}
                className={`px-4 py-2 rounded-[var(--bw-radius-md)] text-xs font-bold border transition-all
                  ${filterActive === v
                    ? "bg-[var(--bw-ink)] border-[var(--bw-ink)] text-[var(--bw-bg)]"
                    : "bg-[var(--bw-surface)] border-[var(--bw-border)] text-[var(--bw-muted)] hover:border-[var(--bw-ink)] hover:text-[var(--bw-ink)]"}`}
              >
                {v === "" ? "All" : v === "true" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-[var(--bw-surface)] border border-[var(--bw-border)] rounded-[var(--bw-radius-xl)] overflow-hidden shadow-[var(--bw-shadow-sm)]">
          {/* table header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_auto] gap-4 px-6 py-3.5 border-b border-[var(--bw-border)] bg-[var(--bw-bg-alt)]">
            {["Code", "Discount", "Usage", "Validity", "Status", ""].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--bw-muted)]">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="space-y-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_auto] gap-4 px-6 py-4 border-b border-[var(--bw-divider)] last:border-0 animate-pulse">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-4 bg-[var(--bw-border)] rounded-full" style={{ width: `${60 + (j * 13) % 40}%` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bw-bg-alt)] border border-[var(--bw-border)] flex items-center justify-center text-2xl mb-4">🏷️</div>
              <p className="text-sm font-bold text-[var(--bw-ink-secondary)]">No promo codes found</p>
              <p className="text-xs text-[var(--bw-ghost)] mt-1">Create your first promo code to get started</p>
            </div>
          ) : (
            <div>
              {codes.map((c, i) => {
                const status = codeStatus(c);
                const usageBar = c.usageLimit ? (c.usageCount / c.usageLimit) * 100 : null;
                return (
                  <div
                    key={c._id}
                    className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_auto] gap-4 px-6 py-4 items-center border-b border-[var(--bw-divider)] last:border-0 hover:bg-[var(--bw-bg-alt)] transition-colors group ${i % 2 === 0 ? "" : ""}`}
                  >
                    {/* Code */}
                    <div>
                      <span
                        className="text-sm font-black text-[var(--bw-ink)] tracking-widest"
                        style={{ fontFamily: "var(--bw-font-mono)" }}
                      >
                        {c.code}
                      </span>
                      {c.description && (
                        <p className="text-[11px] text-[var(--bw-ghost)] mt-0.5 truncate max-w-[180px]">{c.description}</p>
                      )}
                    </div>

                    {/* Discount */}
                    <div>
                      <span className="text-sm font-bold text-[var(--bw-ink)]">
                        {c.discountType === "percentage" ? `${c.discountValue}%` : fmt(c.discountValue)}
                      </span>
                      {c.discountType === "percentage" && c.maxDiscountAmount && (
                        <p className="text-[11px] text-[var(--bw-ghost)] mt-0.5">max {fmt(c.maxDiscountAmount)}</p>
                      )}
                      {c.minOrderAmount > 0 && (
                        <p className="text-[11px] text-[var(--bw-ghost)] mt-0.5">min {fmt(c.minOrderAmount)}</p>
                      )}
                    </div>

                    {/* Usage */}
                    <div>
                      <span className="text-sm font-semibold text-[var(--bw-ink-secondary)]">
                        {c.usageCount}
                        {c.usageLimit ? <span className="text-[var(--bw-ghost)]"> / {c.usageLimit}</span> : <span className="text-[var(--bw-ghost)]"> uses</span>}
                      </span>
                      {usageBar !== null && (
                        <div className="mt-1.5 h-1 rounded-full bg-[var(--bw-border)] overflow-hidden w-24">
                          <div
                            className={`h-full rounded-full transition-all ${usageBar >= 90 ? "bg-[var(--bw-red)]" : usageBar >= 60 ? "bg-[var(--bw-amber)]" : "bg-[var(--bw-green)]"}`}
                            style={{ width: `${Math.min(usageBar, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Validity */}
                    <div className="text-xs text-[var(--bw-muted)]">
                      {c.startDate || c.endDate ? (
                        <>
                          <span>{fmtDate(c.startDate)}</span>
                          <span className="mx-1 text-[var(--bw-ghost)]">→</span>
                          <span>{fmtDate(c.endDate)}</span>
                        </>
                      ) : (
                        <span className="text-[var(--bw-ghost)]">No expiry</span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        disabled={togglingId === c._id}
                        title={c.isActive ? "Deactivate" : "Activate"}
                        className="w-8 h-8 rounded-[var(--bw-radius-sm)] border border-[var(--bw-border)] text-[var(--bw-muted)] flex items-center justify-center hover:border-[var(--bw-ink)] hover:text-[var(--bw-ink)] transition-all disabled:opacity-40"
                      >
                        {c.isActive ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7"/></svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawer({ mode: "edit", data: c })}
                        title="Edit"
                        className="w-8 h-8 rounded-[var(--bw-radius-sm)] border border-[var(--bw-border)] text-[var(--bw-muted)] flex items-center justify-center hover:border-[var(--bw-ink)] hover:text-[var(--bw-ink)] transition-all"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c._id, c.code)}
                        disabled={deleting === c._id}
                        title="Delete"
                        className="w-8 h-8 rounded-[var(--bw-radius-sm)] border border-[var(--bw-border)] text-[var(--bw-muted)] flex items-center justify-center hover:border-[var(--bw-red)] hover:text-[var(--bw-red)] hover:bg-[var(--bw-red-bg)] transition-all disabled:opacity-40"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-[var(--bw-muted)]">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-[var(--bw-radius-md)] border border-[var(--bw-border)] text-xs font-bold text-[var(--bw-muted)] hover:border-[var(--bw-ink)] hover:text-[var(--bw-ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-[var(--bw-radius-md)] border border-[var(--bw-border)] text-xs font-bold text-[var(--bw-muted)] hover:border-[var(--bw-ink)] hover:text-[var(--bw-ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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