"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminPuzzlesPage() {
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [meta, setMeta] = useState<any>(null);
  const [isActive, setIsActive] = useState("true");
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [applied, setApplied] = useState({ q: "", isActive: "true", page: 1 });

  async function loadPuzzles(filters: typeof applied) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(filters.page));
      params.set("limit", "10");
      if (filters.q) params.set("q", filters.q);
      if (filters.isActive) params.set("isActive", filters.isActive);

      const data = await api.get<any>(`/admin/puzzles?${params.toString()}`);
      setPuzzles(data.data || []);
      setMeta(data.meta || null);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPuzzles(applied);
  }, [applied]);

  function applyFilters() {
    setApplied({ q, isActive, page: 1 });
    setFiltersOpen(false);
  }

  async function deletePuzzle(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/admin/puzzles/${id}`);
      setPuzzles(puzzles.filter((puzzle) => puzzle._id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete puzzle", error);
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
              Puzzles
            </h1>
            {meta && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
                {meta.total ?? puzzles.length} puzzle{(meta.total ?? puzzles.length) !== 1 ? "s" : ""}
              </p>
            )}
            <div className="mt-2">
              <a
                href="/admin/puzzles/create"
                className="px-4 py-2 bg-[var(--bw-ink)] text-[var(--bw-bg)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Create Puzzle
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="sm:hidden flex items-center gap-2 px-3.5 py-2 rounded-[var(--bw-radius-md)] text-sm font-semibold border cursor-pointer transition-all"
            style={{
              background: filtersOpen ? "var(--bw-ink)" : "var(--bw-surface)",
              color: filtersOpen ? "var(--bw-bg)" : "var(--bw-ink)",
              borderColor: filtersOpen ? "var(--bw-ink)" : "var(--bw-border)",
            }}
          >
            Filters
          </button>
        </div>

        <div
          className={`rounded-[var(--bw-radius-xl)] p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col gap-4 ${filtersOpen ? "flex" : "hidden sm:flex"}`}
          style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
        >
          <input
            className={inputBase}
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyFilters()}
            placeholder="Search puzzles…"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <select className={selectBase} value={isActive} onChange={(event) => setIsActive(event.target.value)}>
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
          ) : puzzles.length === 0 ? (
            <div className="py-16 sm:py-20 text-center px-4">
              <p className="text-xl sm:text-2xl mb-2" style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-muted)" }}>
                No puzzles found
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--bw-divider)" }}>
              <div
                className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 sm:px-5 py-3"
                style={{ background: "var(--bw-bg)", color: "var(--bw-ghost)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}
              >
                <div className="sm:col-span-4">Puzzle</div>
                <div className="sm:col-span-3 text-center">Max photos</div>
                <div className="sm:col-span-2 text-center">Price</div>
                <div className="sm:col-span-1 text-center">Status</div>
                <div className="sm:col-span-2 text-right">Actions</div>
              </div>

              {puzzles.map((puzzle) => (
                <div key={puzzle._id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 sm:px-5 py-4 items-center hover:bg-[var(--bw-bg)] transition-colors">
                  <div className="sm:col-span-4">
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--bw-font-display)" }}>{puzzle.name}</p>
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--bw-muted)" }}>{puzzle.details}</p>
                  </div>
                  <div className="sm:col-span-3 text-center text-sm">{puzzle.maxImages}</div>
                  <div className="sm:col-span-2 text-center text-sm font-semibold">
                    {puzzle.pricing?.currency} {puzzle.pricing?.sellingPrice?.toLocaleString()}
                  </div>
                  <div className="sm:col-span-1 text-center">
                    <span
                      className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
                      style={
                        puzzle.isActive
                          ? { background: "rgba(22,163,74,0.15)", color: "rgb(22,163,74)" }
                          : { background: "rgba(100,100,100,0.15)", color: "rgb(100,100,100)" }
                      }
                    >
                      {puzzle.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-end sm:col-span-2 gap-2">
                    <a
                      href={`/admin/puzzles/${puzzle._id}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border"
                      style={{ background: "var(--bw-bg)", borderColor: "var(--bw-border)", color: "var(--bw-ink)" }}
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(puzzle._id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border cursor-pointer"
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

        {meta?.totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              disabled={applied.page <= 1}
              onClick={() => setApplied({ ...applied, page: applied.page - 1 })}
              className="px-3 py-1.5 text-xs font-semibold rounded border disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={applied.page >= meta.totalPages}
              onClick={() => setApplied({ ...applied, page: applied.page + 1 })}
              className="px-3 py-1.5 text-xs font-semibold rounded border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setDeleteConfirm(null)}>
          <div
            className="rounded-[var(--bw-radius-lg)] p-6 max-w-sm w-full"
            style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--bw-font-display)" }}>Delete puzzle?</h3>
            <p className="text-sm mb-6" style={{ color: "var(--bw-muted)" }}>This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] border"
                style={{ background: "var(--bw-bg)", borderColor: "var(--bw-border)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deletePuzzle(deleteConfirm)}
                disabled={deletingId === deleteConfirm}
                className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] border-none text-white disabled:opacity-50"
                style={{ background: "var(--bw-red, #dc2626)" }}
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
