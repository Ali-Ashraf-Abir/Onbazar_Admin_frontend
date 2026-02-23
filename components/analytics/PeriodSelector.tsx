"use client";

import { useState, useRef, useEffect } from "react";
import { Period } from "../../lib/analyticsApi";

interface PeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
  onCustomRange?: (from: string, to: string) => void;
  customFrom?: string;
  customTo?: string;
  onClearCustom?: () => void;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d",    label: "7D" },
  { value: "30d",   label: "30D" },
  { value: "90d",   label: "90D" },
  { value: "12m",   label: "12M" },
  { value: "ytd",   label: "YTD" },
  { value: "all",   label: "All" },
];

const CalendarIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
    <path fillRule="evenodd" d="M4 1a1 1 0 011 1v.5h6V2a1 1 0 112 0v.5A2.5 2.5 0 0115.5 5v7a2.5 2.5 0 01-2.5 2.5H3A2.5 2.5 0 01.5 12V5A2.5 2.5 0 013 2.5V2a1 1 0 011-1zM2 6.5v5.5A1.5 1.5 0 003.5 13.5h9A1.5 1.5 0 0014 12V6.5H2z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function PeriodSelector({
  value,
  onChange,
  onCustomRange,
  customFrom = "",
  customTo = "",
  onClearCustom,
}: PeriodSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftFrom,  setDraftFrom]  = useState(customFrom);
  const [draftTo,    setDraftTo]    = useState(customTo);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isCustomActive = !!(customFrom && customTo);

  /* sync drafts when external values change */
  useEffect(() => { setDraftFrom(customFrom); }, [customFrom]);
  useEffect(() => { setDraftTo(customTo);     }, [customTo]);

  /* close picker on outside click */
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  function applyCustomRange() {
    if (!draftFrom || !draftTo) return;
    if (draftFrom > draftTo) return; // invalid range guard
    onCustomRange?.(draftFrom, draftTo);
    setPickerOpen(false);
  }

  function clearCustom() {
    setDraftFrom("");
    setDraftTo("");
    onClearCustom?.();
    setPickerOpen(false);
  }

  function formatShort(iso: string) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${d} ${months[+m - 1]} ${y}`;
  }

  return (
    <div className="flex items-center gap-2">
      {/* ── Period pills ── */}
      {!isCustomActive && (
        <div className="flex items-center gap-1 bg-[var(--bw-surface-alt)] p-1 rounded-[var(--bw-radius-md)] border border-[var(--bw-border)]">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onChange(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-all duration-150 cursor-pointer ${
                value === p.value && !isCustomActive
                  ? "bg-[var(--bw-ink)] text-[var(--bw-bg)] shadow-sm"
                  : "text-[var(--bw-muted)] hover:text-[var(--bw-ink)] hover:bg-[var(--bw-bg)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Active custom range badge ── */}
      {isCustomActive && (
        <div className="flex items-center gap-2 bg-[var(--bw-ink)] text-[var(--bw-bg)] px-3 py-1.5 rounded-[var(--bw-radius-md)] text-xs font-medium">
          <CalendarIcon />
          <span>{formatShort(customFrom)} → {formatShort(customTo)}</span>
          <button
            onClick={clearCustom}
            className="ml-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            title="Clear custom range"
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* ── Calendar trigger ── */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((o) => !o)}
          title="Pick custom date range"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--bw-radius-md)] border transition-all duration-150 cursor-pointer ${
            pickerOpen || isCustomActive
              ? "border-[var(--bw-ink)] text-[var(--bw-ink)] bg-[var(--bw-surface-alt)]"
              : "border-[var(--bw-border)] text-[var(--bw-muted)] hover:text-[var(--bw-ink)] hover:bg-[var(--bw-surface-alt)]"
          }`}
        >
          <CalendarIcon />
          {!isCustomActive && <span>Custom</span>}
          {isCustomActive  && <span>Edit</span>}
        </button>

        {/* ── Dropdown picker ── */}
        {pickerOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-[var(--bw-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] shadow-lg p-4 space-y-4">
            <p className="text-xs font-semibold text-[var(--bw-ink)]">Custom Date Range</p>

            <div className="space-y-3">
              {/* From */}
              <div>
                <label className="block text-xs text-[var(--bw-ghost)] mb-1">From</label>
                <input
                  type="date"
                  value={draftFrom}
                  max={draftTo || undefined}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-[var(--bw-radius-sm)] border border-[var(--bw-border)] bg-[var(--bw-surface-alt)] text-[var(--bw-ink)] outline-none focus:border-[var(--bw-ink)] transition-colors cursor-pointer"
                />
              </div>

              {/* To */}
              <div>
                <label className="block text-xs text-[var(--bw-ghost)] mb-1">To</label>
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom || undefined}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-[var(--bw-radius-sm)] border border-[var(--bw-border)] bg-[var(--bw-surface-alt)] text-[var(--bw-ink)] outline-none focus:border-[var(--bw-ink)] transition-colors cursor-pointer"
                />
              </div>
            </div>

            {/* Validation hint */}
            {draftFrom && draftTo && draftFrom > draftTo && (
              <p className="text-xs text-[var(--bw-red)]">Start date must be before end date.</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={applyCustomRange}
                disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                className="flex-1 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-sm)] bg-[var(--bw-ink)] text-[var(--bw-bg)] hover:opacity-90 disabled:opacity-30 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                onClick={() => setPickerOpen(false)}
                className="flex-1 py-1.5 text-xs font-medium rounded-[var(--bw-radius-sm)] border border-[var(--bw-border)] text-[var(--bw-muted)] hover:text-[var(--bw-ink)] hover:bg-[var(--bw-surface-alt)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Quick shortcuts */}
            <div className="pt-2 border-t border-[var(--bw-divider)]">
              <p className="text-xs text-[var(--bw-ghost)] mb-2">Quick select</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "This week",      days: 7  },
                  { label: "Last 14 days",   days: 14 },
                  { label: "Last 30 days",   days: 30 },
                  { label: "Last 60 days",   days: 60 },
                ].map(({ label, days }) => {
                  const to   = new Date();
                  const from = new Date(); from.setDate(from.getDate() - (days - 1));
                  const fmt  = (d: Date) => d.toISOString().split("T")[0];
                  return (
                    <button
                      key={label}
                      onClick={() => { setDraftFrom(fmt(from)); setDraftTo(fmt(to)); }}
                      className="text-xs px-2 py-1.5 rounded-[var(--bw-radius-sm)] bg-[var(--bw-surface-alt)] text-[var(--bw-muted)] hover:text-[var(--bw-ink)] hover:bg-[var(--bw-border)] transition-colors cursor-pointer text-left"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}