"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  SizeChart,
  buildDefaultChart,
  syncChartToSizes,
  chartToJson,
} from "../../constants/sizeChart";
import { CostEntry } from "../create-products/Ui";
import api, { ApiError } from "../../lib/api";

export const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "Free Size"];

export const COMMON_COST_KEYS: { key: string; label: string }[] = [
  { key: "packaging",         label: "Packaging"          },
  { key: "shipping",          label: "Shipping"           },
  { key: "transactionFee",    label: "Transaction Fee"    },
  { key: "adsCost",           label: "Ads Cost"           },
  { key: "manufacturingCost", label: "Manufacturing Cost" },
  { key: "customDutyCost",    label: "Custom Duty"        },
  { key: "storageCost",       label: "Storage Cost"       },
];

export interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface SizeStockEntry {
  size: string;
  qty: string;
}

/* ── response shapes ── */

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  hasSize: boolean;
  sizes: string[];
  details?: { description?: string; bullets?: string[] };
  category: Category | string;
  pricing: {
    sellingPrice: number;
    costPrice?: number;
    currency?: string;
    additionalCosts?: Record<string, number>;
  };
  discount?: {
    type: "percentage" | "fixed";
    value: number;
    startDate?: string;
    endDate?: string;
  };
  stock?: {
    managed: boolean;
    quantity?: number;
    bySize?: Record<string, number>;
  };
  stockSummary?: {
    total?: number;
    bySize?: Record<string, number>;
  };
  sizeChart?: SizeChart;
  allowedAddons?: unknown;
  images: string[];
}

interface ProductApiResponse  { data: ProductData }
interface PatchApiResponse    { data: ProductData }

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ═══════════════════════════════════════════════════════ */

export function useEditProduct() {
  const params = useParams();
  const id = params?.id as string;

  const [product,      setProduct]      = useState<ProductData | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [settingCover, setSettingCover] = useState(false);

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
  const [newFiles,  setNewFiles]  = useState<FileList | null>(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [imageMode, setImageMode] = useState("append");

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
        const json = await api.get<{ data: Category[] }>("/categories");
        setCategories(json.data);
      } catch { /* silent */ }
      finally { setCategoriesLoading(false); }
    }
    loadCategories();
  }, []);

  /* ─────────────────────── load product ─────────────────────── */

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const json = await api.get<ProductApiResponse>(`/admin/products/${id}`);
      const p = json.data;
      setProduct(p);

      setName(p.name);
      setDescription(p.details?.description || "");
      setBullets(p.details?.bullets || []);
      setIsActive(Boolean(p.isActive));

      const cat = p.category;
      setCategoryId(typeof cat === "object" && cat !== null ? cat._id : (cat ?? ""));

      const pricing = p.pricing || {};
      setSellingPrice(String(pricing.sellingPrice ?? ""));
      setCurrency(pricing.currency || "BDT");

      const loadedCostPrice = pricing.costPrice != null ? String(pricing.costPrice) : "";
      setCostPrice(loadedCostPrice);

      const additionalEntries = Object.entries(pricing.additionalCosts ?? {});
      const loadedCosts: CostEntry[] = additionalEntries.map(([key, val]) => ({
        id: uid(), key,
        label: COMMON_COST_KEYS.find((c) => c.key === key)?.label ?? key,
        value: String(val),
      }));
      setAdditionalCosts(loadedCosts);

      const hasCosts = loadedCostPrice !== "" || loadedCosts.length > 0;
      setShowCostSection(hasCosts);

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
          setSizeStockRows(loadedSizes.map((s) => ({ size: s, qty: bySize[s] != null ? String(bySize[s]) : "" })));
        } else {
          const qty = stockSummary?.total ?? stock.quantity;
          setStockQty(qty != null ? String(qty) : "");
        }
      } else {
        setStockManaged(false);
        setStockQty("");
        setSizeStockRows([]);
      }

      if (p.sizeChart?.columns?.length) {
        setUseCustomSizeChart(true);
        setSizeChart(p.sizeChart);
      } else {
        setUseCustomSizeChart(false);
        setSizeChart({ unit: "inches", columns: [], rows: [] });
      }

      setAllowedAddonsJson(p.allowedAddons ? JSON.stringify(p.allowedAddons, null, 2) : "");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load product";
      alert(message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

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

  const toggleSize = useCallback((s: string) => {
    setSizes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  }, []);

  const addCustomSize = useCallback(() => {
    const v = customSizeInput.trim().toUpperCase();
    if (v && !sizes.includes(v)) setSizes((p) => [...p, v]);
    setCustomSizeInput("");
  }, [customSizeInput, sizes]);

  const removeSize = useCallback((s: string) => {
    setSizes((p) => p.filter((x) => x !== s));
  }, []);

  /* ─────────────────────── bullet helpers ─────────────────────── */

  const addBullet    = useCallback(() => setBullets((p) => [...p, ""]), []);
  const updateBullet = useCallback((i: number, v: string) => {
    setBullets((p) => p.map((b, j) => (j === i ? v : b)));
  }, []);
  const removeBullet = useCallback((i: number) => {
    setBullets((p) => p.filter((_, j) => j !== i));
  }, []);

  /* ─────────────────────── cost helpers ─────────────────────── */

  const addCostRow = useCallback((key = "", label = "") => {
    setAdditionalCosts((p) => [...p, { id: uid(), key, label: label || key, value: "" }]);
  }, []);

  const updateCostRow = useCallback((id: string, field: "key" | "label" | "value", val: string) => {
    setAdditionalCosts((p) => p.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  }, []);

  const removeCostRow = useCallback((id: string) => {
    setAdditionalCosts((p) => p.filter((c) => c.id !== id));
  }, []);

  const addPresetCost = useCallback((key: string, label: string) => {
    setAdditionalCosts((p) => {
      if (p.some((c) => c.key === key)) return p;
      return [...p, { id: uid(), key, label, value: "" }];
    });
  }, []);

  /* ─────────────────────── stock helpers ─────────────────────── */

  const updateSizeStock = useCallback((size: string, qty: string) => {
    setSizeStockRows((p) => p.map((r) => (r.size === size ? { ...r, qty } : r)));
  }, []);

  /* ─────────────────────── chart helpers ─────────────────────── */

  const updateChartCell = useCallback((ri: number, ci: number, v: string) => {
    setSizeChart((p) => ({
      ...p,
      rows: p.rows.map((r, i) =>
        i === ri ? { ...r, values: r.values.map((x, j) => (j === ci ? v : x)) } : r
      ),
    }));
  }, []);

  const updateRowLabel = useCallback((ri: number, v: string) => {
    setSizeChart((p) => ({
      ...p,
      rows: p.rows.map((r, i) => (i === ri ? { ...r, label: v } : r)),
    }));
  }, []);

  const addChartRow = useCallback(() => {
    setSizeChart((p) => ({
      ...p,
      rows: [...p.rows, { label: "New Measurement", values: p.columns.map(() => "") }],
    }));
  }, []);

  const removeChartRow = useCallback((i: number) => {
    setSizeChart((p) => ({ ...p, rows: p.rows.filter((_, j) => j !== i) }));
  }, []);

  /* ─────────────────────── image actions ─────────────────────── */

  const removeImage = useCallback(async (url: string) => {
    try {
      const result = await api.patch<PatchApiResponse>(`/admin/products/${id}`, { removeImages: [url] });
      setProduct(result.data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed removing image";
      alert(message);
    }
  }, [id]);

  const setCoverImage = useCallback(async (url: string) => {
    if (!product || settingCover) return;
    const reordered = [url, ...product.images.filter((u) => u !== url)];
    setSettingCover(true);
    try {
      const fd = new FormData();
      fd.append("images", JSON.stringify(reordered));
      const result = await api.uploadPatch<PatchApiResponse>(`/admin/products/${id}`, fd);
      setProduct(result.data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to set cover image";
      alert(message);
    } finally {
      setSettingCover(false);
    }
  }, [id, product, settingCover]);

  const resetSizeChartToDefault = useCallback(async () => {
    if (!confirm("Reset size chart to default?")) return;
    try {
      const result = await api.patch<PatchApiResponse>(`/admin/products/${id}`, { sizeChart: null });
      setProduct(result.data);
      setUseCustomSizeChart(false);
      setSizeChart({ unit: "inches", columns: [], rows: [] });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed resetting size chart";
      alert(message);
    }
  }, [id]);

  /* ─────────────────────── delete ─────────────────────── */

  const handleDelete = useCallback(async () => {
    if (!confirm(`Delete "${product?.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      window.location.href = "/admin/products";
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Delete failed";
      alert(message);
    }
  }, [id, product?.name]);

  /* ─────────────────────── save ─────────────────────── */

  const handlePatch = useCallback(async () => {
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
      fd.append("discount", JSON.stringify(discountObj));
      fd.append("isActive", String(isActive));
      fd.append("hasSize",  String(hasSize));
      fd.append("details",  JSON.stringify({
        description,
        bullets: bullets.map((b) => b.trim()).filter(Boolean),
      }));
      fd.append("stock", JSON.stringify(stockObj));

      if (hasSize) {
        fd.append("sizes", JSON.stringify(sizes));
        if (useCustomSizeChart && sizeChart.columns.length > 0)
          fd.append("sizeChart", chartToJson(sizeChart));
        else
          fd.append("sizeChart", JSON.stringify(null));
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
      if (newFiles) {
        for (let i = 0; i < newFiles.length; i++) fd.append("images", newFiles[i]);
      }

      const result = await api.uploadPatch<PatchApiResponse>(`/admin/products/${id}`, fd);
      setProduct(result.data);
      setNewFiles(null);
      alert("Saved!");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Update failed";
      alert(message);
    } finally {
      setSaving(false);
    }
  }, [
    id, categoryId, sellingPrice, currency, costPrice, additionalCosts,
    hasDiscount, discountValue, discountType, discountStart, discountEnd,
    stockManaged, hasSize, sizeStockRows, stockQty, name, isActive,
    description, bullets, sizes, useCustomSizeChart, sizeChart,
    allowedAddonsJson, imageMode, newFiles,
  ]);

  /* ─────────────────────── derived ─────────────────────── */

  const totalSizedStock  = sizeStockRows.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0);
  const hasCostData      = !!(costPrice || additionalCosts.length > 0);
  const selectedCategory = categories.find((c) => c._id === categoryId);
  const savedPricing: Partial<ProductData["pricing"]> = product?.pricing ?? {};

  return {
    id, product,
    saving, settingCover,

    /* basic */
    name, setName,
    description, setDescription,
    bullets, addBullet, updateBullet, removeBullet,
    isActive, setIsActive,

    /* category */
    categories, categoryId, setCategoryId,
    categoriesLoading, selectedCategory,

    /* pricing */
    sellingPrice, setSellingPrice,
    costPrice, setCostPrice,
    currency, setCurrency,
    additionalCosts, addCostRow, updateCostRow, removeCostRow, addPresetCost,
    showCostSection, setShowCostSection,
    hasCostData, savedPricing,

    /* discount */
    hasDiscount, setHasDiscount,
    discountType, setDiscountType,
    discountValue, setDiscountValue,
    discountStart, setDiscountStart,
    discountEnd, setDiscountEnd,

    /* sizes */
    hasSize, setHasSize,
    sizes,
    sizeDropOpen, setSizeDropOpen,
    customSizeInput, setCustomSizeInput,
    sizeDropRef, sizeTriggerRef,
    toggleSize, addCustomSize, removeSize,

    /* stock */
    stockManaged, setStockManaged,
    stockQty, setStockQty,
    sizeStockRows, setSizeStockRows,
    updateSizeStock,
    totalSizedStock,

    /* images */
    newFiles, setNewFiles,
    dragOver, setDragOver,
    imageMode, setImageMode,
    removeImage, setCoverImage,

    /* size chart */
    showSizeChart, setShowSizeChart,
    useCustomSizeChart, setUseCustomSizeChart,
    sizeChart, setSizeChart,
    updateChartCell, updateRowLabel, addChartRow, removeChartRow,
    resetSizeChartToDefault,

    /* advanced */
    showAdvanced, setShowAdvanced,
    allowedAddonsJson, setAllowedAddonsJson,

    /* actions */
    handlePatch, handleDelete,
  };
}

export type EditProductStore = ReturnType<typeof useEditProduct>;