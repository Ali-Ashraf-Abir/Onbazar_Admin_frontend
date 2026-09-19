"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [isActive, setIsActive] = useState("true");
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [applied, setApplied] = useState({ q: "", isActive: "true", page: 1 });

  async function loadGiftCards(a: typeof applied) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(a.page));
      params.set("limit", "10");
      if (a.q) params.set("q", a.q);
      if (a.isActive) params.set("isActive", a.isActive);

      const data = await api.get<any>(`/admin/gift-cards?${params.toString()}`);
      setGiftCards(data.data || []);
      setMeta(data.meta || null);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGiftCards(applied);
  }, [applied]);

  function applyFilters() {
    setApplied({ q, isActive, page: 1 });
    setFiltersOpen(false);
  }

  function goToPage(p: number) {
    setPage(p);
    setApplied({ ...applied, page: p });
  }

  async function deleteGiftCard(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/admin/gift-cards/${id}`);
      setGiftCards(giftCards.filter((g) => g._id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete gift card", error);
    } finally {
      setDeletingId(null);
    }
  }

  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] w-full " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";
  const selectBase = `${inputBase} cursor-pointer appearance-none`;
  const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";

  return (
    <div className="min-h-screen" style={{ background: "var(--bw-bg)", color: "var(--bw-ink)", fontFamily: "var(--bw-font-body)" }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-5 sm:mb-7 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
              Gift Cards
            </h1>
            {meta && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
                {meta.total ?? giftCards.length} gift card{(meta.total ?? giftCards.length) !== 1 ? "s" : ""}
              </p>
            )}
            <div className="mt-2">
              <a
                href="/admin/gift-cards/create"
                className="px-4 py-2 bg-[var(--bw-ink)] text-[var(--bw-bg)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Create Gift Card
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((p) => !p)}
            className="sm:hidden flex items-center gap-2 px-3.5 py-2 rounded-[var(--bw-radius-md)] text-sm font-semibold border cursor-pointer transition-all"
            style={{
              background: filtersOpen ? "var(--bw-ink)" : "var(--bw-surface)",
              color: filtersOpen ? "var(--bw-bg)" : "var(--bw-ink)",
              borderColor: filtersOpen ? "var(--bw-ink)" : "var(--bw-border)",
            }}
          >
            ⚙ Filters
          </button>
        </div>

        <div
          className={`rounded-[var(--bw-radius-xl)] p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col gap-4 ${filtersOpen ? "flex" : "hidden sm:flex"}`}
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
        >
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--bw-ghost)" }}>🔍</span>
            <input
              className={`${inputBase} pl-9`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Search gift cards…"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <select className={selectBase} value={isActive} onChange={(e) => setIsActive(e.target.value)}>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
                <option value="">All statuses</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "var(--bw-divider)" }}>
            <button
              type="button"
              onClick={applyFilters}
              className="ml-auto px-5 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none"
              style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
            >
              Apply
            </button>
          </div>
        </div>

        <div
          className="rounded-[var(--bw-radius-lg)] overflow-hidden"
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
        >
          {loading ? (
            <div className="py-16 text-center" style={{ color: "var(--bw-muted)" }}>Loading…</div>
          ) : giftCards.length === 0 ? (
            <div className="py-16 sm:py-20 text-center px-4">
              <div className="text-5xl mb-4 opacity-30">🎁</div>
              <p className="text-xl sm:text-2xl mb-2" style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-muted)" }}>
                No gift cards found
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--bw-divider)" }}>
              <div
                className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 sm:px-5 py-3"
                style={{ background: "var(--bw-bg)", color: "var(--bw-ghost)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}
              >
                <div className="sm:col-span-4">Gift Card</div>
                <div className="sm:col-span-3">Template</div>
                <div className="sm:col-span-2 text-center">Price</div>
                <div className="sm:col-span-1 text-center">Status</div>
                <div className="sm:col-span-2 text-right">Actions</div>
              </div>

              {giftCards.map((gc: any) => (
                <div key={gc._id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 sm:px-5 py-4 items-center hover:bg-[var(--bw-bg)] transition-colors">
                  <div className="sm:col-span-4">
                    <p className="text-sm font-medium sm:font-semibold" style={{ fontFamily: "var(--bw-font-display)" }}>{gc.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--bw-muted)" }}>{gc.description}</p>
                  </div>

                  <div className="sm:col-span-3 text-sm">
                    {gc.templateId?.name || <span style={{ color: "var(--bw-red)" }}>Missing</span>}
                  </div>

                  <div className="sm:col-span-2 text-center text-sm font-semibold">
                    {gc.pricing?.currency} {gc.pricing?.sellingPrice?.toLocaleString()}
                  </div>

                  <div className="sm:col-span-1 text-center">
                    <span
                      className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
                      style={
                        gc.isActive
                          ? { background: "rgba(22,163,74,0.15)", color: "rgb(22,163,74)" }
                          : { background: "rgba(100,100,100,0.15)", color: "rgb(100,100,100)" }
                      }
                    >
                      {gc.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex justify-end sm:col-span-2 gap-2">
                    <a
                      href={`/admin/gift-cards/${gc._id}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                      style={{ background: "var(--bw-bg)", borderColor: "var(--bw-border)", color: "var(--bw-ink)" }}
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(gc._id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                      style={{ background: "var(--bw-bg)", borderColor: "var(--bw-border)", color: "var(--bw-muted)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setDeleteConfirm(null)}>
          <div
            className="rounded-[var(--bw-radius-lg)] p-6 max-w-sm w-full"
            style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", boxShadow: "var(--bw-shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--bw-font-display)" }}>Delete Gift Card?</h3>
            <p className="text-sm mb-6" style={{ color: "var(--bw-muted)" }}>This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                style={{ background: "var(--bw-bg)", borderColor: "var(--bw-border)", color: "var(--bw-ink)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteConfirm && deleteGiftCard(deleteConfirm)}
                disabled={deletingId === deleteConfirm}
                className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50"
                style={{ background: "var(--bw-red)", color: "#fff" }}
              >
                {deletingId === deleteConfirm ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}