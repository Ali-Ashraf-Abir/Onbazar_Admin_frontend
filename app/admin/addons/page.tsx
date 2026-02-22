"use client";

import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL as string;

/* ─────────────────────── types ─────────────────────── */

interface Addon {
  _id: string;
  name: string;
  image: string;
  description: string | null;
  note: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

type FormMode = "create" | "edit";

const EMPTY_FORM = {
  name: "",
  description: "",
  note: "",
  price: "",
  currency: "BDT",
  isActive: true,
};

function fmt(n: number, currency = "BDT") {
  return `${currency === "BDT" ? "৳" : currency}${n.toFixed(2)}`;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

export default function AdminAddonsPage() {
  /* ── list state ── */
  const [addons,   setAddons]  = useState<Addon[]>([]);
  const [meta,     setMeta]    = useState<any>(null);
  const [loading,  setLoading] = useState(false);
  const [page,     setPage]    = useState(1);
  const [q,        setQ]       = useState("");
  const [isActive, setIsActive]= useState("true");
  const [applied,  setApplied] = useState({ q: "", isActive: "true", page: 1 });

  /* ── panel state ── */
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode,      setMode]      = useState<FormMode>("create");
  const [editId,    setEditId]    = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);

  /* ── form fields ── */
  const [form,         setForm]         = useState({ ...EMPTY_FORM });
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver,     setDragOver]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─────────────────────── fetch ─────────────────────── */

  async function load(a: typeof applied) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(a.page));
      params.set("limit", "12");
      if (a.q)        params.set("q",        a.q);
      if (a.isActive) params.set("isActive", a.isActive);
      const res  = await fetch(`${API}/admin/addons?${params}`);
      const data = await res.json();
      setAddons(data.data || []);
      setMeta(data.meta || null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(applied); }, [applied]);

  function applyFilters() { setApplied({ q, isActive, page: 1 }); setPage(1); }
  function resetFilters()  {
    setQ(""); setIsActive("true"); setPage(1);
    setApplied({ q: "", isActive: "true", page: 1 });
  }
  function goPage(p: number) { setPage(p); setApplied(a => ({ ...a, page: p })); }

  const hasPending = q !== applied.q || isActive !== applied.isActive;
  const hasFilters = !!(applied.q || applied.isActive !== "true");

  /* ─────────────────────── panel helpers ─────────────────────── */

  function openCreate() {
    setMode("create"); setEditId(null);
    setForm({ ...EMPTY_FORM });
    setImageFile(null); setImagePreview(null);
    setPanelOpen(true);
  }

  function openEdit(addon: Addon) {
    setMode("edit"); setEditId(addon._id);
    setForm({
      name: addon.name,
      description: addon.description || "",
      note: addon.note || "",
      price: String(addon.price),
      currency: addon.currency || "BDT",
      isActive: addon.isActive,
    });
    setImageFile(null); setImagePreview(addon.image);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setImageFile(null); setImagePreview(null);
  }

  /* ─────────────────────── image handling ─────────────────────── */

  function onFileChange(file: File | null) {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  /* ─────────────────────── save ─────────────────────── */

  async function handleSave() {
    if (!form.name.trim()) return alert("Name is required");
    if (!form.price || isNaN(Number(form.price))) return alert("Enter a valid price");
    if (mode === "create" && !imageFile) return alert("An image is required");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name",     form.name.trim());
      fd.append("price",    form.price);
      fd.append("currency", form.currency);
      fd.append("isActive", String(form.isActive));
      if (form.description.trim()) fd.append("description", form.description.trim());
      if (form.note.trim())        fd.append("note",        form.note.trim());
      if (imageFile)               fd.append("image",       imageFile);

      const url    = mode === "create" ? `${API}/admin/addons` : `${API}/admin/addons/${editId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res    = await fetch(url, { method, body: fd });
      const data   = await res.json();
      if (!res.ok) { alert(data.message || "Save failed"); return; }

      closePanel();
      load(applied);
    } finally { setSaving(false); }
  }

  /* ─────────────────────── delete ─────────────────────── */

  async function handleDelete(addon: Addon) {
    if (!confirm(`Delete "${addon.name}"? This cannot be undone.`)) return;
    const res  = await fetch(`${API}/admin/addons/${addon._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Delete failed"); return; }
    load(applied);
  }

  /* ─────────────────────── toggle active ─────────────────────── */

  async function toggleActive(addon: Addon) {
    const fd = new FormData();
    fd.append("isActive", String(!addon.isActive));
    const res  = await fetch(`${API}/admin/addons/${addon._id}`, { method: "PATCH", body: fd });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Update failed"); return; }
    setAddons(prev => prev.map(a => a._id === addon._id ? data.data : a));
  }

  /* ═══════════════════════════════════════════════════════ */

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "var(--bw-font-body)", background: "var(--bw-bg)", color: "var(--bw-ink)" }}
    >
      <div className="max-w-[1400px] mx-auto px-5 py-8">

        {/* ── Page header ── */}
        <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
              Add-ons
            </h1>
            {meta && (
              <p className="mt-1 text-sm" style={{ color: "var(--bw-muted)" }}>
                {meta.total} add-on{meta.total !== 1 ? "s" : ""}
                {meta.totalPages > 1 && ` · Page ${meta.page} of ${meta.totalPages}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-5 py-2.5 rounded-[var(--bw-radius-md)] text-sm font-bold border-none cursor-pointer transition-all"
            style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bw-ink-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bw-ink)")}
          >
            + New Add-on
          </button>
        </div>

        {/* ── Filters ── */}
        <div
          className="flex gap-2.5 items-center flex-wrap p-4 mb-6 rounded-[var(--bw-radius-xl)]"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
              style={{ color: "var(--bw-ghost)" }}
            >
              🔍
            </span>
            <input
              className={`${inputCls} pl-9`}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyFilters()}
              placeholder="Search add-ons…"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              className={`${inputCls} w-auto appearance-none cursor-pointer pr-8 min-w-[140px]`}
              value={isActive}
              onChange={e => setIsActive(e.target.value)}
            >
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
              <option value="">All statuses</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3.5 py-2.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border cursor-pointer transition-all"
                style={{ background: "none", borderColor: "var(--bw-border)", color: "var(--bw-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.borderColor = "var(--bw-red)";
                  (e.currentTarget).style.color       = "var(--bw-red)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.borderColor = "var(--bw-border)";
                  (e.currentTarget).style.color       = "var(--bw-muted)";
                }}
              >
                ✕ Reset
              </button>
            )}
            <button
              type="button"
              onClick={applyFilters}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] border-none cursor-pointer transition-all"
              style={{
                background: hasPending ? "var(--bw-ink)" : "var(--bw-ink)",
                color: "var(--bw-bg)",
                opacity: hasPending ? 1 : 0.75,
              }}
            >
              {hasPending && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: "var(--bw-bg)",
                    animation: "bw-pulse 1.2s ease-in-out infinite",
                  }}
                />
              )}
              {hasPending ? "Apply" : "Search"}
            </button>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[var(--bw-radius-lg)] overflow-hidden"
                style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
              >
                <div
                  className="w-full h-40"
                  style={{
                    background: "linear-gradient(90deg,var(--bw-surface-alt) 25%,var(--bw-border) 50%,var(--bw-surface-alt) 75%)",
                    backgroundSize: "200% 100%",
                    animation: `bw-shimmer 1.4s ${i * 70}ms infinite`,
                  }}
                />
                <div className="p-4 flex flex-col gap-2.5">
                  {[["60%", 16], ["90%", 12], ["75%", 12]].map(([w, h], j) => (
                    <div
                      key={j}
                      className="rounded"
                      style={{
                        width: w, height: h,
                        background: "linear-gradient(90deg,var(--bw-surface-alt) 25%,var(--bw-border) 50%,var(--bw-surface-alt) 75%)",
                        backgroundSize: "200% 100%",
                        animation: `bw-shimmer 1.4s ${i * 70 + j * 50}ms infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : addons.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="text-5xl mb-3 opacity-25">🎁</div>
              <p className="text-base font-semibold mb-1.5" style={{ color: "var(--bw-muted)" }}>No add-ons yet</p>
              <p className="text-sm mb-5" style={{ color: "var(--bw-ghost)" }}>
                Create your first add-on like a gift card or ring.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="px-5 py-2.5 rounded-[var(--bw-radius-md)] text-sm font-bold border-none cursor-pointer"
                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
              >
                + Create Add-on
              </button>
            </div>
          ) : (
            addons.map(addon => (
              <div
                key={addon._id}
                className="flex flex-col rounded-[var(--bw-radius-lg)] overflow-hidden transition-all duration-200"
                style={{
                  background: "var(--bw-surface)",
                  border: "1px solid var(--bw-border)",
                  opacity: addon.isActive ? 1 : 0.55,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.boxShadow = "var(--bw-shadow-hover)";
                  (e.currentTarget).style.transform = "translateY(-2px)";
                  (e.currentTarget).style.borderColor = "var(--bw-border-strong)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.boxShadow   = "";
                  (e.currentTarget).style.transform   = "";
                  (e.currentTarget).style.borderColor = "var(--bw-border)";
                }}
              >
                {/* Image */}
                <div
                  className="relative overflow-hidden group"
                  style={{ background: "var(--bw-surface-alt)" }}
                >
                  {addon.image
                    ? <img src={addon.image} alt={addon.name} className="w-full h-40 object-cover block transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-40 flex items-center justify-center text-5xl opacity-20">🎁</div>
                  }
                  <span
                    className="absolute top-2 right-2 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
                    style={
                      addon.isActive
                        ? { background: "rgba(22,163,74,0.9)", color: "#fff" }
                        : { background: "rgba(10,10,10,0.55)",  color: "#fff" }
                    }
                  >
                    {addon.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3.5 flex flex-col gap-1.5 flex-1">
                  <p className="text-sm font-bold tracking-tight" style={{ color: "var(--bw-ink)" }}>
                    {addon.name}
                  </p>

                  {addon.description && (
                    <p
                      className="text-xs leading-relaxed flex-1"
                      style={{
                        color: "var(--bw-muted)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {addon.description}
                    </p>
                  )}

                  {addon.note && (
                    <div
                      className="text-[11px] italic px-2 py-1.5 rounded-md mt-0.5"
                      style={{
                        color: "var(--bw-ink-secondary)",
                        background: "var(--bw-surface-alt)",
                        border: "1px solid var(--bw-border)",
                      }}
                    >
                      📝 {addon.note}
                    </div>
                  )}

                  <p className="text-[10px] mt-0.5" style={{ color: "var(--bw-ghost)" }}>
                    {timeAgo(addon.createdAt)}
                  </p>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between mt-2.5 pt-2.5 border-t"
                    style={{ borderColor: "var(--bw-border)" }}
                  >
                    <span className="text-base font-bold tracking-tight" style={{ color: "var(--bw-ink)" }}>
                      {fmt(addon.price, addon.currency)}
                    </span>
                    <div className="flex gap-1.5">
                      {/* Toggle */}
                      <AddonActionBtn onClick={() => toggleActive(addon)}>
                        {addon.isActive ? "Deactivate" : "Activate"}
                      </AddonActionBtn>
                      {/* Edit */}
                      <AddonActionBtn onClick={() => openEdit(addon)}>Edit</AddonActionBtn>
                      {/* Delete */}
                      <AddonActionBtn onClick={() => handleDelete(addon)} danger>✕</AddonActionBtn>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <PageBtn onClick={() => goPage(page - 1)} disabled={page <= 1} label="←" />
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..."
                  ? <span key={`e-${i}`} className="text-sm px-2" style={{ color: "var(--bw-ghost)" }}>…</span>
                  : <PageBtn key={p} onClick={() => goPage(p as number)} disabled={false} label={String(p)} current={p === page} />
              )}
            <PageBtn onClick={() => goPage(page + 1)} disabled={page >= meta.totalPages} label="→" />
          </div>
        )}
      </div>

      {/* ══════════════════ SLIDE-OVER PANEL ══════════════════ */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(0,0,0,0.3)", animation: "bw-fade-in 0.18s ease" }}
            onClick={closePanel}
          />

          {/* Panel */}
          <div
            className="fixed top-0 right-0 bottom-0 z-[101] flex flex-col"
            style={{
              width: 440,
              maxWidth: "100vw",
              background: "var(--bw-bg)",
              borderLeft: "1px solid var(--bw-border)",
              boxShadow: "var(--bw-shadow-lg)",
              animation: "bw-slide-in 0.22s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b"
              style={{ borderColor: "var(--bw-border)" }}
            >
              <span
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
              >
                {mode === "create" ? "New Add-on" : "Edit Add-on"}
              </span>
              <button
                type="button"
                onClick={closePanel}
                className="w-8 h-8 flex items-center justify-center rounded-full text-base cursor-pointer border transition-all"
                style={{
                  background: "var(--bw-input-bg)",
                  borderColor: "var(--bw-border)",
                  color: "var(--bw-muted)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.borderColor = "var(--bw-ink)";
                  (e.currentTarget).style.color       = "var(--bw-ink)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.borderColor = "var(--bw-border)";
                  (e.currentTarget).style.color       = "var(--bw-muted)";
                }}
              >
                ✕
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

              {/* Image drop zone */}
              <div>
                <label className={labelCls}>
                  Image {mode === "create" && <span style={{ color: "var(--bw-red)" }}>*</span>}
                </label>
                <div
                  className="relative rounded-[var(--bw-radius-md)] overflow-hidden cursor-pointer border-2 border-dashed transition-all duration-150"
                  style={{
                    borderColor: dragOver ? "var(--bw-ink)" : "var(--bw-border)",
                    background:  dragOver ? "var(--bw-bg-alt)" : "var(--bw-input-bg)",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); onFileChange(e.dataTransfer.files?.[0] || null); }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => onFileChange(e.target.files?.[0] || null)}
                  />
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="preview" className="w-full h-44 object-cover block" />
                      {/* Change overlay */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-150"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                      >
                        <span className="text-sm font-bold text-white">🔄 Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="h-36 flex flex-col items-center justify-center gap-2">
                      <div className="text-3xl opacity-30">📷</div>
                      <p className="text-sm font-semibold" style={{ color: "var(--bw-ink-secondary)" }}>
                        Click or drag to upload
                      </p>
                      <p className="text-xs" style={{ color: "var(--bw-ghost)" }}>PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>
                {imageFile && (
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--bw-muted)" }}>
                    📎 {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className={labelCls}>
                  Name <span style={{ color: "var(--bw-red)" }}>*</span>
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. Gift Card, Ring Box"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Price + currency */}
              <div>
                <label className={labelCls}>
                  Price <span style={{ color: "var(--bw-red)" }}>*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className={inputCls}
                      type="number" min="0" step="0.01"
                      placeholder="e.g. 150"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      {form.currency}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      className={`${inputCls} w-auto appearance-none cursor-pointer pr-8`}
                      value={form.currency}
                      onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    >
                      <option>BDT</option>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>
                  Description{" "}
                  <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>(optional)</span>
                </label>
                <textarea
                  className={`${inputCls} resize-y min-h-[70px]`}
                  placeholder="Brief description shown to customers…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Personalisation prompt */}
              <div>
                <label className={labelCls}>
                  Personalisation Prompt{" "}
                  <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>(optional)</span>
                </label>
                <input
                  className={inputCls}
                  placeholder='e.g. "What name would you like on the card?"'
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
                <p className="text-[11px] mt-1.5 italic" style={{ color: "var(--bw-ghost)" }}>
                  Shown to the customer so they know what personalisation to provide.
                </p>
              </div>

              {/* Active toggle */}
              <BwToggle
                checked={form.isActive}
                onChange={v => setForm(f => ({ ...f, isActive: v }))}
                label={
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                      style={{ background: form.isActive ? "var(--bw-green)" : "var(--bw-ghost)" }}
                    />
                    {form.isActive ? "Active — visible to customers" : "Inactive — hidden from store"}
                  </span>
                }
                desc="Toggle to show or hide this add-on"
              />
            </div>

            {/* Panel footer */}
            <div
              className="flex gap-2.5 px-5 py-4 flex-shrink-0 border-t"
              style={{ borderColor: "var(--bw-border)" }}
            >
              <button
                type="button"
                onClick={closePanel}
                className="flex-1 py-3 rounded-[var(--bw-radius-md)] text-sm font-semibold cursor-pointer transition-all border"
                style={{
                  background: "var(--bw-input-bg)",
                  borderColor: "var(--bw-border)",
                  color: "var(--bw-muted)",
                  fontFamily: "var(--bw-font-body)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] py-3 rounded-[var(--bw-radius-md)] text-sm font-bold border-none cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)", fontFamily: "var(--bw-font-body)" }}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--bw-bg)" }} />
                    {mode === "create" ? "Creating…" : "Saving…"}
                  </>
                ) : (
                  mode === "create" ? "Create Add-on →" : "Save Changes →"
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes bw-pulse    { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes bw-shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes bw-fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes bw-slide-in { from{transform:translateX(100%)} to{transform:translateX(0)} }
      `}</style>
    </div>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function BwToggle({
  checked, onChange, label, desc,
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
        <div className="text-sm font-semibold" style={{ color: "var(--bw-ink)" }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: "var(--bw-ghost)" }}>{desc}</div>}
      </div>
    </label>
  );
}

function AddonActionBtn({
  onClick, children, danger = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold border cursor-pointer transition-all"
      style={{
        background: "var(--bw-input-bg)",
        borderColor: "var(--bw-border)",
        color: "var(--bw-muted)",
        fontFamily: "var(--bw-font-body)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget).style.borderColor = danger ? "var(--bw-red)" : "var(--bw-ink)";
        (e.currentTarget).style.color       = danger ? "var(--bw-red)" : "var(--bw-ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget).style.borderColor = "var(--bw-border)";
        (e.currentTarget).style.color       = "var(--bw-muted)";
      }}
    >
      {children}
    </button>
  );
}

function PageBtn({
  onClick, disabled, label, current = false,
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
      className="w-9 h-9 flex items-center justify-center rounded-[var(--bw-radius-md)] text-sm font-medium transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border"
      style={
        current
          ? { background: "var(--bw-ink)", color: "var(--bw-bg)",    borderColor: "var(--bw-ink)" }
          : { background: "var(--bw-surface)", color: "var(--bw-muted)", borderColor: "var(--bw-border)" }
      }
      onMouseEnter={(e) => { if (!disabled && !current) { (e.currentTarget).style.borderColor = "var(--bw-ink)"; (e.currentTarget).style.color = "var(--bw-ink)"; } }}
      onMouseLeave={(e) => { if (!disabled && !current) { (e.currentTarget).style.borderColor = "var(--bw-border)"; (e.currentTarget).style.color = "var(--bw-muted)"; } }}
    >
      {label}
    </button>
  );
}