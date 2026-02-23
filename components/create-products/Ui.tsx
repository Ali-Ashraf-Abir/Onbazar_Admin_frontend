import React from "react";

/* ─────────────────────── shared class constants ─────────────────────── */

export const inputCls =
  "w-full bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
  "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-150 " +
  "placeholder:text-[var(--bw-placeholder)] " +
  "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

export const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--bw-muted)]";

export const cardCls =
  "rounded-[var(--bw-radius-xl)] border border-[var(--bw-border)] bg-[var(--bw-surface)] " +
  "shadow-[var(--bw-shadow-sm)] overflow-hidden mb-4";

export const cardHeaderCls =
  "flex items-center justify-between px-5 py-4 border-b border-[var(--bw-border)]";

export const cardTitleCls =
  "flex items-center gap-2 text-sm font-bold text-[var(--bw-ink)] tracking-tight";

export const sectionDividerCls = "flex items-center gap-3 my-5";

/* ─────────────────────── profit helper ─────────────────────── */

export interface CostEntry {
  id: string;
  key: string;
  label: string;
  value: string;
}

export function computeProfit(
  sellingPrice: string,
  costPrice: string,
  costs: CostEntry[]
) {
  const sp = parseFloat(sellingPrice) || 0;
  const cp = parseFloat(costPrice) || 0;
  const extras = costs.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0);
  const total = cp + extras;
  const margin = sp - total;
  const pct = sp > 0 ? ((margin / sp) * 100).toFixed(1) : "–";
  return { sp, cp, extras, total, margin, pct };
}

/* ─────────────────────── BwToggle ─────────────────────── */

export function BwToggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  desc?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        className="relative flex-shrink-0 w-10 h-6 rounded-full transition-all duration-200 cursor-pointer"
        style={{ background: checked ? "var(--bw-ink)" : "var(--bw-border)" }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
          style={{
            background: "var(--bw-bg)",
            left: checked ? "calc(100% - 22px)" : "2px",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        />
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color: "var(--bw-ink)" }}>
          {label}
        </div>
        {desc && (
          <div className="text-xs mt-0.5" style={{ color: "var(--bw-ghost)" }}>
            {desc}
          </div>
        )}
      </div>
    </label>
  );
}

/* ─────────────────────── CurrencySelect ─────────────────────── */

export function CurrencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        className="appearance-none border rounded-[var(--bw-radius-md)] px-3 py-2.5 pr-8 text-sm font-semibold outline-none cursor-pointer transition-all"
        style={{
          background: "var(--bw-input-bg)",
          borderColor: "var(--bw-border)",
          color: "var(--bw-ink)",
          fontFamily: "var(--bw-font-body)",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option>BDT</option>
        <option>USD</option>
        <option>EUR</option>
        <option>GBP</option>
      </select>
      <span
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
        style={{ color: "var(--bw-ghost)" }}
      >
        ▼
      </span>
    </div>
  );
}

/* ─────────────────────── StockPill ─────────────────────── */

export function StockPill({
  inStock,
  compact = false,
}: {
  inStock: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
      style={
        inStock
          ? {
              background: "rgba(22,163,74,0.08)",
              color: "var(--bw-green)",
              borderColor: "rgba(22,163,74,0.2)",
            }
          : {
              background: "rgba(220,38,38,0.08)",
              color: "var(--bw-red)",
              borderColor: "rgba(220,38,38,0.2)",
            }
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: inStock ? "var(--bw-green)" : "var(--bw-red)" }}
      />
      {compact
        ? inStock
          ? "In Stock"
          : "Out"
        : inStock
        ? "In Stock"
        : "Out of Stock"}
    </span>
  );
}

/* ─────────────────────── AddRowBtn ─────────────────────── */

export function AddRowBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold px-3 py-2 rounded-[var(--bw-radius-md)] border border-dashed cursor-pointer transition-all w-full text-center"
      style={{
        background: "transparent",
        borderColor: "var(--bw-border)",
        color: "var(--bw-muted)",
        fontFamily: "var(--bw-font-body)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--bw-ink)";
        e.currentTarget.style.color = "var(--bw-ink)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--bw-border)";
        e.currentTarget.style.color = "var(--bw-muted)";
      }}
    >
      {children}
    </button>
  );
}