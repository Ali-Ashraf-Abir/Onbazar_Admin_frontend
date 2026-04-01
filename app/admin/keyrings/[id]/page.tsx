"use client";
import { use } from "react";
import api from "../../../../lib/api";
import { useEffect, useRef, useState } from "react";

const KEYRING_TYPES = ["initial", "singleWord", "doubleWord"];

// Add helper near top
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


interface Props {
  params: Promise<{ id: string }>;
}
export default function EditKeyringPage({ params }: Props) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [original, setOriginal] = useState<any>(null);

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
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removeImages, setRemoveImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─────────────────────── load ─────────────────────── */

  useEffect(() => {
    api.get<any>("/categories").then((d) => setCategories(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<any>(`/keyrings/${id}`)
      .then((d) => {
        const k = d.data;
        setOriginal(k);
        setName(k.name || "");
        setCategory(k.category?._id || k.category || "");
        setKeyringType(k.keyringType || "");
        setIsActive(k.isActive ?? true);
        setIsBestProduct(k.isBestProduct ?? false);

        // Details
        setDescription(k.details?.description || "");
        setMaterial(k.details?.material || "");
        setDimensions(k.details?.dimensions || "");
        setWeight(k.details?.weight != null ? String(k.details.weight) : "");

        // Pricing
        setSellingPrice(k.pricing?.sellingPrice != null ? String(k.pricing.sellingPrice) : "");
        setCostPrice(k.pricing?.costPrice != null ? String(k.pricing.costPrice) : "");
        setCurrency(k.pricing?.currency || "BDT");
        if (k.pricing?.additionalCosts) {
          setAdditionalCosts(
            Object.entries(k.pricing.additionalCosts as Record<string, number>).map(([key, value]) => ({ key, value: String(value) }))
          );
        }

        // Discount
        if (k.discount) {
          setHasDiscount(true);
          setDiscountType(k.discount.type || "percentage");
          setDiscountValue(k.discount.value != null ? String(k.discount.value) : "");
          setDiscountStart(k.discount.startDate ? k.discount.startDate.slice(0, 16) : "");
          setDiscountEnd(k.discount.endDate ? k.discount.endDate.slice(0, 16) : "");
        }

        // Colors
        setColors(k.colors || []);

        // Stock
        if (k.stock) {
          setStockManaged(k.stock.managed ?? false);
          setStockQuantity(k.stock.quantity != null ? String(k.stock.quantity) : "");
          if (k.stock.byColor) {
            setStockByColor(
              Object.entries(k.stock.byColor as Record<string, number>).map(([color, qty]) => ({ color, qty: String(qty) }))
            );
          }
        }

        // Personalisation
        setPersonalisation(k.personalisation || []);

        // Video
        setVideoUrl(k.video?.url || "");
        setVideoTitle(k.video?.title || "");

        // Images
        setExistingImages(k.images || []);
      })
      .catch(() => setError("Failed to load keyring"))
      .finally(() => setLoading(false));
  }, [id]);

  /* ─────────────────────── image handlers ─────────────────────── */

  function toggleRemoveImage(url: string) {
    setRemoveImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  }

  function handleNewFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 4 - (existingImages.length - removeImages.length);
    const arr = Array.from(files).slice(0, Math.max(0, remaining));
    const updated = [...newImages, ...arr].slice(0, 4);
    setNewImages(updated);
    newPreviews.forEach((p) => URL.revokeObjectURL(p));
    setNewPreviews(updated.map((f) => URL.createObjectURL(f)));
  }

  function removeNewImage(i: number) {
    const updated = newImages.filter((_, idx) => idx !== i);
    setNewImages(updated);
    newPreviews.forEach((p) => URL.revokeObjectURL(p));
    setNewPreviews(updated.map((f) => URL.createObjectURL(f)));
  }

  const totalImages = existingImages.length - removeImages.length + newImages.length;

  /* ─────────────────────── submit ─────────────────────── */

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Name is required");
    if (!sellingPrice) return setError("Selling price is required");
    if (totalImages < 1) return setError("At least 1 image is required");
    if (totalImages > 4) return setError("Maximum 4 images allowed");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("slug", toSlug(name));
      fd.append("category", category || "");
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
      } else if (!hasDiscount) {
        fd.append("discount", "null");
      }

      // Colors
      fd.append("colors", JSON.stringify(colors));

      // Stock
      const stock: any = { managed: stockManaged };
      if (stockManaged && stockQuantity) stock.quantity = parseInt(stockQuantity);
      if (stockManaged && stockByColor.length) {
        stock.byColor = {};
        stockByColor.forEach(({ color, qty }) => { if (color && qty) stock.byColor[color] = parseInt(qty); });
      }
      fd.append("stock", JSON.stringify(stock));

      // Personalisation
      fd.append("personalisation", JSON.stringify(personalisation));

      // Video
      if (videoUrl) {
        fd.append("video", JSON.stringify({ url: videoUrl, title: videoTitle || undefined }));
      } else {
        fd.append("video", "null");
      }

      // Remove images
      if (removeImages.length) fd.append("removeImages", JSON.stringify(removeImages));

      // New images
      newImages.forEach((img) => fd.append("images", img));

      await api.uploadPatch<any>(`/keyrings/${id}`, fd);
      setSuccess("Keyring updated successfully!");
      // Refresh data

    } catch (err: any) {
      setError(err?.message || "Failed to update keyring");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/keyrings/${id}`);
      window.location.href = "/admin/keyrings";
    } catch (err: any) {
      setError(err?.message || "Failed to delete keyring");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  /* ─────────────────────── loading state ─────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bw-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin" style={{ color: "var(--bw-ink)" }} />
          <p className="text-sm" style={{ color: "var(--bw-muted)" }}>Loading keyring…</p>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen" style={{ background: "var(--bw-bg)", color: "var(--bw-ink)", fontFamily: "var(--bw-font-body)" }}>
      <div className="max-w-[860px] mx-auto px-4 sm:px-5 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <a
              href="/admin/keyrings"
              className="text-sm px-3 py-1.5 rounded-[var(--bw-radius-md)] border transition-all cursor-pointer no-underline"
              style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)", background: "var(--bw-surface)" }}
            >
              ← Back
            </a>
            <div>
              <h1 className="text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
                {original?.name || "Edit Keyring"}
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--bw-ghost)", fontFamily: "var(--bw-font-mono)" }}>
                {id}
              </p>
            </div>
          </div>

          {/* Meta badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-[10px] font-bold tracking-wide px-2 py-1 rounded-full"
              style={
                original?.isActive
                  ? { background: "rgba(22,163,74,0.1)", color: "var(--bw-green)", border: "1px solid rgba(22,163,74,0.3)" }
                  : { background: "var(--bw-surface-alt)", color: "var(--bw-ghost)", border: "1px solid var(--bw-border)" }
              }
            >
              {original?.isActive ? "Active" : "Draft"}
            </span>
            {original?.isBestProduct && (
              <span className="text-[10px] font-bold tracking-wide px-2 py-1 rounded-full" style={{ background: "rgba(234,179,8,0.1)", color: "#92400e", border: "1px solid rgba(234,179,8,0.4)" }}>
                ⭐ Best
              </span>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {original && (
          <div
            className="rounded-[var(--bw-radius-lg)] p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3"
            style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
          >
            <StatCard label="Selling Price" value={`৳${original.pricing?.sellingPrice?.toFixed(2) || "—"}`} />
            <StatCard label="Purchase Count" value={original.purchaseCount > 0 ? `${original.purchaseCount} units` : "—"} />
            <StatCard label="Type" value={original.keyringType || "—"} />
            <StatCard label="Images" value={`${original.images?.length || 0} / 4`} />
          </div>
        )}

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
            <SectionTitle icon="🖼️" label="Images" subtitle={`${totalImages}/4 images · Click existing to mark for removal · Upload new below`} />

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div>
                <label className={labelCls}>Current Images</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {existingImages.map((url, i) => {
                    const marked = removeImages.includes(url);
                    return (
                      <div
                        key={url}
                        className="relative rounded-[var(--bw-radius-md)] overflow-hidden aspect-square cursor-pointer transition-all"
                        style={{
                          border: `2px solid ${marked ? "var(--bw-red)" : "var(--bw-border)"}`,
                          opacity: marked ? 0.5 : 1,
                        }}
                        onClick={() => toggleRemoveImage(url)}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        {marked && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(220,38,38,0.3)" }}>
                            <span className="text-white text-2xl font-bold">✕</span>
                          </div>
                        )}
                        {i === 0 && !marked && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(10,10,10,0.7)", color: "#fff" }}>
                            COVER
                          </span>
                        )}
                        <div className="absolute top-1 right-1">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={marked ? { background: "rgba(220,38,38,0.9)", color: "#fff" } : { background: "rgba(10,10,10,0.5)", color: "#fff" }}
                          >
                            {marked ? "Remove" : "Click to remove"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {removeImages.length > 0 && (
                  <p className="text-xs mt-2" style={{ color: "var(--bw-red)" }}>
                    {removeImages.length} image{removeImages.length !== 1 ? "s" : ""} marked for removal. Save to apply.
                  </p>
                )}
              </div>
            )}

            {/* New images */}
            <div>
              <label className={labelCls}>Upload New Images</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {newPreviews.map((src, i) => (
                  <div
                    key={i}
                    className="relative rounded-[var(--bw-radius-md)] overflow-hidden aspect-square"
                    style={{ border: "2px solid var(--bw-green)", background: "var(--bw-surface-alt)" }}
                  >
                    <img src={src} className="w-full h-full object-cover" alt="" />
                    <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.9)", color: "#fff" }}>
                      NEW
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center cursor-pointer border-none"
                      style={{ background: "rgba(10,10,10,0.7)", color: "#fff" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {totalImages < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-[var(--bw-radius-md)] flex flex-col items-center justify-center gap-1 text-sm cursor-pointer border-2 border-dashed transition-all"
                    style={{ borderColor: "var(--bw-border)", color: "var(--bw-ghost)", background: "var(--bw-surface-alt)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--bw-ink)"; e.currentTarget.style.color = "var(--bw-ink)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bw-border)"; e.currentTarget.style.color = "var(--bw-ghost)"; }}
                  >
                    <span className="text-2xl">+</span>
                    <span className="text-[10px] font-semibold">Add</span>
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleNewFiles(e.target.files)}
            />
          </section>

          {/* ── Details ── */}
          <section className={sectionCls} style={sectionStyle}>
            <SectionTitle icon="📋" label="Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea className={`${inputBase} resize-none`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the keyring…" />
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
                    onChange={(e) => { const n = [...additionalCosts]; n[i].key = e.target.value; setAdditionalCosts(n); }}
                  />
                  <input
                    className={`${inputBase} w-28 shrink-0`}
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={ac.value}
                    onChange={(e) => { const n = [...additionalCosts]; n[i].value = e.target.value; setAdditionalCosts(n); }}
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
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
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

          {/* ── Actions ── */}
          <div
            className="rounded-[var(--bw-radius-xl)] p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap"
            style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}
          >
            {/* Delete */}
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                style={{ borderColor: "var(--bw-border)", color: "var(--bw-ghost)", background: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--bw-red)"; e.currentTarget.style.color = "var(--bw-red)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bw-border)"; e.currentTarget.style.color = "var(--bw-ghost)"; }}
              >
                🗑 Delete Keyring
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--bw-red)" }}>Are you sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-2 text-xs font-bold rounded-[var(--bw-radius-md)] cursor-pointer border-none disabled:opacity-60"
                  style={{ background: "var(--bw-red)", color: "#fff" }}
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] cursor-pointer border"
                  style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)", background: "none" }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Save */}
            <div className="flex items-center gap-2 ml-auto">
              <a
                href="/admin/keyrings"
                className="px-5 py-2.5 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer no-underline"
                style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)", background: "none" }}
              >
                Discard
              </a>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
              >
                {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
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
        className="relative rounded-full transition-all duration-200"
        style={{ background: value ? "var(--bw-ink)" : "var(--bw-border)", width: 32, height: 18 }}
        onClick={() => onChange(!value)}
      >
        <div
          className="absolute top-0.5 rounded-full transition-all duration-200"
          style={{ width: 14, height: 14, left: value ? 16 : 2, background: value ? "var(--bw-bg)" : "var(--bw-ghost)" }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color: "var(--bw-muted)" }}>{label}</span>
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--bw-ghost)" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: "var(--bw-ink)" }}>{value}</p>
    </div>
  );
}