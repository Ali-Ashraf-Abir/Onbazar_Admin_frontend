"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  SIZE_CHART_PRESETS,
  SizeChart,
  SizeChartRow,
  buildDefaultChart,
  syncChartToSizes,
  chartToJson,
} from "../../../../constants/sizeChart";

const API = process.env.NEXT_PUBLIC_API_URL as string;

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "Free Size"];

/* ─────────────────────── types ─────────────────────── */

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

const COMMON_COST_KEYS: { key: string; label: string }[] = [
  { key: "packaging",         label: "Packaging"          },
  { key: "shipping",          label: "Shipping"           },
  { key: "transactionFee",    label: "Transaction Fee"    },
  { key: "adsCost",           label: "Ads Cost"           },
  { key: "manufacturingCost", label: "Manufacturing Cost" },
  { key: "customDutyCost",    label: "Custom Duty"        },
  { key: "storageCost",       label: "Storage Cost"       },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

function computeProfit(sellingPrice: string, costPrice: string, costs: CostEntry[]) {
  const sp     = parseFloat(sellingPrice) || 0;
  const cp     = parseFloat(costPrice) || 0;
  const extras = costs.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0);
  const total  = cp + extras;
  const margin = sp - total;
  const pct    = sp > 0 ? ((margin / sp) * 100).toFixed(1) : "–";
  return { sp, cp, extras, total, margin, pct };
}

/* ─────────────────────── shared tw helpers ─────────────────────── */

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

/* ═══════════════════════════════════════════════════════ */

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product,     setProduct]     = useState<any>(null);
  const [saving,      setSaving]      = useState(false);
  const [settingCover,setSettingCover]= useState(false);

  /* ── basic ── */
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [bullets,     setBullets]     = useState<string[]>([]);
  const [isActive,    setIsActive]    = useState(true);

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
  const [sizes,           setSizes]           = useState<string[]>([]);
  const [sizeDropOpen,    setSizeDropOpen]    = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const sizeDropRef    = useRef<HTMLDivElement>(null);
  const sizeTriggerRef = useRef<HTMLButtonElement>(null);

  /* ── stock ── */
  const [stockManaged,  setStockManaged]  = useState(false);
  const [stockQty,      setStockQty]      = useState("");
  const [sizeStockRows, setSizeStockRows] = useState<SizeStockEntry[]>([]);

  /* ── images ── */
  const [newFiles,   setNewFiles]   = useState<FileList | null>(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [imageMode,  setImageMode]  = useState("append");

  /* ── size chart ── */
  const [showSizeChart,      setShowSizeChart]      = useState(false);
  const [useCustomSizeChart, setUseCustomSizeChart] = useState(false);
  const [sizeChart,          setSizeChart]          = useState<SizeChart>({ unit: "inches", columns: [], rows: [] });

  /* ── advanced ── */
  const [showAdvanced,      setShowAdvanced]      = useState(false);
  const [allowedAddonsJson, setAllowedAddonsJson] = useState("");

  /* ─────────────────────── fetch categories ─────────────────────── */

  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const res  = await fetch(`${API}/categories`);
        const json = await res.json();
        if (res.ok) setCategories(json.data as Category[]);
      } catch { /* silent */ }
      finally { setCategoriesLoading(false); }
    }
    loadCategories();
  }, []);

  /* ─────────────────────── load product ─────────────────────── */

  async function load() {
    if (!id) return;
    const res  = await fetch(`${API}/admin/products/${id}`);
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Failed to load product"); return; }
    const p = data.data;
    setProduct(p);

    setName(p.name);
    setDescription(p.details?.description || "");
    setBullets(p.details?.bullets || []);
    setIsActive(Boolean(p.isActive));

    const cat = p.category;
    setCategoryId(typeof cat === "object" && cat !== null ? cat._id : (cat ?? ""));

    const pricing = p.pricing || {};
    setSellingPrice(String(pricing.sellingPrice ?? ""));
    setCostPrice(pricing.costPrice != null ? String(pricing.costPrice) : "");
    setCurrency(pricing.currency || "BDT");

    if (pricing.additionalCosts && typeof pricing.additionalCosts === "object") {
      const entries = Object.entries(pricing.additionalCosts as Record<string, number>);
      if (entries.length > 0) {
        setAdditionalCosts(entries.map(([key, val]) => ({
          id: uid(), key,
          label: COMMON_COST_KEYS.find((c) => c.key === key)?.label ?? key,
          value: String(val),
        })));
        setShowCostSection(true);
      }
    }
    if (pricing.costPrice != null) setShowCostSection(true);

    if (p.discount) {
      setHasDiscount(true);
      setDiscountType(p.discount.type || "percentage");
      setDiscountValue(String(p.discount.value ?? ""));
      setDiscountStart(p.discount.startDate ? p.discount.startDate.slice(0, 10) : "");
      setDiscountEnd(p.discount.endDate ? p.discount.endDate.slice(0, 10) : "");
    }

    const loadedHasSize = p.hasSize !== false;
    const loadedSizes   = p.sizes || [];
    setHasSize(loadedHasSize);
    setSizes(loadedSizes);

    const stock        = p.stock;
    const stockSummary = p.stockSummary;
    if (stock?.managed) {
      setStockManaged(true);
      if (loadedHasSize) {
        const bySize: Record<string, number> = stockSummary?.bySize ?? stock.bySize ?? {};
        setSizeStockRows(loadedSizes.map((s: string) => ({ size: s, qty: bySize[s] != null ? String(bySize[s]) : "" })));
      } else {
        const qty = stockSummary?.total ?? stock.quantity;
        setStockQty(qty != null ? String(qty) : "");
      }
    } else {
      setStockManaged(false);
      setStockQty("");
      setSizeStockRows([]);
    }

    if (p.sizeChart?.columns?.length > 0) {
      setUseCustomSizeChart(true);
      setSizeChart(p.sizeChart);
    } else {
      setUseCustomSizeChart(false);
      setSizeChart({ unit: "inches", columns: [], rows: [] });
    }

    setAllowedAddonsJson(p.allowedAddons ? JSON.stringify(p.allowedAddons, null, 2) : "");
  }

  useEffect(() => { load(); }, [id]);

  /* ─────────────────────── side effects ─────────────────────── */

  useEffect(() => {
    function h(e: MouseEvent) {
      if (sizeDropRef.current && !sizeDropRef.current.contains(e.target as Node))
        setSizeDropOpen(false);
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

  useEffect(() => {
    if (!stockManaged || !hasSize) return;
    setSizeStockRows((prev) => {
      const prevMap = new Map(prev.map((r) => [r.size, r.qty]));
      return sizes.map((s) => ({ size: s, qty: prevMap.get(s) ?? "" }));
    });
  }, [sizes, stockManaged, hasSize]);

  /* ─────────────────────── size helpers ─────────────────────── */

  function toggleSize(s: string)  { setSizes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]); }
  function addCustomSize()        { const v = customSizeInput.trim().toUpperCase(); if (v && !sizes.includes(v)) setSizes((p) => [...p, v]); setCustomSizeInput(""); }
  function removeSize(s: string)  { setSizes((p) => p.filter((x) => x !== s)); }

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
  function addChartRow()             { setSizeChart((p) => ({ ...p, rows: [...p.rows, { label: "New Measurement", values: p.columns.map(() => "") }] })); }
  function removeChartRow(i: number) { setSizeChart((p) => ({ ...p, rows: p.rows.filter((_, j) => j !== i) })); }

  /* ─────────────────────── image actions ─────────────────────── */

  async function removeImage(url: string) {
    const res  = await fetch(`${API}/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ removeImages: [url] }) });
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
      const res  = await fetch(`${API}/admin/products/${id}`, { method: "PATCH", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to set cover image"); return; }
      setProduct(data.data);
    } finally { setSettingCover(false); }
  }

  async function resetSizeChartToDefault() {
    if (!confirm("Reset size chart to default?")) return;
    const res  = await fetch(`${API}/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sizeChart: null }) });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Failed resetting size chart"); return; }
    setProduct(data.data);
    setUseCustomSizeChart(false);
    setSizeChart({ unit: "inches", columns: [], rows: [] });
  }

  /* ─────────────────────── delete ─────────────────────── */

  async function handleDelete() {
    if (!confirm(`Delete "${product?.name}"? This cannot be undone.`)) return;
    const res  = await fetch(`${API}/admin/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Delete failed"); return; }
    window.location.href = "/admin/products";
  }

  /* ─────────────────────── save ─────────────────────── */

  async function handlePatch() {
    if (!categoryId)  return alert("Please select a category");
    if (!sellingPrice || isNaN(Number(sellingPrice))) return alert("Enter a valid selling price");

    const pricingObj: Record<string, unknown> = { sellingPrice: Number(sellingPrice), currency };
    pricingObj.costPrice = (costPrice && !isNaN(Number(costPrice))) ? Number(costPrice) : null;
    const costMap: Record<string, number> = {};
    for (const c of additionalCosts) {
      const k = c.key.trim(); const v = parseFloat(c.value);
      if (k && !isNaN(v)) costMap[k] = v;
    }
    pricingObj.additionalCosts = costMap;

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

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name",     name);
      fd.append("category", categoryId);
      fd.append("pricing",  JSON.stringify(pricingObj));
      fd.append("discount", discountObj ? JSON.stringify(discountObj) : JSON.stringify(null));
      fd.append("isActive", String(isActive));
      fd.append("hasSize",  String(hasSize));
      fd.append("details",  JSON.stringify({ description, bullets: bullets.map((b) => b.trim()).filter(Boolean) }));
      fd.append("stock",    JSON.stringify(stockObj));

      if (hasSize) {
        fd.append("sizes", JSON.stringify(sizes));
        if (useCustomSizeChart && sizeChart.columns.length > 0) fd.append("sizeChart", chartToJson(sizeChart));
        else fd.append("sizeChart", JSON.stringify(null));
      } else {
        fd.append("sizes",     JSON.stringify([]));
        fd.append("sizeChart", JSON.stringify(null));
      }

      if (allowedAddonsJson.trim()) {
        try { fd.append("allowedAddons", JSON.stringify(JSON.parse(allowedAddonsJson))); }
        catch { alert("Invalid allowedAddons JSON"); setSaving(false); return; }
      } else {
        fd.append("allowedAddons", JSON.stringify(null));
      }

      fd.append("imageMode", imageMode);
      if (newFiles) { for (let i = 0; i < newFiles.length; i++) fd.append("images", newFiles[i]); }

      const res  = await fetch(`${API}/admin/products/${id}`, { method: "PATCH", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Update failed"); return; }
      setProduct(data.data);
      setNewFiles(null);
      alert("Saved!");
    } finally { setSaving(false); }
  }

  /* ─────────────────────── derived ─────────────────────── */

  const profit           = computeProfit(sellingPrice, costPrice, additionalCosts);
  const hasCostData      = costPrice || additionalCosts.length > 0;
  const selectedCategory = categories.find((c) => c._id === categoryId);
  const savedPricing     = product?.pricing || {};

  /* ─────────────────────── guards ─────────────────────── */

  if (!id) return (
    <div className="p-10" style={{ fontFamily: "var(--bw-font-body)", color: "var(--bw-muted)" }}>
      Loading route…
    </div>
  );

  if (!product) return (
    <div className="p-10 flex items-center gap-3" style={{ fontFamily: "var(--bw-font-body)", color: "var(--bw-muted)" }}>
      <span
        className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: "var(--bw-ink)" }}
      />
      Loading product…
    </div>
  );

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm font-semibold px-3 py-1.5 rounded-[var(--bw-radius-md)] border cursor-pointer transition-all"
            style={{
              background: "transparent",
              borderColor: "var(--bw-border)",
              color: "var(--bw-red)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.background   = "var(--bw-red-bg)";
              (e.currentTarget).style.borderColor  = "var(--bw-red)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background   = "transparent";
              (e.currentTarget).style.borderColor  = "var(--bw-border)";
            }}
          >
            Delete Product
          </button>
          <a
            href="/admin/products"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--bw-muted)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bw-ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bw-muted)")}
          >
            ← Back
          </a>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-5 py-8">

        {/* ── Page title ── */}
        <h1 className="text-3xl tracking-tight mb-5" style={{ fontFamily: "var(--bw-font-display)" }}>
          {product.name}
        </h1>

        {/* ── Meta bar ── */}
        <div className="flex items-center gap-2.5 flex-wrap mb-7">
          {/* Status badge */}
          <span
            className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full"
            style={
              product.isActive
                ? { background: "rgba(22,163,74,0.1)", color: "var(--bw-green)", border: "1px solid rgba(22,163,74,0.25)" }
                : { background: "var(--bw-surface-alt)", color: "var(--bw-muted)", border: "1px solid var(--bw-border)" }
            }
          >
            {product.isActive ? "● Active" : "○ Draft"}
          </span>

          {/* Selling price */}
          <span className="text-xl font-semibold tracking-tight" style={{ color: "var(--bw-ink)" }}>
            <span className="text-sm font-normal mr-0.5" style={{ color: "var(--bw-ghost)" }}>৳</span>
            {savedPricing.sellingPrice?.toFixed(2) ?? "–"}
          </span>

          {savedPricing.costPrice != null && (
            <span className="text-xs" style={{ color: "var(--bw-muted)" }}>
              Cost: ৳{savedPricing.costPrice.toFixed(2)}
            </span>
          )}

          {/* Stock */}
          {product.stock?.managed && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{
                background: "var(--bw-surface-alt)",
                borderColor: "var(--bw-border)",
                color: "var(--bw-ink)",
              }}
            >
              📦 {hasSize ? totalSizedStock : (parseInt(stockQty) || product.stock?.quantity || 0)} units
            </span>
          )}

          {/* Category */}
          {product.category && typeof product.category === "object" && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{
                background: "var(--bw-bg-alt)",
                borderColor: "var(--bw-border-strong)",
                color: "var(--bw-ink-secondary)",
              }}
            >
              {product.category.name}
            </span>
          )}

          {/* Slug */}
          <span
            className="text-xs px-2 py-0.5 rounded-md"
            style={{
              background: "var(--bw-surface-alt)",
              color: "var(--bw-ghost)",
              fontFamily: "var(--bw-font-mono)",
            }}
          >
            {product.slug}
          </span>

          {/* ID */}
          <span
            className="text-[10px]"
            style={{ color: "var(--bw-ghost)", fontFamily: "var(--bw-font-mono)" }}
          >
            {product._id}
          </span>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ══════════════════ LEFT ══════════════════ */}
          <div>

            {/* ── Current Images ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>🖼</span> Images</div>
                <span className="text-xs font-semibold" style={{ color: "var(--bw-ghost)" }}>
                  {product.images.length}/4
                </span>
              </div>
              <div className="p-5">
                {product.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {product.images.map((img: string, idx: number) => (
                      <div
                        key={img}
                        className="relative rounded-[var(--bw-radius-md)] overflow-hidden border"
                        style={{
                          borderColor: idx === 0 ? "var(--bw-ink)" : "var(--bw-border)",
                          borderWidth: idx === 0 ? 2 : 1,
                        }}
                      >
                        <img src={img} alt="" className="w-full h-32 object-cover block" />
                        {idx === 0 && (
                          <div
                            className="absolute top-1.5 left-1.5 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                            style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
                          >
                            COVER
                          </div>
                        )}
                        <div
                          className="flex gap-1.5 px-2 py-1.5 border-t"
                          style={{ background: "var(--bw-surface-alt)", borderColor: "var(--bw-border)" }}
                        >
                          <button
                            type="button"
                            onClick={() => setCoverImage(img)}
                            disabled={idx === 0 || settingCover}
                            className="flex-1 text-[11px] font-semibold py-1 rounded border cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background: "var(--bw-surface)",
                              borderColor: "var(--bw-border)",
                              color: "var(--bw-ink)",
                            }}
                          >
                            {settingCover && idx !== 0 ? "Saving…" : "Set Cover"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(img)}
                            className="flex-1 text-[11px] font-semibold py-1 rounded border cursor-pointer"
                            style={{
                              background: "var(--bw-surface)",
                              borderColor: "var(--bw-border)",
                              color: "var(--bw-red)",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="py-8 text-center text-sm rounded-[var(--bw-radius-md)]"
                    style={{ background: "var(--bw-bg-alt)", color: "var(--bw-ghost)" }}
                  >
                    No images uploaded yet.
                  </div>
                )}
              </div>
            </div>

            {/* ── Upload Images ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>📤</span> Upload Images</div>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div>
                  <label className={labelCls}>Mode</label>
                  <div className="relative">
                    <select
                      className={`${inputCls} appearance-none cursor-pointer pr-9`}
                      value={imageMode}
                      onChange={(e) => setImageMode(e.target.value)}
                    >
                      <option value="append">Append — add to existing images</option>
                      <option value="replace">Replace — swap all images</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
                  </div>
                </div>

                <label
                  className="flex flex-col items-center justify-center gap-2 rounded-[var(--bw-radius-lg)] border-2 border-dashed p-8 cursor-pointer transition-all duration-150"
                  style={{
                    borderColor: dragOver ? "var(--bw-ink)" : "var(--bw-border)",
                    background:  dragOver ? "var(--bw-bg-alt)" : "var(--bw-surface-alt)",
                  }}
                  onDragOver={(e)  => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={()  => setDragOver(false)}
                  onDrop={(e)      => { e.preventDefault(); setDragOver(false); setNewFiles(e.dataTransfer.files); }}
                >
                  <input
                    type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => setNewFiles(e.target.files)}
                  />
                  <div className="text-3xl opacity-30">📷</div>
                  <p className="text-sm font-medium" style={{ color: "var(--bw-ink-secondary)" }}>Click or drag images here</p>
                  <p className="text-xs" style={{ color: "var(--bw-ghost)" }}>PNG, JPG, WEBP</p>
                </label>

                {newFiles && newFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(newFiles).map((f, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "var(--bw-surface-alt)", color: "var(--bw-muted)" }}
                      >
                        📎 {f.name}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNewFiles(null)}
                      className="text-xs underline bg-transparent border-none cursor-pointer"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Pricing ── */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <div className={cardTitleCls}><span>💰</span> Pricing</div>
              </div>
              <div className="p-5 flex flex-col gap-4">

                {/* Selling price */}
                <div>
                  <label className={labelCls}>Selling Price <span style={{ color: "var(--bw-red)" }}>*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className={inputCls}
                        type="number" min="0" step="0.01"
                        placeholder="e.g. 1299"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "var(--bw-ghost)" }}>
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
                  label="Discount"
                  desc="Apply a percentage or fixed price reduction"
                />

                {hasDiscount && (
                  <div
                    className="p-4 rounded-[var(--bw-radius-md)] flex flex-col gap-3"
                    style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}
                  >
                    {/* Type tabs */}
                    <div className="flex rounded-[var(--bw-radius-md)] overflow-hidden border" style={{ borderColor: "var(--bw-border)" }}>
                      {(["percentage", "fixed"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDiscountType(t)}
                          className="flex-1 py-2.5 text-xs font-bold cursor-pointer border-none transition-all"
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
                            <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>(optional)</span>
                          </label>
                          <input className={inputCls} type="date" value={val} onChange={(e) => set(e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost divider */}
                <div className="flex items-center gap-3 my-1">
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
                        Cost Price <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>(product cost)</span>
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
                              className="px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all"
                              style={{
                                borderColor: "var(--bw-border)",
                                background:  "var(--bw-input-bg)",
                                color:        "var(--bw-muted)",
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
                                <td className="px-1.5 py-1">
                                  <DelBtn onClick={() => removeCostRow(c.id)} />
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
                      <div className="rounded-[var(--bw-radius-md)] overflow-hidden" style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}>
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--bw-muted)" }}>Profit Preview</span>
                          <span className="text-lg font-bold" style={{ color: profit.margin > 0 ? "var(--bw-green)" : profit.margin < 0 ? "var(--bw-red)" : "var(--bw-ghost)" }}>
                            {profit.margin > 0 ? "+" : ""}{currency} {profit.margin.toFixed(2)}
                            {profit.sp > 0 && <span className="text-xs font-medium opacity-60 ml-1.5">({profit.pct}%)</span>}
                          </span>
                        </div>
                        <div className="border-t" style={{ borderColor: "var(--bw-border)" }}>
                          {[
                            { label: "Selling Price", val: `${currency} ${profit.sp.toFixed(2)}`, total: false },
                            ...(profit.cp > 0 ? [{ label: "Cost Price", val: `− ${currency} ${profit.cp.toFixed(2)}`, total: false }] : []),
                            ...additionalCosts.filter((c) => parseFloat(c.value) > 0).map((c) => ({
                              label: c.label || c.key, val: `− ${currency} ${parseFloat(c.value).toFixed(2)}`, total: false,
                            })),
                            { label: "Total Cost", val: `− ${currency} ${profit.total.toFixed(2)}`, total: true },
                          ].map((row, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center px-4 py-2 border-b last:border-0"
                              style={{ borderColor: "var(--bw-divider)", background: row.total ? "var(--bw-bg-alt)" : undefined }}
                            >
                              <span className="text-sm" style={{ color: row.total ? "var(--bw-ink)" : "var(--bw-muted)", fontWeight: row.total ? 600 : 400 }}>{row.label}</span>
                              <span className="text-sm font-semibold" style={{ color: "var(--bw-ink)" }}>{row.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Size Chart ── */}
            {hasSize && (
              <div className={cardCls}>
                <button
                  type="button"
                  onClick={() => setShowSizeChart((p) => !p)}
                  className="w-full flex items-center justify-between px-5 py-4 cursor-pointer border-none text-left"
                  style={{ background: "transparent", fontFamily: "var(--bw-font-body)" }}
                >
                  <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--bw-ink)" }}>
                    <span>📏</span> Size Chart
                    {useCustomSizeChart && (
                      <span className="text-[11px] font-normal" style={{ color: "var(--bw-ghost)" }}>({sizeChart.unit})</span>
                    )}
                  </span>
                  <span
                    className="text-xs transition-transform duration-200"
                    style={{ color: "var(--bw-ghost)", display: "inline-block", transform: showSizeChart ? "rotate(180deg)" : "none" }}
                  >
                    ▼
                  </span>
                </button>

                {showSizeChart && (
                  <div className="border-t p-5 flex flex-col gap-4" style={{ borderColor: "var(--bw-border)" }}>
                    <BwToggle
                      checked={useCustomSizeChart}
                      onChange={(v) => {
                        setUseCustomSizeChart(v);
                        if (v && sizeChart.columns.length === 0) setSizeChart(buildDefaultChart(sizes));
                      }}
                      label="Use Custom Size Chart"
                      desc="Edit measurement table for this product"
                    />

                    {useCustomSizeChart ? (
                      sizes.length === 0 ? (
                        <p className="text-sm text-center py-4 italic" style={{ color: "var(--bw-ghost)" }}>
                          ↑ Add sizes to start building your size chart.
                        </p>
                      ) : (
                        <>
                          <div>
                            <label className={labelCls}>Load Preset</label>
                            <div className="flex gap-2 flex-wrap">
                              {Object.keys(SIZE_CHART_PRESETS).map((key) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => { if (confirm(`Load "${key}" preset?`)) setSizeChart(buildDefaultChart(sizes, key)); }}
                                  className="px-3 py-1 rounded-md text-xs font-semibold capitalize border cursor-pointer"
                                  style={{ background: "var(--bw-surface-alt)", borderColor: "var(--bw-border)", color: "var(--bw-muted)" }}
                                >
                                  {key}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Unit toggle */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ color: "var(--bw-muted)" }}>Measurements ({sizeChart.unit})</span>
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
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1" style={{ color: "var(--bw-ghost)" }}>Measurement</th>
                                  {sizeChart.columns.map((col: string, ci: number) => (
                                    <th key={ci} className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1" style={{ color: "var(--bw-ghost)" }}>{col}</th>
                                  ))}
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {sizeChart.rows.map((row: SizeChartRow, ri: number) => (
                                  <tr key={ri}>
                                    <td className="px-1 py-1">
                                      <input className={inputCls} value={row.label} onChange={(e) => updateRowLabel(ri, e.target.value)} placeholder="e.g. Chest" />
                                    </td>
                                    {row.values.map((val: any, ci: number) => (
                                      <td key={ci} className="px-1 py-1">
                                        <input className={inputCls} type="number" min="0" step="0.5" value={val} onChange={(e) => updateChartCell(ri, ci, e.target.value)} placeholder="–" />
                                      </td>
                                    ))}
                                    <td className="px-1 py-1">
                                      <DelBtn onClick={() => removeChartRow(ri)} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <AddRowBtn onClick={addChartRow}>+ Add measurement row</AddRowBtn>
                            <button
                              type="button"
                              onClick={resetSizeChartToDefault}
                              className="text-xs font-semibold px-3 py-2 rounded-[var(--bw-radius-md)] border cursor-pointer transition-all"
                              style={{
                                background: "transparent",
                                borderColor: "var(--bw-border)",
                                color: "var(--bw-red)",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget).style.background  = "var(--bw-red-bg)";
                                (e.currentTarget).style.borderColor = "var(--bw-red)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget).style.background  = "transparent";
                                (e.currentTarget).style.borderColor = "var(--bw-border)";
                              }}
                            >
                              Reset to Default
                            </button>
                          </div>
                        </>
                      )
                    ) : (
                      <p className="text-sm text-center py-4 italic" style={{ color: "var(--bw-ghost)" }}>
                        Using store default — enable toggle above to customise.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
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
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
                </div>

                <div>
                  <label className={labelCls}>Category</label>
                  {categoriesLoading ? (
                    <p className="text-sm italic" style={{ color: "var(--bw-ghost)" }}>Loading categories…</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--bw-ghost)" }}>
                      No categories found.{" "}
                      <a href="/admin/categories" className="underline" style={{ color: "var(--bw-ink)" }}>Create one first →</a>
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
                        <span
                          className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: "var(--bw-bg-alt)", border: "1px solid var(--bw-border)", color: "var(--bw-ink-secondary)" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                          {selectedCategory.name}
                          <span style={{ color: "var(--bw-ghost)", fontWeight: 400 }}>· {selectedCategory.slug}</span>
                        </span>
                      )}
                    </>
                  )}
                </div>

                <BwToggle
                  checked={isActive}
                  onChange={setIsActive}
                  label={
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: isActive ? "var(--bw-green)" : "var(--bw-ghost)" }} />
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description…"
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
                      <DelBtn onClick={() => removeBullet(idx)} />
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
                    Size picker will be hidden for this product.
                  </div>
                )}

                {hasSize && (
                  <div>
                    <label className={labelCls}>Available Sizes</label>
                    <div className="relative" ref={sizeDropRef}>
                      <button
                        type="button"
                        ref={sizeTriggerRef}
                        onClick={() => setSizeDropOpen((p) => !p)}
                        className="w-full flex items-center justify-between rounded-[var(--bw-radius-md)] px-3 py-2.5 text-sm border cursor-pointer transition-all text-left"
                        style={{
                          background:  "var(--bw-input-bg)",
                          borderColor: sizeDropOpen ? "var(--bw-ink)" : "var(--bw-border)",
                          color:       sizes.length === 0 ? "var(--bw-placeholder)" : "var(--bw-ink)",
                        }}
                      >
                        {sizes.length === 0 ? (
                          <span>Choose sizes…</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {sizes.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}>{s}</span>
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
                          style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)", boxShadow: "var(--bw-shadow-lg)" }}
                        >
                          <div className="p-3 border-b" style={{ borderColor: "var(--bw-border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--bw-ghost)" }}>Common sizes — click to toggle</p>
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
                            style={{ background: "var(--bw-bg-alt)", border: "1px solid var(--bw-border)", color: "var(--bw-ink)" }}
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
                    className="text-xs font-bold px-3 py-1 rounded-full border"
                    style={{ background: "var(--bw-bg-alt)", borderColor: "var(--bw-border)", color: "var(--bw-ink)" }}
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
                  desc={stockManaged ? "Orders will be blocked when stock runs out" : "Stock is unlimited — orders always go through"}
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
                  <div className="p-4 rounded-[var(--bw-radius-md)]" style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}>

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
                          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--bw-ghost)" }}>units</span>
                          {stockQty !== "" && <StockPill inStock={parseInt(stockQty) > 0} />}
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
                                  <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-2" style={{ color: "var(--bw-ghost)" }}>{h}</th>
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
                                        style={{ borderColor: "var(--bw-border)", background: "var(--bw-input-bg)", color: "var(--bw-ink)" }}
                                      >
                                        {row.size}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1.5 w-[45%]">
                                      <input
                                        className={inputCls}
                                        type="number" min="0" step="1" placeholder="0"
                                        value={row.qty}
                                        onChange={(e) => updateSizeStock(row.size, e.target.value)}
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      {filled ? <StockPill inStock={inStock} compact /> : <span className="text-xs" style={{ color: "var(--bw-ghost)" }}>—</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--bw-border)" }}>
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

            {/* ── Advanced ── */}
            <div className={cardCls}>
              <button
                type="button"
                onClick={() => setShowAdvanced((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-4 cursor-pointer border-none text-left"
                style={{ background: "transparent", fontFamily: "var(--bw-font-body)" }}
              >
                <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--bw-ink)" }}>
                  <span>⚙️</span> Advanced Settings
                </span>
                <span
                  className="text-xs transition-transform duration-200"
                  style={{ color: "var(--bw-ghost)", display: "inline-block", transform: showAdvanced ? "rotate(180deg)" : "none" }}
                >
                  ▼
                </span>
              </button>

              {showAdvanced && (
                <div className="border-t p-5" style={{ borderColor: "var(--bw-border)" }}>
                  <label className={labelCls}>
                    Allowed Addons{" "}
                    <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>(optional JSON)</span>
                  </label>
                  <textarea
                    className={`${inputCls} resize-y min-h-[80px]`}
                    style={{ fontFamily: "var(--bw-font-mono)", fontSize: 12 }}
                    value={allowedAddonsJson}
                    onChange={(e) => setAllowedAddonsJson(e.target.value)}
                    placeholder='e.g. ["66f..."] — leave empty to allow ALL'
                  />
                </div>
              )}
            </div>

            {/* ── Save ── */}
            <div
              className="flex flex-col gap-3 p-5 rounded-[var(--bw-radius-xl)] border"
              style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
            >
              <button
                type="button"
                onClick={handlePatch}
                disabled={saving}
                className="w-full py-3.5 rounded-[var(--bw-radius-md)] text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--bw-bg)" }} />
                    Saving…
                  </>
                ) : "Save Changes →"}
              </button>
              <p className="text-center text-xs" style={{ color: "var(--bw-ghost)" }}>
                Costs are private · Size chart optional
              </p>
            </div>
          </div>
        </div>
      </div>
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

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        className="appearance-none border rounded-[var(--bw-radius-md)] px-3 py-2.5 pr-8 text-sm font-semibold outline-none cursor-pointer transition-all"
        style={{ background: "var(--bw-input-bg)", borderColor: "var(--bw-border)", color: "var(--bw-ink)", fontFamily: "var(--bw-font-body)" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option>BDT</option><option>USD</option><option>EUR</option><option>GBP</option>
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
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: inStock ? "var(--bw-green)" : "var(--bw-red)" }} />
      {compact ? (inStock ? "In Stock" : "Out") : (inStock ? "In Stock" : "Out of Stock")}
    </span>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-md text-xs border-none cursor-pointer flex-shrink-0"
      style={{ background: "var(--bw-surface-alt)", color: "var(--bw-muted)" }}
    >
      ✕
    </button>
  );
}

function AddRowBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold px-3 py-2 rounded-[var(--bw-radius-md)] border border-dashed cursor-pointer transition-all w-full text-center"
      style={{ background: "transparent", borderColor: "var(--bw-border)", color: "var(--bw-muted)", fontFamily: "var(--bw-font-body)" }}
      onMouseEnter={(e) => { (e.currentTarget).style.borderColor = "var(--bw-ink)"; (e.currentTarget).style.color = "var(--bw-ink)"; }}
      onMouseLeave={(e) => { (e.currentTarget).style.borderColor = "var(--bw-border)"; (e.currentTarget).style.color = "var(--bw-muted)"; }}
    >
      {children}
    </button>
  );
}