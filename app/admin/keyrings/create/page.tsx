"use client";

import { useEffect, useRef, useState } from "react";
import api from "../../../../lib/api";

const KEYRING_TYPES = ["initial", "singleWord", "doubleWord"];

// Add this helper near the top
function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const CURRENCIES = ["BDT", "USD", "EUR", "GBP"];

/* ─────────────────────── shared styles ─────────────────────── */

const inputBase =
  "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
  "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
  "placeholder:text-[var(--bw-placeholder)] w-full " +
  "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

const selectBase = `${inputBase} cursor-pointer appearance-none`;
const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";
const sectionCls = "rounded-[var(--bw-radius-xl)] p-5 sm:p-6 flex flex-col gap-4";
const sectionStyle = {
  background: "var(--bw-surface)",
  border: "1px solid var(--bw-border)",
  boxShadow: "var(--bw-shadow-sm)",
};

/* ─────────────────────── component ─────────────────────── */

export default function CreateKeyringPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Core fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [keyringType, setKeyringType] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isBestProduct, setIsBestProduct] = useState(false);

  // Details
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [weight, setWeight] = useState("");

  // Pricing
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [additionalCosts, setAdditionalCosts] = useState<{ key: string; value: string }[]>([]);

  // Discount
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountStart, setDiscountStart] = useState("");
  const [discountEnd, setDiscountEnd] = useState("");

  // Colors & Stock
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [stockManaged, setStockManaged] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockByColor, setStockByColor] = useState<{ color: string; qty: string }[]>([]);

  // Personalisation
  const [personalisation, setPersonalisation] = useState<{ type: string; label: string; required: boolean }[]>([]);

  // Video
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");

  // Images
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<any>("/categories").then((d) => setCategories(d.data || [])).catch(() => {});
  }, []);

  /* ─────────────────────── image handlers ─────────────────────── */

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4 - images.length);
    const newImgs = [...images, ...arr].slice(0, 4);
    setImages(newImgs);
    const urls = newImgs.map((f) => URL.createObjectURL(f));
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews(urls);
  }

  function removeImage(i: number) {
    const newImgs = images.filter((_, idx) => idx !== i);
    setImages(newImgs);
    const urls = newImgs.map((f) => URL.createObjectURL(f));
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews(urls);
  }

  /* ─────────────────────── submit ─────────────────────── */

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Name is required");
    if (!sellingPrice) return setError("Selling price is required");
    if (images.length < 1) return setError("At least 1 image is required");
    if (images.length > 4) return setError("Maximum 4 images allowed");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("slug", toSlug(name));
      if (category) fd.append("category", category);
      if (keyringType) fd.append("keyringType", keyringType);
      fd.append("isActive", String(isActive));
      fd.append("isBestProduct", String(isBestProduct));

      // Details
      const details: any = {};
      if (description) details.description = description;
      if (material) details.material = material;
      if (dimensions) details.dimensions = dimensions;
      if (weight) details.weight = parseFloat(weight);
      if (Object.keys(details).length) fd.append("details", JSON.stringify(details));

      // Pricing
      const pricing: any = { sellingPrice: parseFloat(sellingPrice), currency };
      if (costPrice) pricing.costPrice = parseFloat(costPrice);
      if (additionalCosts.length) {
        pricing.additionalCosts = {};
        additionalCosts.forEach(({ key, value }) => { if (key && value) pricing.additionalCosts[key] = parseFloat(value); });
      }
      fd.append("pricing", JSON.stringify(pricing));

      // Discount
      if (hasDiscount && discountValue) {
        const disc: any = { type: discountType, value: parseFloat(discountValue) };
        if (discountStart) disc.startDate = discountStart;
        if (discountEnd) disc.endDate = discountEnd;
        fd.append("discount", JSON.stringify(disc));
      }

      // Colors
      if (colors.length) fd.append("colors", JSON.stringify(colors));

      // Stock
      if (stockManaged) {
        const stock: any = { managed: true };
        if (stockQuantity) stock.quantity = parseInt(stockQuantity);
        if (stockByColor.length) {
          stock.byColor = {};
          stockByColor.forEach(({ color, qty }) => { if (color && qty) stock.byColor[color] = parseInt(qty); });
        }
        fd.append("stock", JSON.stringify(stock));
      }

      // Personalisation
      if (personalisation.length) fd.append("personalisation", JSON.stringify(personalisation));

      // Video
      if (videoUrl) {
        fd.append("video", JSON.stringify({ url: videoUrl, title: videoTitle || undefined }));
      }

      // Images
      images.forEach((img) => fd.append("images", img));

     const data = await api.upload<any>("/keyrings", fd);
      setSuccess(`Keyring "${data.data.name}" created successfully!`);
      setTimeout(() => { window.location.href = `/admin/keyrings/${data.data._id}`; }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to create keyring");
    } finally {
      setSaving(false);
    }
  }

  /* ═══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen" style={{ background: "var(--bw-bg)", color: "var(--bw-ink)", fontFamily: "var(--bw-font-body)" }}>
      <div className="max-w-[860px] mx-auto px-4 sm:px-5 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <a
            href="/admin/keyrings"
            className="text-sm px-3 py-1.5 rounded-[var(--bw-radius-md)] border transition-all cursor-pointer no-underline"
            style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)", background: "var(--bw-surface)" }}
          >
            ← Back
          </a>
          <div>
            <h1 className="text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
              Create Keyring
            </h1>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-[var(--bw-radius-md)] text-sm font-medium" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", color: "var(--bw-red)" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 px-4 py-3 rounded-[var(--bw-radius-md)] text-sm font-medium" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.3)", color: "var(--bw-green)" }}>
            {success}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:gap-5">

          {/* ── Core Info ── */}
          <section className={sectionCls} style={sectionStyle}>
            <SectionTitle icon="🔑" label="Core Info" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Name *</label>
                <input className={inputBase} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Leather Key Charm" />
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <div className="relative">
                  <select className={selectBase} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">No category</option>
                    {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Keyring Type</label>
                <div className="relative">
                  <select className={selectBase} value={keyringType} onChange={(e) => setKeyringType(e.target.value)}>
                    <option value="">Select type</option>
                    {KEYRING_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Toggle label="Active" value={isActive} onChange={setIsActive} />
                <Toggle label="⭐ Best Product" value={isBestProduct} onChange={setIsBestProduct} />
              </div>
            </div>
          </section>

          {/* ── Images ── */}
          <section className={sectionCls} style={sectionStyle}>
            <SectionTitle icon="🖼️" label="Images" subtitle="1–4 images · JPEG, PNG, WebP" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative rounded-[var(--bw-radius-md)] overflow-hidden aspect-square"
                  style={{ border: "1px solid var(--bw-border)", background: "var(--bw-surface-alt)" }}
                >
                  <img src={src} className="w-full h-full object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center cursor-pointer border-none"
                    style={{ background: "rgba(10,10,10,0.7)", color: "#fff" }}
                  >
                    ✕
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(10,10,10,0.7)", color: "#fff" }}>
                      COVER
                    </span>
                  )}
                </div>
              ))}

              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-[var(--bw-radius-md)] flex flex-col items-center justify-center gap-1 text-sm cursor-pointer border-2 border-dashed transition-all"
                  style={{ borderColor: "var(--bw-border)", color: "var(--bw-ghost)", background: "var(--bw-surface-alt)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--bw-ink)"; e.currentTarget.style.color = "var(--bw-ink)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bw-border)"; e.currentTarget.style.color = "var(--bw-ghost)"; }}
                >
                  <span className="text-2xl">+</span>
                  <span className="text-[10px] font-semibold">Add Image</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </section>

          {/* ── Details ── */}
          <section className={sectionCls} style={sectionStyle}>
            <SectionTitle icon="📋" label="Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea
                  className={`${inputBase} resize-none`}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the keyring…"
                />
              </div>
              <div>
                <label className={labelCls}>Material</label>
                <input className={inputBase} value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. Genuine leather" />
              </div>
              <div>
                <label className={labelCls}>Dimensions</label>
                <input className={inputBase} value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="e.g. 5cm × 3cm" />
              </div>
              <div>
                <label className={labelCls}>Weight (g)</label>
                <input className={inputBase} type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 25" />
              </div>
            </div>
          </section>

          {/* ── Pricing ── */}
          <section className={sectionCls} style={sectionStyle}>
            <SectionTitle icon="💰" label="Pricing" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Selling Price *</label>
                <input className={inputBase} type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Cost Price</label>
                <input className={inputBase} type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <div className="relative">
                  <select className={selectBase} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
                </div>
              </div>
            </div>

            {/* Additional costs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls}>Additional Costs</label>
                <button
                  type="button"
                  onClick={() => setAdditionalCosts([...additionalCosts, { key: "", value: "" }])}
                  className="text-xs font-semibold px-2.5 py-1 rounded-[var(--bw-radius-md)] cursor-pointer border transition-all"
                  style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)", background: "none" }}
                >
                  + Add Cost
                </button>
              </div>
              {additionalCosts.map((ac, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className={inputBase}
                    placeholder="Label (e.g. Shipping)"
                    value={ac.key}
                    onChange={(e) => {
                      const n = [...additionalCosts]; n[i].key = e.target.value; setAdditionalCosts(n);
                    }}
                  />
                  <input
                    className={`${inputBase} w-28 shrink-0`}
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={ac.value}
                    onChange={(e) => {
                      const n = [...additionalCosts]; n[i].value = e.target.value; setAdditionalCosts(n);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setAdditionalCosts(additionalCosts.filter((_, idx) => idx !== i))}
                    className="shrink-0 text-sm w-9 h-9 rounded-[var(--bw-radius-md)] cursor-pointer border-none"
                    style={{ background: "var(--bw-surface-alt)", color: "var(--bw-ghost)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Discount ── */}
          <section className={sectionCls} style={sectionStyle}>
            <div className="flex items-center justify-between">
              <SectionTitle icon="🏷️" label="Discount" />
              <Toggle label="Enable discount" value={hasDiscount} onChange={setHasDiscount} />
            </div>
            {hasDiscount && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Type</label>
                  <div className="relative">
                    <select className={selectBase} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Value</label>
                  <input className={inputBase} type="number" min="0" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 50"} />
                </div>
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input className={inputBase} type="datetime-local" value={discountStart} onChange={(e) => setDiscountStart(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input className={inputBase} type="datetime-local" value={discountEnd} onChange={(e) => setDiscountEnd(e.target.value)} />
                </div>
              </div>
            )}
          </section>

          {/* ── Colors & Stock ── */}
          <section className={sectionCls} style={sectionStyle}>
            <SectionTitle icon="🎨" label="Colors & Stock" />

            {/* Colors */}
            <div>
              <label className={labelCls}>Colors</label>
              <div className="flex gap-2 mb-2">
                <input
                  className={inputBase}
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && colorInput.trim()) {
                      e.preventDefault();
                      const c = colorInput.trim();
                      if (!colors.includes(c)) setColors([...colors, c]);
                      setColorInput("");
                    }
                  }}
                  placeholder="Type color and press Enter"
                />
                <button
                  type="button"
                  onClick={() => {
                    const c = colorInput.trim();
                    if (c && !colors.includes(c)) { setColors([...colors, c]); setColorInput(""); }
                  }}
                  className="shrink-0 px-3 text-sm font-semibold rounded-[var(--bw-radius-md)] cursor-pointer border transition-all"
                  style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)", background: "none" }}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border cursor-default"
                    style={{ background: "var(--bw-surface-alt)", borderColor: "var(--bw-border)", color: "var(--bw-ink)" }}
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => { setColors(colors.filter((x) => x !== c)); setStockByColor(stockByColor.filter((s) => s.color !== c)); }}
                      className="text-[10px] cursor-pointer border-none bg-transparent"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Stock */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls}>Manage Stock</label>
                <Toggle label="Track inventory" value={stockManaged} onChange={setStockManaged} />
              </div>
              {stockManaged && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={labelCls}>Total Quantity</label>
                    <input className={inputBase} type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="0" />
                  </div>
                  {colors.length > 0 && (
                    <div>
                      <label className={labelCls}>Stock by Color</label>
                      {colors.map((c) => {
                        const entry = stockByColor.find((s) => s.color === c);
                        return (
                          <div key={c} className="flex items-center gap-3 mb-2">
                            <span className="text-sm w-28 shrink-0" style={{ color: "var(--bw-muted)" }}>{c}</span>
                            <input
                              className={inputBase}
                              type="number" min="0"
                              value={entry?.qty || ""}
                              onChange={(e) => {
                                const updated = stockByColor.filter((s) => s.color !== c);
                                if (e.target.value) updated.push({ color: c, qty: e.target.value });
                                setStockByColor(updated);
                              }}
                              placeholder="0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Personalisation ── */}
          <section className={sectionCls} style={sectionStyle}>
            <div className="flex items-center justify-between">
              <SectionTitle icon="✏️" label="Personalisation Options" />
              <button
                type="button"
                onClick={() => setPersonalisation([...personalisation, { type: "text", label: "", required: false }])}
                className="text-xs font-semibold px-3 py-1.5 rounded-[var(--bw-radius-md)] cursor-pointer border transition-all"
                style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)", background: "none" }}
              >
                + Add Field
              </button>
            </div>
            {personalisation.length === 0 && (
              <p className="text-sm" style={{ color: "var(--bw-ghost)" }}>No personalisation fields added.</p>
            )}
            {personalisation.map((p, i) => (
              <div key={i} className="flex gap-2 flex-wrap items-center">
                <div className="relative">
                  <select
                    className={`${selectBase} w-32`}
                    value={p.type}
                    onChange={(e) => { const n = [...personalisation]; n[i].type = e.target.value; setPersonalisation(n); }}
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="select">Select</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
                </div>
                <input
                  className={`${inputBase} flex-1 min-w-[140px]`}
                  placeholder="Label (e.g. Engraving text)"
                  value={p.label}
                  onChange={(e) => { const n = [...personalisation]; n[i].label = e.target.value; setPersonalisation(n); }}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap" style={{ color: "var(--bw-muted)" }}>
                  <input
                    type="checkbox"
                    checked={p.required}
                    onChange={(e) => { const n = [...personalisation]; n[i].required = e.target.checked; setPersonalisation(n); }}
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => setPersonalisation(personalisation.filter((_, idx) => idx !== i))}
                  className="text-sm w-9 h-9 rounded-[var(--bw-radius-md)] cursor-pointer border-none shrink-0"
                  style={{ background: "var(--bw-surface-alt)", color: "var(--bw-ghost)" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </section>

          {/* ── Video ── */}
          <section className={sectionCls} style={sectionStyle}>
            <SectionTitle icon="🎬" label="Video (optional)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Video URL</label>
                <input className={inputBase} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Video Title</label>
                <input className={inputBase} value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="e.g. Keyring crafting process" />
              </div>
            </div>
          </section>

          {/* ── Submit ── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <a
              href="/admin/keyrings"
              className="px-5 py-2.5 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer no-underline"
              style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)", background: "var(--bw-surface)" }}
            >
              Cancel
            </a>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
            >
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              {saving ? "Creating…" : "Create Keyring"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function SectionTitle({ icon, label, subtitle }: { icon: string; label: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-base">{icon}</span>
      <div>
        <h2 className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>{label}</h2>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: "var(--bw-ghost)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className="relative w-8 h-4.5 rounded-full transition-all duration-200"
        style={{ background: value ? "var(--bw-ink)" : "var(--bw-border)", width: 32, height: 18 }}
        onClick={() => onChange(!value)}
      >
        <div
          className="absolute top-0.5 rounded-full transition-all duration-200"
          style={{
            width: 14, height: 14,
            left: value ? 16 : 2,
            background: value ? "var(--bw-bg)" : "var(--bw-ghost)",
          }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color: "var(--bw-muted)" }}>{label}</span>
    </label>
  );
}