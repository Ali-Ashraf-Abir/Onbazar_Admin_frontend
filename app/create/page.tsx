"use client";

import React, { useState, useRef, useEffect } from "react";
import { SIZE_CHART_PRESETS, SizeChart, SizeChartRow, buildDefaultChart, syncChartToSizes, chartToJson } from "../../constants/sizeChart";

const API = process.env.NEXT_PUBLIC_API_URL as string;

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "Free Size"];

/* ── types ── */
type ImageEntry = { file: File; url: string };

interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export default function CreateProductPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");
  const [bullets, setBullets] = useState<string[]>(["320 GSM", "Box Fit", "100% Cotton"]);
  const [sizes, setSizes] = useState<string[]>(["M", "L", "XL", "2XL"]);
  const [sizeDropOpen, setSizeDropOpen] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const sizeDropRef = useRef<HTMLDivElement>(null);
  const sizeTriggerRef = useRef<HTMLButtonElement>(null);

  // Category
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useCustomSizeChart, setUseCustomSizeChart] = useState(false);
  const [sizeChart, setSizeChart] = useState<SizeChart>({ unit: "inches", columns: [], rows: [] });
  const [allowedAddonsJson, setAllowedAddonsJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ id: string; name: string; price: number; image: string } | null>(null);

  /* ── fetch active categories on mount ── */
  useEffect(() => {
    async function load() {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`${API}/categories`); // active only
        const json = await res.json();
        if (res.ok) setCategories(json.data as Category[]);
      } catch {
        // silently fail — user will see empty dropdown
      } finally {
        setCategoriesLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    return () => { images.forEach((img) => URL.revokeObjectURL(img.url)); };
  }, [images]);

  useEffect(() => {
    if (!useCustomSizeChart) return;
    setSizeChart((prev) => {
      if (prev.columns.length === 0) return buildDefaultChart(sizes);
      return syncChartToSizes(prev, sizes);
    });
  }, [sizes, useCustomSizeChart]);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (sizeDropRef.current && !sizeDropRef.current.contains(e.target as Node)) setSizeDropOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

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

  function addImages(files: FileList | null) {
    const sel = Array.from(files || []);
    if (!sel.length) return;
    for (const f of sel) { if (!f.type.startsWith("image/")) { alert("Only image files are allowed."); return; } }
    const combined = [...images, ...sel.map((f) => ({ file: f, url: URL.createObjectURL(f) }))];
    if (combined.length > 4) { alert("Maximum 4 images allowed."); return; }
    setImages(combined);
  }

  function removeImage(i: number) {
    setImages((prev) => { URL.revokeObjectURL(prev[i].url); return prev.filter((_, j) => j !== i); });
  }

  function setAsCover(i: number) {
    setImages((prev) => { const next = [...prev]; const [entry] = next.splice(i, 1); return [entry, ...next]; });
  }

  function clearAll() {
    setImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.url)); return []; });
  }

  function resetForm() {
    setName("");
    setPrice("");
    setIsActive(true);
    setDescription("");
    setBullets(["320 GSM", "Box Fit", "100% Cotton"]);
    setSizes(["M", "L", "XL", "2XL"]);
    setCategoryId("");
    setImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.url)); return []; });
    setUseCustomSizeChart(false);
    setSizeChart({ unit: "inches", columns: [], rows: [] });
    setAllowedAddonsJson("");
    setShowAdvanced(false);
  }

  async function handleCreate() {
    if (!name.trim()) return alert("Name is required");
    if (!description.trim()) return alert("Description is required");
    if (!categoryId) return alert("Please select a category");
    const pricePaisa = Math.round(Number(price) * 100);
    if (!Number.isFinite(pricePaisa) || pricePaisa < 0) return alert("Price must be a valid number");
    if (images.length < 1) return alert("Please select at least 1 image");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("category", categoryId);
      fd.append("price", String(pricePaisa));
      fd.append("isActive", String(isActive));
      fd.append("details", JSON.stringify({ description: description.trim(), bullets: bullets.map((b) => b.trim()).filter(Boolean) }));
      fd.append("sizes", JSON.stringify(sizes));
      if (useCustomSizeChart && sizeChart.columns.length > 0) fd.append("sizeChart", chartToJson(sizeChart));
      if (allowedAddonsJson.trim()) {
        try { fd.append("allowedAddons", JSON.stringify(JSON.parse(allowedAddonsJson))); }
        catch { alert("Invalid allowedAddons JSON"); setLoading(false); return; }
      }
      images.forEach((img) => fd.append("images", img.file));

      const res = await fetch(`${API}/products`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to create product"); return; }

      const p = data.data;
      setLastCreated({ id: p._id, name: p.name, price: p.price, image: p.images?.[0] || "" });
      resetForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch {
      alert("Error creating product");
    } finally {
      setLoading(false);
    }
  }

  const selectedCategory = categories.find((c) => c._id === categoryId);

  return (
    <>
      <style>{`
        .cp-img-counter { display: flex; gap: 5px; margin-top: 12px; }
        .cp-img-pip { height: 3px; flex: 1; border-radius: 3px; background: var(--color-border); transition: background 0.3s; }
        .cp-img-pip--filled { background: var(--color-ink); }

        /* Category select */
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
        .as-cat-select-wrap { position: relative; }
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
        .as-cat-empty {
          font-size: 12px;
          color: var(--color-subtle);
          margin-top: 8px;
          font-style: italic;
        }
      `}</style>

      <div style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)", minHeight: "100vh", color: "var(--color-ink)" }}>
        <header className="as-header">
          <span className="as-header-brand">Admin Studio</span>
          <a href="/" className="as-header-back">← Back to Products</a>
        </header>

        <div className="as-body">
          <div className="as-title-row">
            <h1 className="as-title">New Product</h1>
            <span className="as-title-sub">Fill in the details below to list a product</span>
          </div>

          <div className="as-two-col">
            {/* ── LEFT ── */}
            <div className="as-col">

              {/* Images */}
              <div className="as-card">
                <div className="as-card-header">
                  <div className="as-card-title"><div className="as-card-title-icon">🖼</div>Product Images</div>
                  <span style={{ fontSize: 12, color: "var(--color-subtle)", fontWeight: 500 }}>{images.length}/4</span>
                </div>
                <div className="as-card-body">
                  <div className="cp-img-counter">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`cp-img-pip ${i < images.length ? "cp-img-pip--filled" : ""}`} />
                    ))}
                  </div>

                  {images.length < 4 && (
                    <label
                      className={`as-drop-zone ${dragOver ? "as-drop-zone--active" : ""}`}
                      style={{ marginTop: 14 }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); addImages(e.dataTransfer.files); }}
                    >
                      <input type="file" accept="image/*" multiple className="as-hidden" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
                      <div className="as-drop-icon">📷</div>
                      <p className="as-drop-text">Click or drag images here</p>
                      <p className="as-drop-sub">PNG, JPG, WEBP — up to {4 - images.length} more</p>
                    </label>
                  )}

                  {images.length > 0 && (
                    <div className="as-img-grid" style={{ marginTop: 16 }}>
                      {images.map((img, idx) => (
                        <div key={img.url} className={`as-img-card ${idx === 0 ? "as-img-card--cover" : ""}`}>
                          <img src={img.url} alt="" className="as-img-preview" />
                          {idx === 0 && <div className="as-img-cover-badge">COVER</div>}
                          <div className="as-img-name">{img.file.name}</div>
                          <div className="as-img-actions">
                            <button type="button" className="as-img-btn as-img-btn--cover" onClick={() => setAsCover(idx)} disabled={idx === 0} style={idx === 0 ? { opacity: 0.35 } : {}}>Set Cover</button>
                            <button type="button" className="as-img-btn as-img-btn--remove" onClick={() => removeImage(idx)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length > 0 && (
                    <button type="button" onClick={clearAll} style={{ marginTop: 10, background: "none", border: "none", color: "var(--color-subtle)", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced */}
              <div className="as-card">
                <div className="as-accordion-toggle" onClick={() => setShowAdvanced((p) => !p)}>
                  <span className="as-accordion-label"><span>⚙️</span> Advanced Settings</span>
                  <span className={`as-chevron ${showAdvanced ? "as-chevron--open" : ""}`}>▼</span>
                </div>
                <div className="as-accordion-body" style={{ maxHeight: showAdvanced ? "1200px" : "0", opacity: showAdvanced ? 1 : 0 }}>
                  <div className="as-divider" />
                  <div className="as-card-body">
                    <label className="as-toggle-row" style={{ marginBottom: 18 }}>
                      <div className="as-toggle">
                        <input type="checkbox" checked={useCustomSizeChart} onChange={(e) => { setUseCustomSizeChart(e.target.checked); if (e.target.checked && sizeChart.columns.length === 0) setSizeChart(buildDefaultChart(sizes)); }} />
                        <div className="as-toggle-slider" />
                      </div>
                      <div>
                        <div className="as-toggle-label">Custom Size Chart</div>
                        <div className="as-toggle-desc">Build a measurement table for customers</div>
                      </div>
                    </label>

                    {useCustomSizeChart && (
                      <div style={{ marginBottom: 20 }}>
                        {sizes.length === 0 ? (
                          <div className="as-chart-empty">↑ Add sizes above to start building your size chart.</div>
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
                                    {sizeChart.columns.map((col, ci) => <th key={ci}>{col}</th>)}
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sizeChart.rows.map((row, ri) => (
                                    <tr key={ri}>
                                      <td><input className="as-chart-cell as-chart-cell--label" value={row.label} onChange={(e) => updateRowLabel(ri, e.target.value)} placeholder="e.g. Chest" /></td>
                                      {row.values.map((val, ci) => (
                                        <td key={ci}><input className="as-chart-cell" type="number" min="0" step="0.5" value={val} onChange={(e) => updateChartCell(ri, ci, e.target.value)} placeholder="–" /></td>
                                      ))}
                                      <td className="as-chart-del-col"><button type="button" className="as-chart-del-btn" onClick={() => removeChartRow(ri)}>✕</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <button type="button" className="as-btn-add-row" onClick={addChartRow}>+ Add measurement row</button>
                          </>
                        )}
                      </div>
                    )}

                    <div className="as-field">
                      <label className="as-label">Allowed Addons <span style={{ color: "var(--color-ghost)", textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional JSON)</span></label>
                      <textarea className="as-input as-textarea as-textarea--mono" style={{ minHeight: 80 }} placeholder='e.g. ["66f..."] — leave empty to allow ALL' value={allowedAddonsJson} onChange={(e) => setAllowedAddonsJson(e.target.value)} />
                    </div>
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
                    <input className="as-input" placeholder="e.g. Box Fit Heavyweight Tee" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  {/* ── Category ── */}
                  <div className="as-field">
                    <label className="as-label">Category</label>
                    <div className="as-cat-select-wrap">
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
                  </div>

                  <div className="as-field">
                    <label className="as-label">Price (BDT)</label>
                    <div className="as-price-wrap">
                      <input className="as-input" placeholder="e.g. 1299.50" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
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
                  <textarea className="as-input as-textarea" placeholder="Write a compelling product description..." value={description} onChange={(e) => setDescription(e.target.value)} />
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

              {/* Submit */}
              <div className="as-submit-bar">
                <button onClick={handleCreate} disabled={loading} className="as-btn-primary">
                  {loading ? <><span className="as-spinner" />Creating…</> : "Create Product →"}
                </button>
                <p className="as-submit-note">Slug auto-generated from product name</p>
              </div>

              {/* Last Created Card */}
              {lastCreated && (
                <a href={`/products/${lastCreated.id}`} style={{ textDecoration: "none" }}>
                  <div
                    className="as-card"
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer", border: "1.5px solid var(--color-accent)", transition: "box-shadow 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {lastCreated.image && (
                      <img src={lastCreated.image} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: "var(--radius-sm)", flexShrink: 0, background: "var(--color-surface-alt)" }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>Last Created</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastCreated.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-subtle)", marginTop: 1 }}>৳{(lastCreated.price / 100).toFixed(2)}</div>
                    </div>
                    <span style={{ fontSize: 18, color: "var(--color-subtle)", flexShrink: 0 }}>→</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 12,
          background: "#1a1a1a", color: "#fff",
          padding: "14px 20px", borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
          fontSize: 14, fontWeight: 500, whiteSpace: "nowrap",
          zIndex: 9999, fontFamily: "var(--font-body)",
        }}>
          <div style={{ width: 26, height: 26, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✓</div>
          Product created successfully!
        </div>
      )}
    </>
  );
}