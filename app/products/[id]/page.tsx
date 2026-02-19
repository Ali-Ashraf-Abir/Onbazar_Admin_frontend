"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { SIZE_CHART_PRESETS, SizeChart, SizeChartRow, buildDefaultChart, syncChartToSizes, chartToJson } from "../../../constants/sizeChart";

const API = process.env.NEXT_PUBLIC_API_URL as string;

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "Free Size"];

/* ── types ── */
interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [settingCover, setSettingCover] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [allowedAddonsJson, setAllowedAddonsJson] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageMode, setImageMode] = useState("append");
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeDropOpen, setSizeDropOpen] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const sizeDropRef = useRef<HTMLDivElement>(null);
  const sizeTriggerRef = useRef<HTMLButtonElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [useCustomSizeChart, setUseCustomSizeChart] = useState(false);
  const [sizeChart, setSizeChart] = useState<SizeChart>({ unit: "inches", columns: [], rows: [] });

  /* ── category ── */
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  /* ── fetch categories once ── */
  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`${API}/categories`);
        const json = await res.json();
        if (res.ok) setCategories(json.data as Category[]);
      } catch {
        // silently fail
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  async function load() {
    if (!id) return;
    const res = await fetch(`${API}/products/${id}`);
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Failed to load product"); return; }
    const p = data.data;
    setProduct(p);
    setName(p.name);
    setPrice(String(p.price / 100));
    setDescription(p.details?.description || "");
    setBullets(p.details?.bullets || []);
    setSizes(p.sizes || []);
    setAllowedAddonsJson(p.allowedAddons ? JSON.stringify(p.allowedAddons, null, 2) : "");
    setIsActive(Boolean(p.isActive));
    // category: populated object or raw id string
    const cat = p.category;
    setCategoryId(typeof cat === "object" && cat !== null ? cat._id : (cat ?? ""));
    if (p.sizeChart?.columns?.length > 0) { setUseCustomSizeChart(true); setSizeChart(p.sizeChart); }
    else { setUseCustomSizeChart(false); setSizeChart({ unit: "inches", columns: [], rows: [] }); }
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (sizeDropRef.current && !sizeDropRef.current.contains(e.target as Node)) setSizeDropOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!useCustomSizeChart) return;
    setSizeChart((prev) => {
      if (prev.columns.length === 0) return buildDefaultChart(sizes);
      return syncChartToSizes(prev, sizes);
    });
  }, [sizes, useCustomSizeChart]);

  function toggleSize(s: string) { setSizes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]); }
  function addCustomSize() { const v = customSizeInput.trim().toUpperCase(); if (v && !sizes.includes(v)) setSizes((p) => [...p, v]); setCustomSizeInput(""); }
  function removeSize(s: string) { setSizes((p) => p.filter((x) => x !== s)); }

  function addBullet() { setBullets((p) => [...p, ""]); }
  function updateBullet(i: number, v: string) { setBullets((p) => p.map((b, j) => j === i ? v : b)); }
  function removeBullet(i: number) { setBullets((p) => p.filter((_, j) => j !== i)); }

  function updateChartCell(ri: number, ci: number, v: string) {
    setSizeChart((p) => ({ ...p, rows: p.rows.map((r, i) => i === ri ? { ...r, values: r.values.map((x, j) => j === ci ? v : x) } : r) }));
  }
  function updateRowLabel(ri: number, v: string) {
    setSizeChart((p) => ({ ...p, rows: p.rows.map((r, i) => i === ri ? { ...r, label: v } : r) }));
  }
  function addChartRow() { setSizeChart((p) => ({ ...p, rows: [...p.rows, { label: "New Measurement", values: p.columns.map(() => "") }] })); }
  function removeChartRow(i: number) { setSizeChart((p) => ({ ...p, rows: p.rows.filter((_, j) => j !== i) })); }

  async function handlePatch() {
    if (!categoryId) return alert("Please select a category");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("category", categoryId);
      fd.append("price", String(Math.round(Number(price) * 100)));
      fd.append("isActive", String(isActive));
      fd.append("details", JSON.stringify({ description, bullets: bullets.map((b) => b.trim()).filter(Boolean) }));
      fd.append("sizes", JSON.stringify(sizes));
      if (useCustomSizeChart && sizeChart.columns.length > 0) fd.append("sizeChart", chartToJson(sizeChart));
      else fd.append("sizeChart", JSON.stringify(null));
      if (allowedAddonsJson.trim()) {
        try { fd.append("allowedAddons", JSON.stringify(JSON.parse(allowedAddonsJson))); }
        catch { alert("Invalid allowedAddons JSON"); setSaving(false); return; }
      } else {
        fd.append("allowedAddons", JSON.stringify(null));
      }
      fd.append("imageMode", imageMode);
      if (newFiles) { for (let i = 0; i < newFiles.length; i++) fd.append("images", newFiles[i]); }
      const res = await fetch(`${API}/products/${id}`, { method: "PATCH", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Update failed"); return; }
      setProduct(data.data);
      setNewFiles(null);
      alert("Saved!");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product?.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API}/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Delete failed"); return; }
    window.location.href = "/";
  }

  async function removeImage(url: string) {
    const res = await fetch(`${API}/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ removeImages: [url] }) });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Failed removing image"); return; }
    setProduct(data.data);
  }

  async function setCoverImage(url: string) {
    if (settingCover) return;
    const reordered = [url, ...product.images.filter((u: string) => u !== url)];
    setSettingCover(true);
    try {
      const fd = new FormData();
      fd.append("images", JSON.stringify(reordered));
      const res = await fetch(`${API}/products/${id}`, { method: "PATCH", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to set cover image"); return; }
      setProduct(data.data);
    } finally {
      setSettingCover(false);
    }
  }

  async function resetSizeChartToDefault() {
    if (!confirm("Reset sizeChart to default?")) return;
    const res = await fetch(`${API}/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sizeChart: null }) });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Failed resetting sizeChart"); return; }
    setProduct(data.data);
    setUseCustomSizeChart(false);
    setSizeChart({ unit: "inches", columns: [], rows: [] });
  }

  const selectedCategory = categories.find((c) => c._id === categoryId);

  if (!id) return <div style={{ padding: 40, fontFamily: "var(--font-body)" }}>Loading route…</div>;
  if (!product) return (
    <div style={{ padding: 40, fontFamily: "var(--font-body)", color: "var(--color-subtle)", display: "flex", alignItems: "center", gap: 12 }}>
      <span className="as-spinner" style={{ borderTopColor: "var(--color-accent)" }} /> Loading product…
    </div>
  );

  return (
    <>
      <style>{`
        .pd-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }
        .pd-meta-price { font-size: 22px; font-weight: 600; letter-spacing: -0.4px; }
        .pd-meta-price span { font-size: 14px; color: var(--color-subtle); font-weight: 400; margin-right: 2px; }
        .pd-meta-id { font-size: 11px; color: var(--color-ghost); font-family: monospace; }
        .pd-meta-slug { font-size: 12px; color: var(--color-subtle); background: var(--color-surface-alt); padding: 3px 8px; border-radius: var(--radius-sm); }
        .pd-meta-category { font-size: 12px; color: var(--color-accent-dark); background: rgba(200,169,126,0.1); border: 1px solid rgba(200,169,126,0.25); padding: 3px 10px; border-radius: var(--radius-pill); font-weight: 600; }
        .pd-new-files { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
        .pd-new-file-chip { font-size: 11px; background: var(--color-surface-alt); color: var(--color-muted); padding: 3px 9px; border-radius: var(--radius-pill); }
        .pd-no-chart { padding: 20px; text-align: center; color: var(--color-ghost); font-size: 13px; background: var(--color-bg); border-radius: var(--radius-md); }

        .as-cat-select {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background-color: var(--color-input-bg);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239C9589' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 11px 38px 11px 14px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-ink);
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
          outline: none;
        }
        .as-cat-select:focus {
          border-color: var(--color-accent);
          background-color: var(--color-input-focus);
          box-shadow: 0 0 0 3px rgba(200,169,126,0.18);
        }
        .as-cat-select--placeholder { color: var(--color-ghost); }
        .as-cat-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 8px;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-body);
          background: rgba(200,169,126,0.12);
          color: var(--color-accent-dark);
          border: 1px solid rgba(200,169,126,0.3);
        }
        .as-cat-empty { font-size: 12px; color: var(--color-subtle); margin-top: 4px; font-style: italic; }
      `}</style>

      <div style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)", minHeight: "100vh", color: "var(--color-ink)" }}>
        <header className="as-header">
          <span className="as-header-brand">Admin Studio</span>
          <div className="as-header-actions">
            <button type="button" className="as-btn-ghost-delete" onClick={handleDelete}>Delete Product</button>
            <a href="/" className="as-header-back">← Back</a>
          </div>
        </header>

        <div className="as-body">
          <div className="as-title-row">
            <h1 className="as-title">{product.name}</h1>
          </div>
          <div className="pd-meta">
            <span className={`as-badge ${product.isActive ? "as-badge--active" : "as-badge--draft"}`}>{product.isActive ? "Active" : "Draft"}</span>
            <span className="pd-meta-price"><span>৳</span>{(product.price / 100).toFixed(2)}</span>
            {/* Show current saved category from the product object */}
            {product.category && typeof product.category === "object" && (
              <span className="pd-meta-category">{product.category.name}</span>
            )}
            <span className="pd-meta-slug">{product.slug}</span>
            <span className="pd-meta-id">{product._id}</span>
          </div>

          <div className="as-two-col">
            {/* ── LEFT ── */}
            <div className="as-col">

              {/* Images */}
              <div className="as-card">
                <div className="as-card-header">
                  <div className="as-card-title"><div className="as-card-title-icon">🖼</div>Images</div>
                  <span style={{ fontSize: 12, color: "var(--color-subtle)", fontWeight: 500 }}>{product.images.length}/4</span>
                </div>
                <div className="as-card-body">
                  {product.images.length > 0 ? (
                    <div className="as-img-grid">
                      {product.images.map((img: string, idx: number) => (
                        <div key={img} className={`as-img-card ${idx === 0 ? "as-img-card--cover" : ""}`}>
                          <img src={img} alt="" className="as-img-preview" />
                          {idx === 0 && <div className="as-img-cover-badge">COVER</div>}
                          <div className="as-img-actions">
                            <button
                              type="button"
                              className="as-img-btn as-img-btn--cover"
                              onClick={() => setCoverImage(img)}
                              disabled={idx === 0 || settingCover}
                              style={idx === 0 ? { opacity: 0.35 } : {}}
                            >
                              {settingCover && idx !== 0 ? "Saving…" : "Set Cover"}
                            </button>
                            <button type="button" className="as-img-btn as-img-btn--remove" onClick={() => removeImage(img)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pd-no-chart">No images uploaded yet.</div>
                  )}
                </div>
              </div>

              {/* Upload */}
              <div className="as-card">
                <div className="as-card-header">
                  <div className="as-card-title"><div className="as-card-title-icon">📤</div>Upload Images</div>
                </div>
                <div className="as-card-body">
                  <div className="as-field">
                    <label className="as-label">Mode</label>
                    <select className="as-select" style={{ width: "100%" }} value={imageMode} onChange={(e) => setImageMode(e.target.value)}>
                      <option value="append">Append — add to existing images</option>
                      <option value="replace">Replace — swap all images</option>
                    </select>
                  </div>
                  <label
                    className={`as-drop-zone ${dragOver ? "as-drop-zone--active" : ""}`}
                    style={{ marginTop: 4 }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); setNewFiles(e.dataTransfer.files); }}
                  >
                    <input type="file" multiple accept="image/*" className="as-hidden" onChange={(e) => setNewFiles(e.target.files)} />
                    <div className="as-drop-icon">📷</div>
                    <p className="as-drop-text">Click or drag images here</p>
                    <p className="as-drop-sub">PNG, JPG, WEBP</p>
                  </label>
                  {newFiles && newFiles.length > 0 && (
                    <div className="pd-new-files">
                      {Array.from(newFiles).map((f, i) => <span key={i} className="pd-new-file-chip">📎 {f.name}</span>)}
                      <button type="button" onClick={() => setNewFiles(null)} style={{ background: "none", border: "none", color: "var(--color-subtle)", fontSize: 11, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>clear</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Size Chart */}
              <div className="as-card">
                <div className="as-accordion-toggle" onClick={() => setShowSizeChart((p) => !p)}>
                  <span className="as-accordion-label">
                    <span>📏</span> Size Chart
                    {sizeChart.unit && useCustomSizeChart && <span style={{ fontSize: 11, color: "var(--color-ghost)", fontWeight: 400 }}>({sizeChart.unit})</span>}
                  </span>
                  <span className={`as-chevron ${showSizeChart ? "as-chevron--open" : ""}`}>▼</span>
                </div>
                <div className="as-accordion-body" style={{ maxHeight: showSizeChart ? "1200px" : "0", opacity: showSizeChart ? 1 : 0 }}>
                  <div className="as-divider" />
                  <div className="as-card-body">
                    <label className="as-toggle-row" style={{ marginBottom: 18 }}>
                      <div className="as-toggle">
                        <input type="checkbox" checked={useCustomSizeChart} onChange={(e) => {
                          setUseCustomSizeChart(e.target.checked);
                          if (e.target.checked && sizeChart.columns.length === 0) setSizeChart(buildDefaultChart(sizes));
                        }} />
                        <div className="as-toggle-slider" />
                      </div>
                      <div>
                        <div className="as-toggle-label">Use Custom Size Chart</div>
                        <div className="as-toggle-desc">Edit measurement table for this product</div>
                      </div>
                    </label>

                    {useCustomSizeChart ? (
                      sizes.length === 0 ? (
                        <div className="pd-no-chart">↑ Add sizes to start building your size chart.</div>
                      ) : (
                        <>
                          <div style={{ marginBottom: 12 }}>
                            <label className="as-label">Load Preset</label>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {Object.keys(SIZE_CHART_PRESETS).map((key) => (
                                <button key={key} type="button"
                                  className="as-btn-outline"
                                  style={{ textTransform: "capitalize", fontSize: 12, padding: "4px 12px" }}
                                  onClick={() => { if (confirm(`Load "${key}" preset? This will overwrite current values.`)) setSizeChart(buildDefaultChart(sizes, key)); }}
                                >{key}</button>
                              ))}
                            </div>
                          </div>
                          <div className="as-chart-meta">
                            <span className="as-chart-meta-label">Measurements ({sizeChart.unit})</span>
                            <div className="as-unit-toggle">
                              <button type="button" className={`as-unit-btn ${sizeChart.unit === "inches" ? "as-unit-btn--active" : ""}`} onClick={() => setSizeChart((p) => ({ ...p, unit: "inches" }))}>inches</button>
                              <button type="button" className={`as-unit-btn ${sizeChart.unit === "cm" ? "as-unit-btn--active" : ""}`} onClick={() => setSizeChart((p) => ({ ...p, unit: "cm" }))}>cm</button>
                            </div>
                          </div>
                          <div className="as-chart-wrap">
                            <table className="as-chart-table">
                              <thead>
                                <tr>
                                  <th>Measurement</th>
                                  {sizeChart.columns.map((col: string, ci: number) => <th key={ci}>{col}</th>)}
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {sizeChart.rows.map((row: SizeChartRow, ri: number) => (
                                  <tr key={ri}>
                                    <td><input className="as-chart-cell as-chart-cell--label" value={row.label} onChange={(e) => updateRowLabel(ri, e.target.value)} placeholder="e.g. Chest" /></td>
                                    {row.values.map((val: any, ci: number) => (
                                      <td key={ci}><input className="as-chart-cell" type="number" min="0" step="0.5" value={val} onChange={(e) => updateChartCell(ri, ci, e.target.value)} placeholder="–" /></td>
                                    ))}
                                    <td className="as-chart-del-col"><button type="button" className="as-chart-del-btn" onClick={() => removeChartRow(ri)}>✕</button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <button type="button" className="as-btn-add-row" onClick={addChartRow}>+ Add measurement row</button>
                            <button type="button" className="as-btn-outline as-btn-outline--danger" onClick={resetSizeChartToDefault}>Reset to Default</button>
                          </div>
                        </>
                      )
                    ) : (
                      <div className="pd-no-chart">Using store default — enable toggle above to customise.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT ── */}
            <div className="as-col">

              {/* Basic Info */}
              <div className="as-card">
                <div className="as-card-header">
                  <div className="as-card-title"><div className="as-card-title-icon">📦</div>Basic Info</div>
                </div>
                <div className="as-card-body">
                  <div className="as-field">
                    <label className="as-label">Product Name</label>
                    <input className="as-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
                  </div>

                  {/* ── Category ── */}
                  <div className="as-field">
                    <label className="as-label">Category</label>
                    {categoriesLoading ? (
                      <div className="as-cat-empty">Loading categories…</div>
                    ) : categories.length === 0 ? (
                      <div className="as-cat-empty">
                        No categories found.{" "}
                        <a href="/admin/categories" style={{ color: "var(--color-accent-dark)", textDecoration: "underline" }}>
                          Create one first →
                        </a>
                      </div>
                    ) : (
                      <>
                        <select
                          className={`as-cat-select ${!categoryId ? "as-cat-select--placeholder" : ""}`}
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        >
                          <option value="" disabled>Choose a category…</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                        {selectedCategory && (
                          <div className="as-cat-badge">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            {selectedCategory.name}
                            <span style={{ color: "var(--color-ghost)", fontWeight: 400 }}>· {selectedCategory.slug}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="as-field">
                    <label className="as-label">Price (BDT)</label>
                    <div className="as-price-wrap">
                      <input className="as-input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 1299.50" />
                      <span className="as-price-badge">BDT</span>
                    </div>
                  </div>

                  <div className="as-field">
                    <label className="as-toggle-row">
                      <div className="as-toggle">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        <div className="as-toggle-slider" />
                      </div>
                      <div>
                        <div className="as-toggle-label">
                          <span className={`as-status-dot ${isActive ? "as-status-dot--active" : "as-status-dot--inactive"}`} />
                          {isActive ? "Active — Visible to customers" : "Draft — Hidden from store"}
                        </div>
                        <div className="as-toggle-desc">Toggle to publish or save as draft</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="as-card">
                <div className="as-card-header">
                  <div className="as-card-title"><div className="as-card-title-icon">📝</div>Description</div>
                </div>
                <div className="as-card-body">
                  <textarea className="as-input as-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description…" />
                </div>
              </div>

              {/* Bullets */}
              <div className="as-card">
                <div className="as-card-header" style={{ paddingBottom: 16 }}>
                  <div className="as-card-title"><div className="as-card-title-icon">✦</div>Key Features</div>
                  <span style={{ fontSize: 12, color: "var(--color-ghost)" }}>{bullets.length} points</span>
                </div>
                <div className="as-card-body" style={{ paddingTop: 0 }}>
                  <div className="as-list-space">
                    {bullets.map((b, idx) => (
                      <div key={idx} className="as-list-item">
                        <span className="as-drag-handle">⠿</span>
                        <input className="as-input" placeholder={`Feature ${idx + 1}`} value={b} onChange={(e) => updateBullet(idx, e.target.value)} />
                        <button type="button" className="as-btn-remove" onClick={() => removeBullet(idx)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="as-btn-add" onClick={addBullet}>+ Add feature</button>
                </div>
              </div>

              {/* Sizes */}
              <div className="as-card as-card--overflow">
                <div className="as-card-header">
                  <div className="as-card-title"><div className="as-card-title-icon">📐</div>Available Sizes</div>
                  {sizes.length > 0 && <span style={{ fontSize: 12, color: "var(--color-subtle)", fontWeight: 500 }}>{sizes.length} selected</span>}
                </div>
                <div className="as-card-body">
                  <label className="as-label">Select sizes</label>
                  <div className="as-size-selector" ref={sizeDropRef}>
                    <button type="button" ref={sizeTriggerRef} className={`as-size-trigger ${sizeDropOpen ? "as-size-trigger--open" : ""}`} onClick={() => setSizeDropOpen((p) => !p)}>
                      {sizes.length === 0
                        ? <span className="as-size-trigger-placeholder">Choose sizes…</span>
                        : <div className="as-size-chips-trigger">{sizes.map((s) => <span key={s} className="as-size-chip">{s}</span>)}</div>
                      }
                      <span className={`as-size-chevron ${sizeDropOpen ? "as-size-chevron--open" : ""}`}>▼</span>
                    </button>
                    {sizeDropOpen && (
                      <div className="as-size-dropdown">
                        <div className="as-size-drop-section">
                          <div className="as-size-drop-label">Common sizes — click to toggle</div>
                          <div className="as-size-presets">
                            {PRESET_SIZES.map((s) => (
                              <button key={s} type="button" className={`as-size-preset-btn ${sizes.includes(s) ? "as-size-preset-btn--selected" : ""}`} onClick={() => toggleSize(s)}>{s}</button>
                            ))}
                          </div>
                        </div>
                        <div className="as-size-drop-footer">
                          <input className="as-size-custom-input" placeholder="Custom (e.g. 38, OS) — press Enter" value={customSizeInput} onChange={(e) => setCustomSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }} />
                          <button type="button" className="as-size-add-btn" onClick={addCustomSize}>Add</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {sizes.length > 0 && (
                    <div className="as-size-selected-tags">
                      {sizes.map((s) => (
                        <span key={s} className="as-size-tag">{s}<button type="button" className="as-size-tag-remove" onClick={() => removeSize(s)}>✕</button></span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced */}
              <div className="as-card">
                <div className="as-accordion-toggle" onClick={() => setShowAdvanced((p) => !p)}>
                  <span className="as-accordion-label"><span>⚙️</span> Advanced Settings</span>
                  <span className={`as-chevron ${showAdvanced ? "as-chevron--open" : ""}`}>▼</span>
                </div>
                <div className="as-accordion-body" style={{ maxHeight: showAdvanced ? "400px" : "0", opacity: showAdvanced ? 1 : 0 }}>
                  <div className="as-divider" />
                  <div className="as-card-body">
                    <div className="as-field">
                      <label className="as-label">Allowed Addons <span style={{ color: "var(--color-ghost)", textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional JSON)</span></label>
                      <textarea className="as-input as-textarea as-textarea--mono" style={{ minHeight: 80 }} value={allowedAddonsJson} onChange={(e) => setAllowedAddonsJson(e.target.value)} placeholder='e.g. ["66f..."] — leave empty to allow ALL' />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save */}
              <div className="as-submit-bar">
                <button onClick={handlePatch} disabled={saving} className="as-btn-primary">
                  {saving ? <><span className="as-spinner" />Saving…</> : "Save Changes →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}