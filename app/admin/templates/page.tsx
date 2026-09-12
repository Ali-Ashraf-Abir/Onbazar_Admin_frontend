"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [isActive, setIsActive] = useState("true");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [applied, setApplied] = useState({
    q: "",
    isActive: "true",
    sort: "newest",
    page: 1,
  });

  /* ─────────────────────── fetch ─────────────────────── */

  async function loadTemplates(a: typeof applied) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(a.page));
      params.set("limit", "10");
      if (a.q) params.set("q", a.q);
      if (a.isActive) params.set("isActive", a.isActive);
      if (a.sort) params.set("sort", a.sort);

      const data = await api.get<any>(`/admin/templates?${params.toString()}`);
      setTemplates(data.data || []);
      setMeta(data.meta || null);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates(applied);
  }, [applied]);

  /* ─────────────────────── filter actions ─────────────────────── */

  function applyFilters() {
    setApplied({ q, isActive, sort, page: 1 });
    setFiltersOpen(false);
  }

  function resetFilters() {
    const d = {
      q: "",
      isActive: "true",
      sort: "newest",
      page: 1,
    };
    setQ("");
    setIsActive("true");
    setSort("newest");
    setPage(1);
    setApplied(d);
  }

  function goToPage(p: number) {
    setPage(p);
    setApplied({ ...applied, page: p });
  }

  async function deleteTemplate(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/admin/templates/${id}`);
      setTemplates(templates.filter((t) => t._id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete template", error);
    } finally {
      setDeletingId(null);
    }
  }

  const hasActiveFilters =
    !!applied.q || applied.isActive !== "true" || applied.sort !== "newest";

  const hasPendingChanges =
    q !== applied.q ||
    isActive !== applied.isActive ||
    sort !== applied.sort;

  /* ─────────────────────── shared tw classes ─────────────────────── */

  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] w-full " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

  const selectBase = `${inputBase} cursor-pointer appearance-none`;
  const labelCls =
    "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bw-bg)",
        color: "var(--bw-ink)",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-5 sm:mb-7 gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Templates
            </h1>
            {meta && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
                {meta.total ?? templates.length} template
                {(meta.total ?? templates.length) !== 1 ? "s" : ""}
                {meta.totalPages > 1 && ` · Page ${meta.page} of ${meta.totalPages}`}
              </p>
            )}
            <div className="mt-2">
              <a
                href="/admin/templates/create"
                className="px-4 py-2 bg-[var(--bw-ink)] text-[var(--bw-bg)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Create Template
              </a>
            </div>
          </div>

          {/* Mobile filter toggle */}
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
            <span>⚙</span>
            Filters
            {hasActiveFilters && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: filtersOpen ? "var(--bw-bg)" : "var(--bw-ink)",
                }}
              />
            )}
          </button>
        </div>

        {/* ── Filters Panel ── */}
        <div
          className={`rounded-[var(--bw-radius-xl)] p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col gap-4 ${
            filtersOpen ? "flex" : "hidden sm:flex"
          }`}
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          {/* Search bar */}
          <div className="relative w-full">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
              style={{ color: "var(--bw-ghost)" }}
            >
              🔍
            </span>
            <input
              className={`${inputBase} pl-9`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Search templates…"
            />
          </div>

          {/* Filter grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <div className="relative">
                <select
                  className={selectBase}
                  value={isActive}
                  onChange={(e) => setIsActive(e.target.value)}
                >
                  <option value="true">Active only</option>
                  <option value="false">Inactive only</option>
                  <option value="">All statuses</option>
                </select>
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
                  style={{ color: "var(--bw-ghost)" }}
                >
                  ▼
                </span>
              </div>
            </div>

            <div>
              <label className={labelCls}>Sort</label>
              <div className="relative">
                <select
                  className={selectBase}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name_asc">Name A→Z</option>
                  <option value="name_desc">Name Z→A</option>
                </select>
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
                  style={{ color: "var(--bw-ghost)" }}
                >
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Action row */}
          <div
            className="flex items-center gap-2 pt-1 border-t"
            style={{ borderColor: "var(--bw-divider)" }}
          >
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                style={{
                  background: "none",
                  borderColor: "var(--bw-border)",
                  color: "var(--bw-muted)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--bw-red)";
                  e.currentTarget.style.color = "var(--bw-red)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--bw-border)";
                  e.currentTarget.style.color = "var(--bw-muted)";
                }}
              >
                ✕ Reset
              </button>
            )}
            <button
              type="button"
              onClick={applyFilters}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none"
              style={{
                background: "var(--bw-ink)",
                color: "var(--bw-bg)",
                opacity: hasPendingChanges ? 1 : 0.75,
              }}
            >
              {hasPendingChanges && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: "var(--bw-bg)",
                    animation: "bw-pulse 1.2s ease-in-out infinite",
                  }}
                />
              )}
              {hasPendingChanges ? "Apply Filters" : "Search"}
            </button>
          </div>
        </div>

        {/* ── Templates List ── */}
        <div
          className="rounded-[var(--bw-radius-lg)] overflow-hidden"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          {loading ? (
            <div className="divide-y" style={{ borderColor: "var(--bw-divider)" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} delay={i * 70} />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="py-16 sm:py-20 text-center px-4">
              <div className="text-5xl mb-4 opacity-30">🎨</div>
              <p
                className="text-xl sm:text-2xl mb-2"
                style={{
                  fontFamily: "var(--bw-font-display)",
                  color: "var(--bw-muted)",
                }}
              >
                No templates found
              </p>
              <p className="text-sm" style={{ color: "var(--bw-ghost)" }}>
                Try adjusting your filters or create a new template.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--bw-divider)" }}>
              {/* Table header */}
              <div
                className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 sm:px-5 py-3"
                style={{
                  background: "var(--bw-bg)",
                  color: "var(--bw-ghost)",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <div className="sm:col-span-4">Template</div>
                <div className="sm:col-span-2 text-center">Fields</div>
                <div className="sm:col-span-2 text-center">Version</div>
                <div className="sm:col-span-2 text-center">Status</div>
                <div className="sm:col-span-2 text-right">Actions</div>
              </div>

              {/* Table rows */}
              {templates.map((template: any) => (
                <div
                  key={template._id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 sm:px-5 py-4 items-center hover:bg-[var(--bw-bg)] transition-colors"
                >
                  {/* Template name - mobile/desktop */}
                  <div className="sm:col-span-4">
                    <p
                      className="text-sm font-medium sm:font-semibold"
                      style={{ fontFamily: "var(--bw-font-display)" }}
                    >
                      {template.name}
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--bw-muted)" }}
                    >
                      {template.description}
                    </p>
                    <p
                      className="text-[10px] mt-1"
                      style={{
                        color: "var(--bw-ghost)",
                        fontFamily: "var(--bw-font-mono)",
                      }}
                    >
                      {template._id.slice(-8)}
                    </p>
                  </div>

                  {/* Fields count */}
                  <div className="flex justify-between sm:col-span-2 sm:justify-center sm:text-center">
                    <span
                      className="text-[10px] sm:hidden font-semibold"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      FIELDS
                    </span>
                    <span className="font-semibold text-sm">
                      {template.fields?.length || 0}
                    </span>
                  </div>

                  {/* Version */}
                  <div className="flex justify-between sm:col-span-2 sm:justify-center sm:text-center">
                    <span
                      className="text-[10px] sm:hidden font-semibold"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      VERSION
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--bw-muted)" }}
                    >
                      v{template.version || "1"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between sm:col-span-2 sm:justify-center sm:text-center">
                    <span
                      className="text-[10px] sm:hidden font-semibold"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      STATUS
                    </span>
                    <span
                      className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full w-fit"
                      style={
                        template.isActive
                          ? {
                              background: "rgba(22,163,74,0.15)",
                              color: "rgb(22,163,74)",
                            }
                          : {
                              background: "rgba(100,100,100,0.15)",
                              color: "rgb(100,100,100)",
                            }
                      }
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end sm:col-span-2 gap-2">
                    <a
                      href={`/admin/templates/${template._id}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                      style={{
                        background: "var(--bw-bg)",
                        borderColor: "var(--bw-border)",
                        color: "var(--bw-ink)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--bw-ink)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--bw-border)";
                      }}
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(template._id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                      style={{
                        background: "var(--bw-bg)",
                        borderColor: "var(--bw-border)",
                        color: "var(--bw-muted)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--bw-red)";
                        e.currentTarget.style.color = "var(--bw-red)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--bw-border)";
                        e.currentTarget.style.color = "var(--bw-muted)";
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-8 sm:mt-10 flex-wrap">
            <PageBtn
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              label="←"
            />
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === meta.totalPages ||
                  Math.abs(p - page) <= 1
              )
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e-${i}`}
                    className="text-sm px-2"
                    style={{ color: "var(--bw-ghost)" }}
                  >
                    …
                  </span>
                ) : (
                  <PageBtn
                    key={p}
                    onClick={() => goToPage(p as number)}
                    disabled={false}
                    label={String(p)}
                    current={p === page}
                  />
                )
              )}
            <PageBtn
              onClick={() => goToPage(page + 1)}
              disabled={page >= meta.totalPages}
              label="→"
            />
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="rounded-[var(--bw-radius-lg)] p-6 max-w-sm w-full"
            style={{
              background: "var(--bw-surface)",
              border: "1px solid var(--bw-border)",
              boxShadow: "var(--bw-shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-lg font-bold mb-2"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Delete Template?
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--bw-muted)" }}
            >
              This action cannot be undone. The template will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                style={{
                  background: "var(--bw-bg)",
                  borderColor: "var(--bw-border)",
                  color: "var(--bw-ink)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  deleteConfirm && deleteTemplate(deleteConfirm)
                }
                disabled={deletingId === deleteConfirm}
                className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "var(--bw-red)",
                  color: "#fff",
                }}
              >
                {deletingId === deleteConfirm ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bw-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes bw-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function SkeletonRow({ delay }: { delay: number }) {
  const shimmer =
    "linear-gradient(90deg,var(--bw-surface-alt) 25%,var(--bw-border) 50%,var(--bw-surface-alt) 75%)";
  return (
    <div
      className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-4"
      style={{ borderBottom: "1px solid var(--bw-divider)" }}
    >
      <div
        className="sm:col-span-4 h-4 rounded-md"
        style={{
          background: shimmer,
          backgroundSize: "200% 100%",
          animation: `bw-shimmer 1.4s ${delay}ms infinite`,
        }}
      />
      <div
        className="sm:col-span-2 h-4 rounded-md"
        style={{
          background: shimmer,
          backgroundSize: "200% 100%",
          animation: `bw-shimmer 1.4s ${delay + 50}ms infinite`,
        }}
      />
      <div
        className="sm:col-span-2 h-4 rounded-md"
        style={{
          background: shimmer,
          backgroundSize: "200% 100%",
          animation: `bw-shimmer 1.4s ${delay + 100}ms infinite`,
        }}
      />
      <div
        className="sm:col-span-2 h-4 rounded-md"
        style={{
          background: shimmer,
          backgroundSize: "200% 100%",
          animation: `bw-shimmer 1.4s ${delay + 150}ms infinite`,
        }}
      />
      <div
        className="sm:col-span-2 h-4 rounded-md"
        style={{
          background: shimmer,
          backgroundSize: "200% 100%",
          animation: `bw-shimmer 1.4s ${delay + 200}ms infinite`,
        }}
      />
    </div>
  );
}

function PageBtn({
  onClick,
  disabled,
  label,
  current = false,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  current?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-[var(--bw-radius-md)] text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={
        current
          ? {
              background: "var(--bw-ink)",
              color: "var(--bw-bg)",
              border: "1.5px solid var(--bw-ink)",
            }
          : {
              background: "var(--bw-surface)",
              color: "var(--bw-muted)",
              border: "1.5px solid var(--bw-border)",
            }
      }
      onMouseEnter={(e) => {
        if (!disabled && !current) {
          e.currentTarget.style.borderColor = "var(--bw-ink)";
          e.currentTarget.style.color = "var(--bw-ink)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !current) {
          e.currentTarget.style.borderColor = "var(--bw-border)";
          e.currentTarget.style.color = "var(--bw-muted)";
        }
      }}
    >
      {label}
    </button>
  );
}
