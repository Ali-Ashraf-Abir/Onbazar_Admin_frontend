"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

/* ─────────────────────── types ─────────────────────── */

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

/* ─────────────────────── helpers ─────────────────────── */

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/* ─────────────────────── shared tw helpers ─────────────────────── */

const inputCls =
  "w-full bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
  "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-150 " +
  "placeholder:text-[var(--bw-placeholder)] " +
  "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--bw-muted)]";

/* ═══════════════════════════════════════════════════════ */

/* ─────────────────────── Toast ─────────────────────── */

function Toast({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          className="flex items-start gap-2.5 px-4 py-3 rounded-[var(--bw-radius-md)] text-sm cursor-pointer max-w-xs leading-snug"
          style={{
            background: t.type === "error" ? "var(--bw-red)" : "var(--bw-ink)",
            color: "var(--bw-bg)",
            boxShadow: "var(--bw-shadow-lg)",
            fontFamily: "var(--bw-font-body)",
            animation: "bw-slide-right 0.2s ease",
          }}
        >
          <span className="flex-shrink-0 mt-px">{t.type === "error" ? "✕" : "✓"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────── Badge ─────────────────────── */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={
        active
          ? { background: "rgba(22,163,74,0.08)", color: "var(--bw-green)", borderColor: "rgba(22,163,74,0.2)" }
          : { background: "var(--bw-surface-alt)",  color: "var(--bw-ghost)",  borderColor: "var(--bw-border)" }
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: active ? "var(--bw-green)" : "var(--bw-ghost)" }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* ─────────────────────── Modal ─────────────────────── */

function Modal({
  open, title, onClose, children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
      style={{
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        animation: "bw-fade-in 0.15s ease",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] p-8 rounded-[var(--bw-radius-xl)]"
        style={{
          background: "var(--bw-surface)",
          boxShadow: "var(--bw-shadow-lg)",
          animation: "bw-scale-in 0.18s ease",
          border: "1px solid var(--bw-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-[22px] tracking-tight m-0"
            style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border cursor-pointer transition-all"
            style={{ background: "var(--bw-input-bg)", borderColor: "var(--bw-border)", color: "var(--bw-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.borderColor = "var(--bw-ink)";
              (e.currentTarget).style.color       = "var(--bw-ink)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.borderColor = "var(--bw-border)";
              (e.currentTarget).style.color       = "var(--bw-muted)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────── Category Form ─────────────────────── */

function CategoryForm({
  initial, onSubmit, loading,
}: {
  initial?: Category;
  onSubmit: (data: CategoryFormData) => void;
  loading: boolean;
}) {
  const [name,        setName]        = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive,    setIsActive]    = useState(initial?.isActive ?? true);

  const preview = slugify(name) || "—";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), isActive });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className={labelCls}>Category Name <span style={{ color: "var(--bw-red)" }}>*</span></label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Oversized Tees"
          required
        />
        <p className="mt-1.5 text-xs" style={{ color: "var(--bw-muted)" }}>
          Slug:{" "}
          <span className="font-semibold" style={{ color: "var(--bw-ink)", fontFamily: "var(--bw-font-mono)" }}>
            {preview}
          </span>
        </p>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>
          Description{" "}
          <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>(optional)</span>
        </label>
        <textarea
          className={`${inputCls} resize-y min-h-[80px]`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          rows={3}
        />
      </div>

      {/* Active toggle */}
      <BwToggle
        checked={isActive}
        onChange={setIsActive}
        label={isActive ? "Active — visible to storefront" : "Inactive — hidden from storefront"}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="mt-1 w-full py-3.5 rounded-[var(--bw-radius-md)] text-sm font-semibold border-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "var(--bw-ink)", color: "var(--bw-bg)", fontFamily: "var(--bw-font-body)" }}
      >
        {loading ? "Saving…" : initial ? "Save Changes" : "Create Category"}
      </button>
    </form>
  );
}

/* ─────────────────────── Delete Confirm ─────────────────────── */

function DeleteConfirm({
  category, onConfirm, onCancel, loading,
}: {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="text-center">
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: "var(--bw-red-bg)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bw-red)" strokeWidth="2" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
        </svg>
      </div>

      <h3 className="text-xl mb-2" style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}>
        Delete &ldquo;{category.name}&rdquo;?
      </h3>
      <p className="text-sm mb-7 leading-relaxed" style={{ color: "var(--bw-muted)" }}>
        This action cannot be undone. Products linked to this category must be reassigned first.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-[var(--bw-radius-md)] text-sm font-semibold border cursor-pointer transition-all"
          style={{
            background: "var(--bw-surface)",
            borderColor: "var(--bw-border)",
            color: "var(--bw-ink)",
            fontFamily: "var(--bw-font-body)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 rounded-[var(--bw-radius-md)] text-sm font-semibold border-none cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--bw-red)", color: "#fff", fontFamily: "var(--bw-font-body)" }}
        >
          {loading ? "Deleting…" : "Yes, Delete"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── Main Page ─────────────────────── */

export default function CategoriesPage() {
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filterActive,  setFilterActive]  = useState<"all" | "active" | "inactive">("all");
  const [toasts,        setToasts]        = useState<ToastItem[]>([]);

  const [createOpen,    setCreateOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState<Category | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<Category | null>(null);

  const [formLoading,   setFormLoading]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── toasts ── */
  function addToast(message: string, type: "success" | "error" = "success") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }
  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  /* ── fetch ── */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/categories?includeInactive=true`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message as string);
      setCategories(json.data as Category[]);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ── create ── */
  async function handleCreate(data: CategoryFormData) {
    setFormLoading(true);
    try {
      const res  = await fetch(`${API}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message as string);
      setCategories((prev) => [json.data as Category, ...prev]);
      setCreateOpen(false);
      addToast(`"${(json.data as Category).name}" created successfully`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to create category", "error");
    } finally {
      setFormLoading(false);
    }
  }

  /* ── update ── */
  async function handleUpdate(data: CategoryFormData) {
    if (!editTarget) return;
    setFormLoading(true);
    try {
      const res  = await fetch(`${API}/categories/${editTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message as string);
      const updated = json.data as Category;
      setCategories((prev) => prev.map((c) => (c._id === editTarget._id ? updated : c)));
      setEditTarget(null);
      addToast(`"${updated.name}" updated`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update category", "error");
    } finally {
      setFormLoading(false);
    }
  }

  /* ── delete ── */
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res  = await fetch(`${API}/categories/${deleteTarget._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message as string);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
      addToast("Category deleted");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete category", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  /* ── quick toggle ── */
  async function toggleActive(cat: Category) {
    try {
      const res  = await fetch(`${API}/categories/${cat._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message as string);
      const updated = json.data as Category;
      setCategories((prev) => prev.map((c) => (c._id === cat._id ? updated : c)));
      addToast(`"${updated.name}" is now ${updated.isActive ? "active" : "inactive"}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  }

  /* ── filtered list ── */
  const filtered = categories.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterActive === "all" ? true : filterActive === "active" ? c.isActive : !c.isActive;
    return matchSearch && matchFilter;
  });

  const totalActive   = categories.filter((c) => c.isActive).length;
  const totalInactive = categories.length - totalActive;

  /* ═══════════════════════════════════════════════════════ */

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bw-bg)", fontFamily: "var(--bw-font-body)", color: "var(--bw-ink)" }}
    >
      <Toast toasts={toasts} onRemove={removeToast} />

      <main className="max-w-[960px] mx-auto px-5 py-9">

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: "Total",    value: categories.length, color: "var(--bw-ink)"   },
            { label: "Active",   value: totalActive,       color: "var(--bw-green)" },
            { label: "Inactive", value: totalInactive,     color: "var(--bw-muted)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-6 py-5 rounded-[var(--bw-radius-lg)]"
              style={{
                background: "var(--bw-surface)",
                border: "1px solid var(--bw-border)",
                boxShadow: "var(--bw-shadow-sm)",
              }}
            >
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>
                {stat.label}
              </p>
              <p
                className="mt-1.5 text-[30px] m-0 font-semibold"
                style={{ color: stat.color, fontFamily: "var(--bw-font-display)" }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--bw-ghost)" }}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className={`${inputCls} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className="px-4 py-2 rounded-full text-sm font-medium capitalize cursor-pointer border transition-all"
                style={
                  filterActive === f
                    ? { background: "var(--bw-ink)", color: "var(--bw-bg)",   borderColor: "var(--bw-ink)" }
                    : { background: "var(--bw-surface)", color: "var(--bw-muted)", borderColor: "var(--bw-border)" }
                }
              >
                {f}
              </button>
            ))}
          </div>

          {/* New category */}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--bw-radius-md)] text-sm font-bold border-none cursor-pointer transition-all"
            style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bw-ink-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bw-ink)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Category
          </button>
        </div>

        {/* ── Table ── */}
        <div
          className="rounded-[var(--bw-radius-lg)] overflow-hidden"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          {/* Head */}
          <div
            className="grid px-5 py-3"
            style={{
              gridTemplateColumns: "1fr 1fr 110px 100px 80px",
              background: "var(--bw-surface-alt)",
              borderBottom: "1px solid var(--bw-border)",
            }}
          >
            {["Name", "Slug", "Status", "Created", ""].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>
                {h}
              </span>
            ))}
          </div>

          {/* Body */}
          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--bw-ghost)" }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--bw-ghost)" }}>
              {search ? `No categories match "${search}"` : "No categories yet — create your first one."}
            </div>
          ) : (
            filtered.map((cat, i) => (
              <div
                key={cat._id}
                className="grid px-5 py-3.5 items-center transition-colors duration-100 cursor-default"
                style={{
                  gridTemplateColumns: "1fr 1fr 110px 100px 80px",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--bw-divider)" : "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bw-surface-alt)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Name + desc */}
                <div className="pr-3 min-w-0">
                  <p className="m-0 text-sm font-semibold truncate" style={{ color: "var(--bw-ink)" }}>{cat.name}</p>
                  {cat.description && (
                    <p className="m-0 mt-0.5 text-xs truncate max-w-[180px]" style={{ color: "var(--bw-ghost)" }}>
                      {cat.description}
                    </p>
                  )}
                </div>

                {/* Slug */}
                <span
                  className="text-xs px-2 py-0.5 rounded-md inline-block max-w-[90%] truncate"
                  style={{
                    fontFamily: "var(--bw-font-mono)",
                    color: "var(--bw-ink-secondary)",
                    background: "var(--bw-bg-alt)",
                    border: "1px solid var(--bw-border)",
                  }}
                >
                  {cat.slug}
                </span>

                {/* Status (clickable) */}
                <div className="cursor-pointer" onClick={() => toggleActive(cat)} title="Click to toggle">
                  <StatusBadge active={cat.isActive} />
                </div>

                {/* Date */}
                <span className="text-xs" style={{ color: "var(--bw-muted)" }}>
                  {new Date(cat.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>

                {/* Actions */}
                <div className="flex gap-1.5 justify-end">
                  <IconBtn onClick={() => setEditTarget(cat)} title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </IconBtn>
                  <IconBtn onClick={() => setDeleteTarget(cat)} title="Delete" danger>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                    </svg>
                  </IconBtn>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="mt-3 text-xs text-right" style={{ color: "var(--bw-ghost)" }}>
            Showing {filtered.length} of {categories.length} categories
          </p>
        )}
      </main>

      {/* ── Modals ── */}
      <Modal open={createOpen} title="New Category" onClose={() => setCreateOpen(false)}>
        <CategoryForm onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      <Modal open={!!editTarget} title="Edit Category" onClose={() => setEditTarget(null)}>
        {editTarget && <CategoryForm initial={editTarget} onSubmit={handleUpdate} loading={formLoading} />}
      </Modal>

      <Modal open={!!deleteTarget} title="Confirm Deletion" onClose={() => setDeleteTarget(null)}>
        {deleteTarget && (
          <DeleteConfirm
            category={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleteLoading}
          />
        )}
      </Modal>

      {/* Keyframes */}
      <style>{`
        @keyframes bw-fade-in    { from{opacity:0} to{opacity:1} }
        @keyframes bw-scale-in   { from{opacity:0;transform:scale(0.96) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes bw-slide-right{ from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function BwToggle({
  checked, onChange, label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
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
      <span className="text-sm" style={{ color: "var(--bw-ink)" }}>{label}</span>
    </label>
  );
}

function IconBtn({
  onClick, title, danger = false, children,
}: {
  onClick: () => void;
  title?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-md border cursor-pointer transition-all"
      style={{
        background: "var(--bw-surface)",
        borderColor: "var(--bw-border)",
        color: danger ? "var(--bw-red)" : "var(--bw-muted)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget).style.background   = danger ? "var(--bw-red-bg)" : "var(--bw-surface-alt)";
        (e.currentTarget).style.borderColor  = danger ? "var(--bw-red)"    : "var(--bw-ink)";
        (e.currentTarget).style.color        = danger ? "var(--bw-red)"    : "var(--bw-ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget).style.background   = "var(--bw-surface)";
        (e.currentTarget).style.borderColor  = "var(--bw-border)";
        (e.currentTarget).style.color        = danger ? "var(--bw-red)" : "var(--bw-muted)";
      }}
    >
      {children}
    </button>
  );
}