"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  SizeChart,
  buildDefaultChart,
  syncChartToSizes,
  chartToJson,
} from "../../constants/sizeChart";
import { CostEntry } from "./Ui";
import api, { ApiError } from "../../lib/api";

export const PRESET_SIZES = [
  "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "Free Size",
];

export const COMMON_COST_KEYS: { key: string; label: string; placeholder: string }[] = [
  { key: "packaging",         label: "Packaging",          placeholder: "e.g. 30"  },
  { key: "shipping",          label: "Shipping",           placeholder: "e.g. 60"  },
  { key: "transactionFee",    label: "Transaction Fee",    placeholder: "e.g. 20"  },
  { key: "adsCost",           label: "Ads Cost",           placeholder: "e.g. 50"  },
  { key: "manufacturingCost", label: "Manufacturing Cost", placeholder: "e.g. 200" },
  { key: "customDutyCost",    label: "Custom Duty",        placeholder: "e.g. 40"  },
  { key: "storageCost",       label: "Storage Cost",       placeholder: "e.g. 15"  },
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

export interface ImageEntry {
  file: File;
  url: string;
}

export interface LastCreated {
  id: string;
  name: string;
  sellingPrice: number;
  image: string;
}

interface CreateProductResponse {
  data: {
    _id: string;
    name: string;
    pricing: { sellingPrice: number };
    images?: string[];
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ═══════════════════════════════════════════════════════ */

export function useCreateProduct() {
  /* ── basic ── */
  const [name,          setName]          = useState("");
  const [isActive,      setIsActive]      = useState(true);
  const [isBestProduct, setIsBestProduct] = useState(false);
  const [description,   setDescription]   = useState("");
  const [bullets,       setBullets]       = useState<string[]>(["320 GSM", "Box Fit", "100% Cotton"]);

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
  const [lastCreated, setLastCreated] = useState<LastCreated | null>(null);

  /* ─────────────────────── effects ─────────────────────── */

  useEffect(() => {
    async function load() {
      setCategoriesLoading(true);
      try {
        const json = await api.get<{ data: Category[] }>("/categories");
        setCategories(json.data);
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

  /* ─────────────────────── image helpers ─────────────────────── */

  const addImages = useCallback((files: FileList | null) => {
    const sel = Array.from(files || []);
    if (!sel.length) return;
    for (const f of sel) {
      if (!f.type.startsWith("image/")) { alert("Only image files are allowed."); return; }
    }
    setImages((prev) => {
      const combined = [...prev, ...sel.map((f) => ({ file: f, url: URL.createObjectURL(f) }))];
      if (combined.length > 4) { alert("Maximum 4 images allowed."); return prev; }
      return combined;
    });
  }, []);

  const removeImage = useCallback((i: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, j) => j !== i);
    });
  }, []);

  const setAsCover = useCallback((i: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [e] = next.splice(i, 1);
      return [e, ...next];
    });
  }, []);

  const clearAllImages = useCallback(() => {
    setImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.url)); return []; });
  }, []);

  /* ─────────────────────── reset ─────────────────────── */

  const resetForm = useCallback(() => {
    setName(""); setIsActive(true); setIsBestProduct(false); setDescription("");
    setBullets(["320 GSM", "Box Fit", "100% Cotton"]);
    setSizes(["M", "L", "XL", "2XL"]); setHasSize(true);
    setCategoryId("");
    setSellingPrice(""); setCostPrice(""); setCurrency("BDT"); setAdditionalCosts([]);
    setShowCostSection(false);
    setHasDiscount(false); setDiscountType("percentage"); setDiscountValue("");
    setDiscountStart(""); setDiscountEnd("");
    setStockManaged(false); setStockQty(""); setSizeStockRows([]);
    setImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.url)); return []; });
    setUseCustomSizeChart(false);
    setSizeChart({ unit: "inches", columns: [], rows: [] });
    setAllowedAddonsJson(""); setShowAdvanced(false);
  }, []);

  /* ─────────────────────── submit ─────────────────────── */

  const handleCreate = useCallback(async () => {
    if (!name.trim())        return alert("Product name is required");
    if (!description.trim()) return alert("Description is required");
    if (!categoryId)         return alert("Please select a category");
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0)
      return alert("Enter a valid selling price");
    if (images.length < 1)  return alert("Please add at least 1 image");

    const pricingObj: Record<string, unknown> = {
      sellingPrice: Number(sellingPrice),
      currency,
    };
    if (costPrice && !isNaN(Number(costPrice)))
      pricingObj.costPrice = Number(costPrice);
    if (additionalCosts.length > 0) {
      const map: Record<string, number> = {};
      for (const c of additionalCosts) {
        const k = c.key.trim();
        const v = parseFloat(c.value);
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
      fd.append("name",          name.trim());
      fd.append("category",      categoryId);
      fd.append("pricing",       JSON.stringify(pricingObj));
      if (discountObj) fd.append("discount", JSON.stringify(discountObj));
      fd.append("isActive",      String(isActive));
      fd.append("isBestProduct", String(isBestProduct));
      fd.append("hasSize",       String(hasSize));
      fd.append("details",       JSON.stringify({
        description: description.trim(),
        bullets: bullets.map((b) => b.trim()).filter(Boolean),
      }));
      fd.append("stock", JSON.stringify(stockObj));
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

      const result = await api.upload<CreateProductResponse>("/admin/products", fd);
      const p = result.data;

      setLastCreated({
        id:           p._id,
        name:         p.name,
        sellingPrice: p.pricing.sellingPrice,
        image:        p.images?.[0] || "",
      });
      resetForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Error creating product";
      alert(message);
    } finally {
      setLoading(false);
    }
  }, [
    name, description, categoryId, sellingPrice, currency, costPrice,
    additionalCosts, hasDiscount, discountValue, discountType, discountStart,
    discountEnd, stockManaged, hasSize, sizeStockRows, stockQty, isActive,
    isBestProduct, bullets, sizes, useCustomSizeChart, sizeChart,
    allowedAddonsJson, images, resetForm,
  ]);

  /* ─────────────────────── derived ─────────────────────── */

  const totalSizedStock  = sizeStockRows.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0);
  const hasCostData      = !!(costPrice || additionalCosts.length > 0);
  const selectedCategory = categories.find((c) => c._id === categoryId);

  /* ─────────────────────── return ─────────────────────── */

  return {
    /* basic */
    name, setName,
    isActive, setIsActive,
    isBestProduct, setIsBestProduct,
    description, setDescription,
    bullets, addBullet, updateBullet, removeBullet,

    /* category */
    categories, categoryId, setCategoryId,
    categoriesLoading, selectedCategory,

    /* pricing */
    sellingPrice, setSellingPrice,
    costPrice, setCostPrice,
    currency, setCurrency,
    additionalCosts, addCostRow, updateCostRow, removeCostRow, addPresetCost,
    showCostSection, setShowCostSection,
    hasCostData,

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
    images, dragOver, setDragOver,
    addImages, removeImage, setAsCover, clearAllImages,

    /* advanced */
    showAdvanced, setShowAdvanced,
    useCustomSizeChart, setUseCustomSizeChart,
    sizeChart, setSizeChart,
    allowedAddonsJson, setAllowedAddonsJson,
    updateChartCell, updateRowLabel, addChartRow, removeChartRow,

    /* ui */
    loading, showSuccess, lastCreated,
    handleCreate,
  };
}

export type CreateProductStore = ReturnType<typeof useCreateProduct>;