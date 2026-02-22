"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  SIZE_CHART_PRESETS,
  SizeChart,
  buildDefaultChart,
  syncChartToSizes,
  chartToJson,
} from "../../../constants/sizeChart";

const API = process.env.NEXT_PUBLIC_API_URL as string;

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "Free Size"];

/* ─────────────────────── types ─────────────────────── */

type ImageEntry = { file: File; url: string };

interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface CostEntry {
  id: string;
  key: string;
  label: string;
  value: string;
}

interface SizeStockEntry {
  size: string;
  qty: string;
}

const COMMON_COST_KEYS: { key: string; label: string; placeholder: string }[] = [
  { key: "packaging",         label: "Packaging",          placeholder: "e.g. 30"  },
  { key: "shipping",          label: "Shipping",           placeholder: "e.g. 60"  },
  { key: "transactionFee",    label: "Transaction Fee",    placeholder: "e.g. 20"  },
  { key: "adsCost",           label: "Ads Cost",           placeholder: "e.g. 50"  },
  { key: "manufacturingCost", label: "Manufacturing Cost", placeholder: "e.g. 200" },
  { key: "customDutyCost",    label: "Custom Duty",        placeholder: "e.g. 40"  },
  { key: "storageCost",       label: "Storage Cost",       placeholder: "e.g. 15"  },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ─────────────────────── profit helper ─────────────────────── */

function computeProfit(sellingPrice: string, costPrice: string, costs: CostEntry[]) {
  const sp     = parseFloat(sellingPrice) || 0;
  const cp     = parseFloat(costPrice) || 0;
  const extras = costs.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0);
  const total  = cp + extras;
  const margin = sp - total;
  const pct    = sp > 0 ? ((margin / sp) * 100).toFixed(1) : "–";
  return { sp, cp, extras, total, margin, pct };
}

/* ─────────────────────── shared class helpers ─────────────────────── */

const inputCls =
  "w-full bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
  "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-150 " +
  "placeholder:text-[var(--bw-placeholder)] " +
  "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--bw-muted)]";

const cardCls =
  "rounded-[var(--bw-radius-xl)] border border-[var(--bw-border)] bg-[var(--bw-surface)] " +
  "shadow-[var(--bw-shadow-sm)] overflow-hidden mb-4";

const cardHeaderCls =
  "flex items-center justify-between px-5 py-4 border-b border-[var(--bw-border)]";

const cardTitleCls =
  "flex items-center gap-2 text-sm font-bold text-[var(--bw-ink)] tracking-tight";

const toggleLabelCls =
  "flex items-center gap-3 cursor-pointer select-none";

const sectionDividerCls =
  "flex items-center gap-3 my-5";

/* ═══════════════════════════════════════════════════════ */

export default function CreateProductPage() {

  /* ── basic ── */
  const [name,        setName]        = useState("");
  const [isActive,    setIsActive]    = useState(true);
  const [description, setDescription] = useState("");
  const [bullets,     setBullets]     = useState<string[]>(["320 GSM", "Box Fit", "100% Cotton"]);

  /* ── category ── */
  const [categories,        setCategories]        = useState<Category[]>([]);
  const [categoryId,        setCategoryId]        = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  /* ── pricing ── */
  const [sellingPrice,    setSellingPrice]    = useState("");
  const [costPrice,       setCostPrice]       = useState("");
  const [currency,        setCurrency]        = useState("BDT");
  const [additionalCosts, setAdditionalCosts] = useState<CostEntry[]>([]);
  const [showCostSection, setShowCostSection] = useState(false);

  /* ── discount ── */
  const [hasDiscount,   setHasDiscount]   = useState(false);
  const [discountType,  setDiscountType]  = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountStart, setDiscountStart] = useState("");
  const [discountEnd,   setDiscountEnd]   = useState("");

  /* ── sizes ── */
  const [hasSize,         setHasSize]         = useState(true);
  const [sizes,           setSizes]           = useState<string[]>(["M", "L", "XL", "2XL"]);
  const [sizeDropOpen,    setSizeDropOpen]    = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const sizeDropRef    = useRef<HTMLDivElement>(null);
  const sizeTriggerRef = useRef<HTMLButtonElement>(null);

  /* ── stock ── */
  const [stockManaged,  setStockManaged]  = useState(false);
  const [stockQty,      setStockQty]      = useState("");
  const [sizeStockRows, setSizeStockRows] = useState<SizeStockEntry[]>([]);

  /* ── images ── */
  const [images,   setImages]   = useState<ImageEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);

  /* ── advanced ── */
  const [showAdvanced,       setShowAdvanced]       = useState(false);
  const [useCustomSizeChart, setUseCustomSizeChart] = useState(false);
  const [sizeChart,          setSizeChart]          = useState<SizeChart>({ unit: "inches", columns: [], rows: [] });
  const [allowedAddonsJson,  setAllowedAddonsJson]  = useState("");

  /* ── ui ── */
  const [loading,     setLoading]     = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ id: string; name: string; sellingPrice: number; image: string } | null>(null);

  /* ─────────────────────── effects ─────────────────────── */

  useEffect(() => {
    async function load() {
      setCategoriesLoading(true);
      try {
        const res  = await fetch(`${API}/categories`);
        const json = await res.json();
        if (res.ok) setCategories(json.data as Category[]);
      } catch { /* silent */ }
      finally { setCategoriesLoading(false); }
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
      if (sizeDropRef.current && !sizeDropRef.current.contains(e.target as Node))
        setSizeDropOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!stockManaged || !hasSize) return;
    setSizeStockRows((prev) => {
      const prevMap = new Map(prev.map((r) => [r.size, r.qty]));
      return sizes.map((s) => ({ size: s, qty: prevMap.get(s) ?? "" }));
    });
  }, [sizes, stockManaged, hasSize]);

  /* ─────────────────────── size helpers ─────────────────────── */

  function toggleSize(s: string)  { setSizes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]); }
  function addCustomSize() {
    const v = customSizeInput.trim().toUpperCase();
    if (v && !sizes.includes(v)) setSizes((p) => [...p, v]);
    setCustomSizeInput("");
  }
  function removeSize(s: string) { setSizes((p) => p.filter((x) => x !== s)); }

  /* ─────────────────────── bullet helpers ─────────────────────── */

  function addBullet()                        { setBullets((p) => [...p, ""]); }
  function updateBullet(i: number, v: string) { setBullets((p) => p.map((b, j) => j === i ? v : b)); }
  function removeBullet(i: number)            { setBullets((p) => p.filter((_, j) => j !== i)); }

  /* ─────────────────────── cost helpers ─────────────────────── */

  function addCostRow(key = "", label = "") {
    setAdditionalCosts((p) => [...p, { id: uid(), key, label: label || key, value: "" }]);
  }
  function updateCostRow(id: string, field: "key" | "label" | "value", val: string) {
    setAdditionalCosts((p) => p.map((c) => c.id === id ? { ...c, [field]: val } : c));
  }
  function removeCostRow(id: string) { setAdditionalCosts((p) => p.filter((c) => c.id !== id)); }
  function addPresetCost(key: string, label: string) {
    if (additionalCosts.some((c) => c.key === key)) return;
    addCostRow(key, label);
  }

  /* ─────────────────────── stock helpers ─────────────────────── */

  function updateSizeStock(size: string, qty: string) {
    setSizeStockRows((p) => p.map((r) => r.size === size ? { ...r, qty } : r));
  }

  const totalSizedStock = sizeStockRows.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0);

  /* ─────────────────────── chart helpers ─────────────────────── */

  function updateChartCell(ri: number, ci: number, v: string) {
    setSizeChart((p) => ({ ...p, rows: p.rows.map((r, i) => i === ri ? { ...r, values: r.values.map((x, j) => j === ci ? v : x) } : r) }));
  }
  function updateRowLabel(ri: number, v: string) {
    setSizeChart((p) => ({ ...p, rows: p.rows.map((r, i) => i === ri ? { ...r, label: v } : r) }));
  }
  function addChartRow() { setSizeChart((p) => ({ ...p, rows: [...p.rows, { label: "New Measurement", values: p.columns.map(() => "") }] })); }
  function removeChartRow(i: number) { setSizeChart((p) => ({ ...p, rows: p.rows.filter((_, j) => j !== i) })); }

  /* ─────────────────────── image helpers ─────────────────────── */

  function addImages(files: FileList | null) {
    const sel = Array.from(files || []);
    if (!sel.length) return;
    for (const f of sel) { if (!f.type.startsWith("image/")) { alert("Only image files are allowed."); return; } }
    const combined = [...images, ...sel.map((f) => ({ file: f, url: URL.createObjectURL(f) }))];
    if (combined.length > 4) { alert("Maximum 4 images allowed."); return; }
    setImages(combined);
  }
  function removeImage(i: number) { setImages((prev) => { URL.revokeObjectURL(prev[i].url); return prev.filter((_, j) => j !== i); }); }
  function setAsCover(i: number)  { setImages((prev) => { const next = [...prev]; const [e] = next.splice(i, 1); return [e, ...next]; }); }
  function clearAll()             { setImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.url)); return []; }); }

  /* ─────────────────────── reset ─────────────────────── */

  function resetForm() {
    setName(""); setIsActive(true); setDescription("");
    setBullets(["320 GSM", "Box Fit", "100% Cotton"]);
    setSizes(["M", "L", "XL", "2XL"]); setHasSize(true);
    setCategoryId("");
    setSellingPrice(""); setCostPrice(""); setCurrency("BDT"); setAdditionalCosts([]);
    setShowCostSection(false);
    setHasDiscount(false); setDiscountType("percentage"); setDiscountValue(""); setDiscountStart(""); setDiscountEnd("");
    setStockManaged(false); setStockQty(""); setSizeStockRows([]);
    setImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.url)); return []; });
    setUseCustomSizeChart(false); setSizeChart({ unit: "inches", columns: [], rows: [] });
    setAllowedAddonsJson(""); setShowAdvanced(false);
  }

  /* ─────────────────────── submit ─────────────────────── */

  async function handleCreate() {
    if (!name.trim())        return alert("Product name is required");
    if (!description.trim()) return alert("Description is required");
    if (!categoryId)         return alert("Please select a category");
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0)
      return alert("Enter a valid selling price");
    if (images.length < 1)  return alert("Please add at least 1 image");

    const pricingObj: Record<string, unknown> = { sellingPrice: Number(sellingPrice), currency };
    if (costPrice && !isNaN(Number(costPrice))) pricingObj.costPrice = Number(costPrice);
    if (additionalCosts.length > 0) {
      const map: Record<string, number> = {};
      for (const c of additionalCosts) {
        const k = c.key.trim(); const v = parseFloat(c.value);
        if (k && !isNaN(v)) map[k] = v;
      }
      if (Object.keys(map).length > 0) pricingObj.additionalCosts = map;
    }

    let discountObj: Record<string, unknown> | null = null;
    if (hasDiscount && discountValue && !isNaN(Number(discountValue))) {
      discountObj = { type: discountType, value: Number(discountValue) };
      if (discountStart) discountObj.startDate = discountStart;
      if (discountEnd)   discountObj.endDate   = discountEnd;
    }

    const stockObj: Record<string, unknown> = { managed: stockManaged };
    if (stockManaged) {
      if (hasSize) {
        const bySize: Record<string, number> = {};
        for (const r of sizeStockRows) {
          const qty = parseInt(r.qty);
          if (!isNaN(qty) && qty >= 0) bySize[r.size] = qty;
        }
        stockObj.bySize = bySize;
      } else {
        stockObj.quantity = parseInt(stockQty) || 0;
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name",     name.trim());
      fd.append("category", categoryId);
      fd.append("pricing",  JSON.stringify(pricingObj));
      if (discountObj) fd.append("discount", JSON.stringify(discountObj));
      fd.append("isActive", String(isActive));
      fd.append("hasSize",  String(hasSize));
      fd.append("details",  JSON.stringify({ description: description.trim(), bullets: bullets.map((b) => b.trim()).filter(Boolean) }));
      fd.append("stock",    JSON.stringify(stockObj));
      if (hasSize) {
        fd.append("sizes", JSON.stringify(sizes));
        if (useCustomSizeChart && sizeChart.columns.length > 0)
          fd.append("sizeChart", chartToJson(sizeChart));
      }
      if (allowedAddonsJson.trim()) {
        try { fd.append("allowedAddons", JSON.stringify(JSON.parse(allowedAddonsJson))); }
        catch { alert("Invalid allowedAddons JSON"); setLoading(false); return; }
      }
      images.forEach((img) => fd.append("images", img.file));

      const res  = await fetch(`${API}/admin/products`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to create product"); return; }

      const p = data.data;
      setLastCreated({ id: p._id, name: p.name, sellingPrice: p.pricing.sellingPrice, image: p.images?.[0] || "" });
      resetForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch {
      alert("Error creating product");
    } finally {
      setLoading(false);
    }
  }

  /* ─────────────────────── derived ─────────────────────── */

  const profit            = computeProfit(sellingPrice, costPrice, additionalCosts);
  const hasCostData       = costPrice || additionalCosts.length > 0;
  const selectedCategory  = categories.find((c) => c._id === categoryId);

  /* ═══════════════════════════════════════════════════════ */

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "var(--bw-font-body)", background: "var(--bw-bg)", color: "var(--bw-ink)" }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-30 backdrop-blur-sm"
        style={{ background: "rgba(255,255,255,0.92)", borderColor: "var(--bw-border)" }}
      >
        <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
          Admin Studio
        </span>
        <a
          href="/admin/products"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--bw-muted)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bw-ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bw-muted)")}
        >
          ← Back to Products
        </a>
      </header>

      <div className="max-w-[1200px] mx-auto px-5 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
            New Product
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--bw-muted)" }}>
            Fill in the details below to list a product
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ══════════════════ LEFT ══════════════════ */}
          <div>

            {/* ── Images ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}>
                  <span>🖼</span> Product Images
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--bw-ghost)" }}>
                  {images.length}/4
                </span>
              </div>
              <div className="p-5">
                {/* Progress pips */}
                <div className="flex gap-1.5 mb-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-0.5 flex-1 rounded-full transition-all duration-300"
                      style={{ background: i < images.length ? "var(--bw-ink)" : "var(--bw-border)" }}
                    />
                  ))}
                </div>

                {/* Drop zone */}
                {images.length < 4 && (
                  <label
                    className="flex flex-col items-center justify-center gap-2 rounded-[var(--bw-radius-lg)] border-2 border-dashed p-8 cursor-pointer transition-all duration-150"
                    style={{
                      borderColor: dragOver ? "var(--bw-ink)" : "var(--bw-border)",
                      background:  dragOver ? "var(--bw-bg-alt)" : "var(--bw-surface-alt)",
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); addImages(e.dataTransfer.files); }}
                  >
                    <input
                      type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => { addImages(e.target.files); e.target.value = ""; }}
                    />
                    <div className="text-3xl opacity-30">📷</div>
                    <p className="text-sm font-medium" style={{ color: "var(--bw-ink-secondary)" }}>
                      Click or drag images here
                    </p>
                    <p className="text-xs" style={{ color: "var(--bw-ghost)" }}>
                      PNG, JPG, WEBP — up to {4 - images.length} more
                    </p>
                  </label>
                )}

                {/* Image grid */}
                {images.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {images.map((img, idx) => (
                        <div
                          key={img.url}
                          className="relative rounded-[var(--bw-radius-md)] overflow-hidden border"
                          style={{
                            borderColor: idx === 0 ? "var(--bw-ink)" : "var(--bw-border)",
                            borderWidth: idx === 0 ? 2 : 1,
                          }}
                        >
                          <img src={img.url} alt="" className="w-full h-32 object-cover block" />
                          {idx === 0 && (
                            <div
                              className="absolute top-1.5 left-1.5 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                              style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
                            >
                              COVER
                            </div>
                          )}
                          <div
                            className="px-2 py-1.5 flex gap-1.5 border-t"
                            style={{ background: "var(--bw-surface-alt)", borderColor: "var(--bw-border)" }}
                          >
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => setAsCover(idx)}
                              className="flex-1 text-[11px] font-semibold py-1 rounded transition-all"
                              style={{
                                background: "var(--bw-surface)",
                                border: "1px solid var(--bw-border)",
                                color: idx === 0 ? "var(--bw-ghost)" : "var(--bw-ink)",
                                cursor: idx === 0 ? "not-allowed" : "pointer",
                                opacity: idx === 0 ? 0.4 : 1,
                              }}
                            >
                              Set Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="flex-1 text-[11px] font-semibold py-1 rounded transition-all"
                              style={{
                                background: "var(--bw-surface)",
                                border: "1px solid var(--bw-border)",
                                color: "var(--bw-red)",
                                cursor: "pointer",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="mt-3 text-xs underline bg-transparent border-none cursor-pointer"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Pricing ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>💰</span> Pricing</div>
              </div>
              <div className="p-5 flex flex-col gap-4">

                {/* Selling price + currency */}
                <div>
                  <label className={labelCls}>
                    Selling Price <span style={{ color: "var(--bw-red)" }}>*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className={inputCls}
                        placeholder="e.g. 1299"
                        type="number" min="0" step="0.01"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                      />
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                        style={{ color: "var(--bw-ghost)" }}
                      >
                        {currency}
                      </span>
                    </div>
                    <CurrencySelect value={currency} onChange={setCurrency} />
                  </div>
                </div>

                {/* Discount toggle */}
                <BwToggle
                  checked={hasDiscount}
                  onChange={setHasDiscount}
                  label="Add Discount"
                  desc="Apply a percentage or fixed price reduction"
                />

                {hasDiscount && (
                  <div
                    className="p-4 rounded-[var(--bw-radius-md)] flex flex-col gap-3"
                    style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}
                  >
                    {/* Type tabs */}
                    <div
                      className="flex rounded-[var(--bw-radius-md)] overflow-hidden border"
                      style={{ borderColor: "var(--bw-border)" }}
                    >
                      {(["percentage", "fixed"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDiscountType(t)}
                          className="flex-1 py-2.5 text-xs font-bold transition-all cursor-pointer border-none"
                          style={
                            discountType === t
                              ? { background: "var(--bw-ink)", color: "var(--bw-bg)" }
                              : { background: "var(--bw-input-bg)", color: "var(--bw-ghost)" }
                          }
                        >
                          {t === "percentage" ? "% Percentage" : "৳ Fixed Amount"}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className={labelCls}>
                        Discount {discountType === "percentage" ? "Percentage" : `Amount (${currency})`}
                      </label>
                      <div className="relative">
                        <input
                          className={inputCls}
                          type="number" min="0"
                          step={discountType === "percentage" ? "1" : "0.01"}
                          placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 100"}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "var(--bw-ghost)" }}>
                          {discountType === "percentage" ? "%" : currency}
                        </span>
                      </div>
                      {discountValue && sellingPrice && (
                        <p className="mt-1.5 text-xs" style={{ color: "var(--bw-muted)" }}>
                          Effective price:{" "}
                          <strong style={{ color: "var(--bw-ink)" }}>
                            {currency}{" "}
                            {discountType === "percentage"
                              ? (Number(sellingPrice) * (1 - Number(discountValue) / 100)).toFixed(2)
                              : Math.max(0, Number(sellingPrice) - Number(discountValue)).toFixed(2)}
                          </strong>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Start Date", val: discountStart, set: setDiscountStart },
                        { label: "End Date",   val: discountEnd,   set: setDiscountEnd   },
                      ].map(({ label, val, set }) => (
                        <div key={label}>
                          <label className={labelCls}>
                            {label}{" "}
                            <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>
                              (optional)
                            </span>
                          </label>
                          <input className={inputCls} type="date" value={val} onChange={(e) => set(e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost section divider */}
                <div className={sectionDividerCls}>
                  <div className="flex-1 h-px" style={{ background: "var(--bw-border)" }} />
                  <span className="text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap" style={{ color: "var(--bw-ghost)" }}>
                    Cost & Analytics
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--bw-border)" }} />
                </div>

                <BwToggle
                  checked={showCostSection}
                  onChange={setShowCostSection}
                  label="Track Cost & Profit"
                  desc="Costs are private — never shown to customers"
                />

                {showCostSection && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className={labelCls}>
                        Cost Price{" "}
                        <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>
                          (product cost)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          className={inputCls}
                          type="number" min="0" step="0.01"
                          placeholder="e.g. 600"
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "var(--bw-ghost)" }}>
                          {currency}
                        </span>
                      </div>
                    </div>

                    {/* Additional costs */}
                    <div>
                      <label className={labelCls}>Additional Costs</label>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {COMMON_COST_KEYS.map(({ key, label }) => {
                          const used = additionalCosts.some((c) => c.key === key);
                          return (
                            <button
                              key={key}
                              type="button"
                              disabled={used}
                              onClick={() => addPresetCost(key, label)}
                              className="px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer"
                              style={{
                                borderColor: "var(--bw-border)",
                                background:  "var(--bw-input-bg)",
                                color:        used ? "var(--bw-ghost)" : "var(--bw-muted)",
                                opacity:      used ? 0.4 : 1,
                                cursor:       used ? "not-allowed" : "pointer",
                              }}
                            >
                              + {label}
                            </button>
                          );
                        })}
                      </div>

                      {additionalCosts.length > 0 && (
                        <table className="w-full border-collapse mb-2">
                          <thead>
                            <tr>
                              {["Cost Name", `Amount (${currency})`, ""].map((h, i) => (
                                <th
                                  key={i}
                                  className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1.5"
                                  style={{ color: "var(--bw-ghost)", width: i === 2 ? 32 : undefined }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {additionalCosts.map((c) => (
                              <tr key={c.id}>
                                <td className="px-1.5 py-1">
                                  <input
                                    className={inputCls}
                                    placeholder="e.g. packaging"
                                    value={c.label}
                                    onChange={(e) => {
                                      updateCostRow(c.id, "label", e.target.value);
                                      const k = e.target.value.trim().replace(/\s+(.)/g, (_, ch) => ch.toUpperCase()).replace(/\s/g, "");
                                      updateCostRow(c.id, "key", k || c.key);
                                    }}
                                  />
                                </td>
                                <td className="px-1.5 py-1">
                                  <input
                                    className={inputCls}
                                    type="number" min="0" step="0.01" placeholder="0"
                                    value={c.value}
                                    onChange={(e) => updateCostRow(c.id, "value", e.target.value)}
                                  />
                                </td>
                                <td className="px-1.5 py-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeCostRow(c.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-xs transition-all cursor-pointer border-none"
                                    style={{ background: "var(--bw-surface-alt)", color: "var(--bw-muted)" }}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      <AddRowBtn onClick={() => addCostRow()}>+ Add custom cost</AddRowBtn>
                    </div>

                    {/* Profit preview */}
                    {hasCostData && sellingPrice && (
                      <div
                        className="rounded-[var(--bw-radius-md)] overflow-hidden"
                        style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}
                      >
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--bw-muted)" }}>
                            Profit Preview
                          </span>
                          <span
                            className="text-lg font-bold"
                            style={{
                              color: profit.margin > 0 ? "var(--bw-green)" : profit.margin < 0 ? "var(--bw-red)" : "var(--bw-ghost)",
                            }}
                          >
                            {profit.margin > 0 ? "+" : ""}{currency} {profit.margin.toFixed(2)}
                            {profit.sp > 0 && (
                              <span className="text-xs font-medium opacity-60 ml-1.5">({profit.pct}%)</span>
                            )}
                          </span>
                        </div>
                        <div className="border-t" style={{ borderColor: "var(--bw-border)" }}>
                          {[
                            { label: "Selling Price", val: `${currency} ${profit.sp.toFixed(2)}`, strong: false },
                            ...(profit.cp > 0 ? [{ label: "Cost Price", val: `− ${currency} ${profit.cp.toFixed(2)}`, strong: false }] : []),
                            ...additionalCosts.filter((c) => parseFloat(c.value) > 0).map((c) => ({
                              label: c.label || c.key,
                              val: `− ${currency} ${parseFloat(c.value).toFixed(2)}`,
                              strong: false,
                            })),
                            { label: "Total Cost", val: `− ${currency} ${profit.total.toFixed(2)}`, strong: true },
                          ].map((row, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center px-4 py-2 border-b last:border-0"
                              style={{
                                borderColor: "var(--bw-divider)",
                                background: row.strong ? "var(--bw-bg-alt)" : undefined,
                              }}
                            >
                              <span
                                className="text-sm"
                                style={{ color: row.strong ? "var(--bw-ink)" : "var(--bw-muted)", fontWeight: row.strong ? 600 : 400 }}
                              >
                                {row.label}
                              </span>
                              <span className="text-sm font-semibold" style={{ color: "var(--bw-ink)" }}>
                                {row.val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Advanced ── */}
            <div className={cardCls}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 cursor-pointer border-none text-left"
                style={{ background: "transparent", fontFamily: "var(--bw-font-body)" }}
                onClick={() => setShowAdvanced((p) => !p)}
              >
                <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--bw-ink)" }}>
                  <span>⚙️</span> Advanced Settings
                </span>
                <span
                  className="text-xs transition-transform duration-200"
                  style={{
                    color: "var(--bw-ghost)",
                    display: "inline-block",
                    transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </button>

              {showAdvanced && (
                <div className="border-t p-5 flex flex-col gap-4" style={{ borderColor: "var(--bw-border)" }}>
                  {hasSize && (
                    <BwToggle
                      checked={useCustomSizeChart}
                      onChange={(v) => {
                        setUseCustomSizeChart(v);
                        if (v && sizeChart.columns.length === 0) setSizeChart(buildDefaultChart(sizes));
                      }}
                      label="Custom Size Chart"
                      desc="Build a measurement table for customers"
                    />
                  )}

                  {hasSize && useCustomSizeChart && (
                    <div>
                      {sizes.length === 0 ? (
                        <p className="text-sm italic" style={{ color: "var(--bw-ghost)" }}>
                          ↑ Add sizes above to start building your size chart.
                        </p>
                      ) : (
                        <>
                          <div className="mb-3">
                            <label className={labelCls}>Load Preset</label>
                            <div className="flex gap-2 flex-wrap">
                              {Object.keys(SIZE_CHART_PRESETS).map((key) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => { if (confirm(`Load "${key}" preset?`)) setSizeChart(buildDefaultChart(sizes, key)); }}
                                  className="px-3 py-1 rounded-md text-xs font-semibold capitalize border cursor-pointer transition-all"
                                  style={{
                                    background: "var(--bw-surface-alt)",
                                    borderColor: "var(--bw-border)",
                                    color: "var(--bw-muted)",
                                  }}
                                >
                                  {key}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Unit toggle */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold" style={{ color: "var(--bw-muted)" }}>
                              Measurements ({sizeChart.unit})
                            </span>
                            <div className="flex rounded-md overflow-hidden border" style={{ borderColor: "var(--bw-border)" }}>
                              {(["inches", "cm"] as const).map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => setSizeChart((p) => ({ ...p, unit: u }))}
                                  className="px-3 py-1 text-xs font-semibold border-none cursor-pointer transition-all"
                                  style={
                                    sizeChart.unit === u
                                      ? { background: "var(--bw-ink)", color: "var(--bw-bg)" }
                                      : { background: "var(--bw-input-bg)", color: "var(--bw-ghost)" }
                                  }
                                >
                                  {u}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Chart table */}
                          <div className="overflow-x-auto mb-2">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1" style={{ color: "var(--bw-ghost)" }}>Measurement</th>
                                  {sizeChart.columns.map((col, ci) => (
                                    <th key={ci} className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1" style={{ color: "var(--bw-ghost)" }}>{col}</th>
                                  ))}
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {sizeChart.rows.map((row, ri) => (
                                  <tr key={ri}>
                                    <td className="px-1 py-1">
                                      <input className={inputCls} value={row.label} onChange={(e) => updateRowLabel(ri, e.target.value)} placeholder="e.g. Chest" />
                                    </td>
                                    {row.values.map((val, ci) => (
                                      <td key={ci} className="px-1 py-1">
                                        <input className={inputCls} type="number" min="0" step="0.5" value={val} onChange={(e) => updateChartCell(ri, ci, e.target.value)} placeholder="–" />
                                      </td>
                                    ))}
                                    <td className="px-1 py-1">
                                      <button
                                        type="button"
                                        onClick={() => removeChartRow(ri)}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-xs border-none cursor-pointer"
                                        style={{ background: "var(--bw-surface-alt)", color: "var(--bw-muted)" }}
                                      >
                                        ✕
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <AddRowBtn onClick={addChartRow}>+ Add measurement row</AddRowBtn>
                        </>
                      )}
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>
                      Allowed Addons{" "}
                      <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>(optional JSON)</span>
                    </label>
                    <textarea
                      className={`${inputCls} resize-y min-h-[80px]`}
                      style={{ fontFamily: "var(--bw-font-mono)", fontSize: 12 }}
                      placeholder='e.g. ["66f..."] — leave empty to allow ALL'
                      value={allowedAddonsJson}
                      onChange={(e) => setAllowedAddonsJson(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════ RIGHT ══════════════════ */}
          <div>

            {/* ── Basic Info ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>📦</span> Basic Info</div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Product Name</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Box Fit Heavyweight Tee"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelCls}>Category</label>
                  {categoriesLoading ? (
                    <p className="text-sm italic" style={{ color: "var(--bw-ghost)" }}>Loading categories…</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--bw-ghost)" }}>
                      No categories found.{" "}
                      <a href="/admin/categories" className="underline" style={{ color: "var(--bw-ink)" }}>
                        Create one first →
                      </a>
                    </p>
                  ) : (
                    <>
                      <div className="relative">
                        <select
                          className={`${inputCls} appearance-none cursor-pointer pr-9`}
                          style={{ color: !categoryId ? "var(--bw-placeholder)" : "var(--bw-ink)" }}
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        >
                          <option value="" disabled>Choose a category…</option>
                          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
                      </div>
                      {selectedCategory && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: "var(--bw-bg-alt)",
                              border: "1px solid var(--bw-border)",
                              color: "var(--bw-ink-secondary)",
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                            {selectedCategory.name}
                            <span style={{ color: "var(--bw-ghost)", fontWeight: 400 }}>· {selectedCategory.slug}</span>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Active toggle */}
                <BwToggle
                  checked={isActive}
                  onChange={setIsActive}
                  label={
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                        style={{ background: isActive ? "var(--bw-green)" : "var(--bw-ghost)" }}
                      />
                      {isActive ? "Active — Visible to customers" : "Draft — Hidden from store"}
                    </span>
                  }
                  desc="Toggle to publish or save as draft"
                />
              </div>
            </div>

            {/* ── Description ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>📝</span> Description</div>
              </div>
              <div className="p-5">
                <textarea
                  className={`${inputCls} resize-y min-h-[120px]`}
                  placeholder="Write a compelling product description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* ── Key Features ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>✦</span> Key Features</div>
                <span className="text-xs" style={{ color: "var(--bw-ghost)" }}>{bullets.length} points</span>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-2 mb-3">
                  {bullets.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-base cursor-grab" style={{ color: "var(--bw-ghost)", letterSpacing: -2 }}>⠿</span>
                      <input
                        className={`${inputCls} flex-1`}
                        placeholder={`Feature ${idx + 1}`}
                        value={b}
                        onChange={(e) => updateBullet(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeBullet(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-xs border-none cursor-pointer flex-shrink-0"
                        style={{ background: "var(--bw-surface-alt)", color: "var(--bw-muted)" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <AddRowBtn onClick={addBullet}>+ Add feature</AddRowBtn>
              </div>
            </div>

            {/* ── Sizing ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>📐</span> Sizing</div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Does this product come in sizes?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: true,  icon: "👕", label: "Yes — has sizes"           },
                      { val: false, icon: "🧣", label: "No — one size / free size" },
                    ].map(({ val, icon, label }) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setHasSize(val)}
                        className="py-3 px-4 rounded-[var(--bw-radius-md)] text-sm font-semibold border cursor-pointer transition-all text-center"
                        style={
                          hasSize === val
                            ? { border: "1.5px solid var(--bw-ink)", background: "var(--bw-bg-alt)", color: "var(--bw-ink)" }
                            : { border: "1.5px solid var(--bw-border)", background: "var(--bw-input-bg)", color: "var(--bw-ghost)" }
                        }
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {!hasSize && (
                  <div
                    className="p-3 rounded-[var(--bw-radius-md)] text-sm"
                    style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)", color: "var(--bw-muted)" }}
                  >
                    Size picker will be hidden for this product (e.g. caps, mufflers, accessories).
                  </div>
                )}

                {hasSize && (
                  <div>
                    <label className={labelCls}>Available Sizes</label>
                    {/* Dropdown trigger */}
                    <div className="relative" ref={sizeDropRef}>
                      <button
                        type="button"
                        ref={sizeTriggerRef}
                        onClick={() => setSizeDropOpen((p) => !p)}
                        className="w-full flex items-center justify-between rounded-[var(--bw-radius-md)] px-3 py-2.5 text-sm border cursor-pointer transition-all text-left"
                        style={{
                          background: "var(--bw-input-bg)",
                          borderColor: sizeDropOpen ? "var(--bw-ink)" : "var(--bw-border)",
                          color: sizes.length === 0 ? "var(--bw-placeholder)" : "var(--bw-ink)",
                        }}
                      >
                        {sizes.length === 0 ? (
                          <span>Choose sizes…</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {sizes.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md text-xs font-semibold"
                                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        <span
                          className="text-[10px] ml-2 flex-shrink-0 transition-transform duration-200"
                          style={{ color: "var(--bw-ghost)", transform: sizeDropOpen ? "rotate(180deg)" : "none" }}
                        >
                          ▼
                        </span>
                      </button>

                      {sizeDropOpen && (
                        <div
                          className="absolute top-full left-0 right-0 mt-1 rounded-[var(--bw-radius-lg)] border z-20 overflow-hidden"
                          style={{
                            background: "var(--bw-surface)",
                            borderColor: "var(--bw-border)",
                            boxShadow: "var(--bw-shadow-lg)",
                          }}
                        >
                          <div className="p-3 border-b" style={{ borderColor: "var(--bw-border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--bw-ghost)" }}>
                              Common sizes — click to toggle
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {PRESET_SIZES.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => toggleSize(s)}
                                  className="px-3 py-1 rounded-md text-xs font-semibold border cursor-pointer transition-all"
                                  style={
                                    sizes.includes(s)
                                      ? { background: "var(--bw-ink)", color: "var(--bw-bg)", borderColor: "var(--bw-ink)" }
                                      : { background: "var(--bw-surface-alt)", color: "var(--bw-muted)", borderColor: "var(--bw-border)" }
                                  }
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 flex gap-2">
                            <input
                              className={`${inputCls} flex-1`}
                              placeholder="Custom (e.g. 38, OS) — press Enter"
                              value={customSizeInput}
                              onChange={(e) => setCustomSizeInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
                            />
                            <button
                              type="button"
                              onClick={addCustomSize}
                              className="px-4 py-2 rounded-[var(--bw-radius-md)] text-xs font-bold border-none cursor-pointer"
                              style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {sizes.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: "var(--bw-bg-alt)",
                              border: "1px solid var(--bw-border)",
                              color: "var(--bw-ink)",
                            }}
                          >
                            {s}
                            <button
                              type="button"
                              onClick={() => removeSize(s)}
                              className="text-[10px] cursor-pointer border-none bg-transparent leading-none"
                              style={{ color: "var(--bw-ghost)" }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Stock ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>📦</span> Stock</div>
                {stockManaged && (
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      background: "var(--bw-bg-alt)",
                      border: "1.5px solid var(--bw-border)",
                      color: "var(--bw-ink)",
                    }}
                  >
                    {hasSize ? totalSizedStock : (parseInt(stockQty) || 0)} units
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col gap-4">

                <BwToggle
                  checked={stockManaged}
                  onChange={(v) => {
                    setStockManaged(v);
                    if (v && hasSize && sizeStockRows.length === 0)
                      setSizeStockRows(sizes.map((s) => ({ size: s, qty: "" })));
                  }}
                  label="Track Inventory"
                  desc={
                    stockManaged
                      ? "Orders will be blocked when stock runs out"
                      : "Stock is unlimited — orders always go through"
                  }
                />

                {!stockManaged && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-[var(--bw-radius-md)] text-sm"
                    style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)", color: "var(--bw-muted)" }}
                  >
                    <span className="text-base">∞</span>
                    <span>Inventory tracking is off. Enable it above to set quantities and block overselling.</span>
                  </div>
                )}

                {stockManaged && (
                  <div
                    className="p-4 rounded-[var(--bw-radius-md)]"
                    style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}
                  >
                    {/* Unsized */}
                    {!hasSize && (
                      <div>
                        <label className={labelCls}>Units in Stock</label>
                        <div className="flex items-center gap-3">
                          <input
                            className={`${inputCls} flex-1`}
                            type="number" min="0" step="1"
                            placeholder="e.g. 50"
                            value={stockQty}
                            onChange={(e) => setStockQty(e.target.value)}
                          />
                          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--bw-ghost)" }}>
                            units
                          </span>
                          {stockQty !== "" && (
                            <StockPill inStock={parseInt(stockQty) > 0} />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sized */}
                    {hasSize && (
                      sizes.length === 0 ? (
                        <p className="text-sm italic" style={{ color: "var(--bw-ghost)" }}>
                          ↑ Add sizes in the Sizing card to set per-size quantities.
                        </p>
                      ) : (
                        <>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                {["Size", "Qty in Stock", "Status"].map((h) => (
                                  <th
                                    key={h}
                                    className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-2"
                                    style={{ color: "var(--bw-ghost)" }}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sizeStockRows.map((row) => {
                                const qty     = parseInt(row.qty);
                                const filled  = row.qty !== "";
                                const inStock = filled && qty > 0;
                                return (
                                  <tr key={row.size}>
                                    <td className="px-2 py-1.5">
                                      <span
                                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold border min-w-[38px]"
                                        style={{
                                          borderColor: "var(--bw-border)",
                                          background: "var(--bw-input-bg)",
                                          color: "var(--bw-ink)",
                                        }}
                                      >
                                        {row.size}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1.5 w-[45%]">
                                      <input
                                        className={inputCls}
                                        type="number" min="0" step="1"
                                        placeholder="0"
                                        value={row.qty}
                                        onChange={(e) => updateSizeStock(row.size, e.target.value)}
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      {filled ? (
                                        <StockPill inStock={inStock} compact />
                                      ) : (
                                        <span className="text-xs" style={{ color: "var(--bw-ghost)" }}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Summary footer */}
                          <div
                            className="flex items-center justify-between mt-3 pt-3 border-t"
                            style={{ borderColor: "var(--bw-border)" }}
                          >
                            <span className="text-xs" style={{ color: "var(--bw-muted)" }}>Total across all sizes</span>
                            <span className="text-sm font-bold" style={{ color: "var(--bw-ink)" }}>{totalSizedStock} units</span>
                          </div>
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Submit ── */}
            <div
              className="flex flex-col gap-3 p-5 rounded-[var(--bw-radius-xl)] border"
              style={{
                background: "var(--bw-surface)",
                borderColor: "var(--bw-border)",
                boxShadow: "var(--bw-shadow-sm)",
              }}
            >
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3.5 rounded-[var(--bw-radius-md)] text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
              >
                {loading ? (
                  <>
                    <span
                      className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderTopColor: "var(--bw-bg)" }}
                    />
                    Creating…
                  </>
                ) : (
                  "Create Product →"
                )}
              </button>
              <p className="text-center text-xs" style={{ color: "var(--bw-ghost)" }}>
                Slug auto-generated · Costs are private
              </p>
            </div>

            {/* ── Last Created ── */}
            {lastCreated && (
              <a href={`/admin/products/${lastCreated.id}`} style={{ textDecoration: "none" }}>
                <div
                  className="flex items-center gap-4 p-4 rounded-[var(--bw-radius-xl)] border cursor-pointer mt-3 transition-all"
                  style={{
                    background: "var(--bw-surface)",
                    borderColor: "var(--bw-border-strong)",
                    boxShadow: "var(--bw-shadow-sm)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--bw-shadow-hover)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--bw-shadow-sm)";
                    (e.currentTarget as HTMLDivElement).style.transform = "";
                  }}
                >
                  {lastCreated.image && (
                    <img
                      src={lastCreated.image}
                      alt=""
                      className="w-14 h-14 object-cover rounded-[var(--bw-radius-md)] flex-shrink-0"
                      style={{ background: "var(--bw-surface-alt)" }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--bw-muted)" }}>
                      Last Created
                    </p>
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--bw-ink)" }}>
                      {lastCreated.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--bw-ghost)" }}>
                      ৳ {lastCreated.sellingPrice.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-lg flex-shrink-0" style={{ color: "var(--bw-ghost)" }}>→</span>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Success Toast ── */}
      {showSuccess && (
        <div
          className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium whitespace-nowrap z-[9999]"
          style={{
            background: "var(--bw-ink)",
            color: "var(--bw-bg)",
            boxShadow: "var(--bw-shadow-lg)",
            fontFamily: "var(--bw-font-body)",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
            style={{ background: "var(--bw-green)", color: "#fff" }}
          >
            ✓
          </div>
          Product created successfully!
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function BwToggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  desc?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      {/* Toggle track */}
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

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        className="appearance-none border rounded-[var(--bw-radius-md)] px-3 py-2.5 pr-8 text-sm font-semibold outline-none cursor-pointer transition-all"
        style={{
          background: "var(--bw-input-bg)",
          borderColor: "var(--bw-border)",
          color: "var(--bw-ink)",
          fontFamily: "var(--bw-font-body)",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option>BDT</option>
        <option>USD</option>
        <option>EUR</option>
        <option>GBP</option>
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
    </div>
  );
}

function StockPill({ inStock, compact = false }: { inStock: boolean; compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
      style={
        inStock
          ? { background: "rgba(22,163,74,0.08)", color: "var(--bw-green)", borderColor: "rgba(22,163,74,0.2)" }
          : { background: "rgba(220,38,38,0.08)", color: "var(--bw-red)",   borderColor: "rgba(220,38,38,0.2)" }
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: inStock ? "var(--bw-green)" : "var(--bw-red)" }}
      />
      {compact ? (inStock ? "In Stock" : "Out") : (inStock ? "In Stock" : "Out of Stock")}
    </span>
  );
}

function AddRowBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold px-3 py-2 rounded-[var(--bw-radius-md)] border border-dashed cursor-pointer transition-all w-full text-center"
      style={{
        background: "transparent",
        borderColor: "var(--bw-border)",
        color: "var(--bw-muted)",
        fontFamily: "var(--bw-font-body)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget).style.borderColor = "var(--bw-ink)";
        (e.currentTarget).style.color = "var(--bw-ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget).style.borderColor = "var(--bw-border)";
        (e.currentTarget).style.color = "var(--bw-muted)";
      }}
    >
      {children}
    </button>
  );
}