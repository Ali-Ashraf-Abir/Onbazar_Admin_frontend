"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

const PRESET_SIZES = [
  "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "XXL", "Free Size",
];

/* ─────────────────────── helpers ─────────────────────── */

function effectivePrice(p: any): number {
  const sp = p.pricing?.sellingPrice ?? 0;
  const d = p.discount;
  if (!d) return sp;
  const now = Date.now();
  const started = !d.startDate || new Date(d.startDate).getTime() <= now;
  const active = !d.endDate || new Date(d.endDate).getTime() >= now;
  if (!started || !active) return sp;
  if (d.type === "percentage") return sp * (1 - d.value / 100);
  if (d.type === "fixed") return Math.max(0, sp - d.value);
  return sp;
}

function totalCost(p: any): number | null {
  const pricing = p.pricing;
  if (!pricing || pricing.costPrice == null) return null;
  const base = pricing.costPrice;
  const extras = pricing.additionalCosts
    ? Object.values(pricing.additionalCosts as Record<string, number>).reduce((a, b) => a + b, 0)
    : 0;
  return base + extras;
}

function margin(p: any): number | null {
  const cost = totalCost(p);
  if (cost == null) return null;
  return effectivePrice(p) - cost;
}

function marginPct(p: any): string | null {
  const m = margin(p);
  const ep = effectivePrice(p);
  if (m == null || ep === 0) return null;
  return ((m / ep) * 100).toFixed(1);
}

function fmtPrice(n: number, currency = "BDT") {
  const sym = currency === "BDT" ? "৳" : currency;
  return `${sym}${n.toFixed(2)}`;
}

/* ═══════════════════════════════════════════════════════ */

export default function AdminProductsPage() {
  const [products,    setProducts]    = useState<any[]>([]);
  const [category,   setCategory]    = useState("");
  const [categories, setCategories]  = useState<any[]>([]);
  const [q,          setQ]           = useState("");
  const [page,       setPage]        = useState(1);
  const [meta,       setMeta]        = useState<any>(null);
  const [isActive,   setIsActive]    = useState("true");
  const [sort,       setSort]        = useState("newest");
  const [minPrice,   setMinPrice]    = useState("");
  const [maxPrice,   setMaxPrice]    = useState("");
  const [size,       setSize]        = useState("");
  const [hasSize,    setHasSize]     = useState("");
  const [isBestProduct, setIsBestProduct] = useState("");
  const [loading,    setLoading]     = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [applied, setApplied] = useState({
    q: "", isActive: "true", sort: "newest",
    minPrice: "", maxPrice: "", size: "",
    category: "", hasSize: "", isBestProduct: "", page: 1,
  });

  /* ─────────────────────── fetch ─────────────────────── */

  async function loadProducts(a: typeof applied) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(a.page));
      params.set("limit", "8");
      if (a.q)            params.set("q",            a.q);
      if (a.category)     params.set("category",     a.category);
      if (a.isActive)     params.set("isActive",     a.isActive);
      if (a.sort)         params.set("sort",         a.sort);
      if (a.hasSize)      params.set("hasSize",      a.hasSize);
      if (a.minPrice)     params.set("minPrice",     a.minPrice);
      if (a.maxPrice)     params.set("maxPrice",     a.maxPrice);
      if (a.size)         params.set("size",         a.size);
      if (a.isBestProduct) params.set("isBestProduct", a.isBestProduct);

      const data = await api.get<any>(`/admin/products?${params.toString()}`);
      setProducts(data.data || []);
      setMeta(data.meta || null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProducts(applied); }, [applied]);

  useEffect(() => {
    api.get<any>("/categories")
      .then((d) => setCategories(d.data || []))
      .catch(() => {});
  }, []);

  /* ─────────────────────── filter actions ─────────────────────── */

  function applyFilters() {
    setApplied({ q, isActive, sort, minPrice, maxPrice, size, category, hasSize, isBestProduct, page: 1 });
    setFiltersOpen(false);
  }

  function resetFilters() {
    const d = {
      q: "", isActive: "true", sort: "newest", minPrice: "",
      maxPrice: "", size: "", category: "", hasSize: "", isBestProduct: "", page: 1,
    };
    setQ(""); setIsActive("true"); setSort("newest"); setMinPrice("");
    setMaxPrice(""); setSize(""); setCategory(""); setHasSize("");
    setIsBestProduct(""); setPage(1);
    setApplied(d);
  }

  function goToPage(p: number) {
    setPage(p);
    setApplied({ ...applied, page: p });
  }

  const hasActiveFilters = !!(
    applied.q || applied.minPrice || applied.maxPrice ||
    applied.size || applied.category || applied.hasSize ||
    applied.isBestProduct ||
    applied.isActive !== "true" || applied.sort !== "newest"
  );

  const hasPendingChanges =
    q !== applied.q || isActive !== applied.isActive || sort !== applied.sort ||
    minPrice !== applied.minPrice || maxPrice !== applied.maxPrice ||
    size !== applied.size || category !== applied.category ||
    hasSize !== applied.hasSize || isBestProduct !== applied.isBestProduct;

  /* ─────────────────────── shared tw classes ─────────────────────── */

  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] w-full " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

  const selectBase = `${inputBase} cursor-pointer appearance-none`;
  const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";

  /* ═══════════════════════════════════════════════════════ */

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bw-bg)", color: "var(--bw-ink)", fontFamily: "var(--bw-font-body)" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 py-6 sm:py-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-5 sm:mb-7 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
              Products
            </h1>
            {meta && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
                {meta.total ?? products.length} product{(meta.total ?? products.length) !== 1 ? "s" : ""}
                {meta.totalPages > 1 && ` · Page ${meta.page} of ${meta.totalPages}`}
              </p>
            )}
            <div className="mt-2">
              <a href="/admin/create" className="px-4 py-2 bg-[var(--bw-ink)] text-[var(--bw-bg)] rounded-md text-sm font-medium">
                Create Product
              </a>
            </div>
          </div>

          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen((p) => !p)}
            className="sm:hidden flex items-center gap-2 px-3.5 py-2 rounded-[var(--bw-radius-md)] text-sm font-semibold border cursor-pointer transition-all"
            style={{
              background: filtersOpen ? "var(--bw-ink)" : "var(--bw-surface)",
              color: filtersOpen ? "var(--bw-bg)" : "var(--bw-ink)",
              borderColor: filtersOpen ? "var(--bw-ink)" : "var(--bw-border)",
            }}
          >
            <span>⚙</span>
            Filters
            {hasActiveFilters && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: filtersOpen ? "var(--bw-bg)" : "var(--bw-ink)" }}
              />
            )}
          </button>
        </div>

        {/* ── Filters Panel ── */}
        <div
          className={`rounded-[var(--bw-radius-xl)] p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col gap-4 ${
            filtersOpen ? "flex" : "hidden sm:flex"
          }`}
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          {/* Search bar */}
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--bw-ghost)" }}>
              🔍
            </span>
            <input
              className={`${inputBase} pl-9`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Search products…"
            />
          </div>

          {/* Filter grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <div className="relative">
                <select className={selectBase} value={isActive} onChange={(e) => setIsActive(e.target.value)}>
                  <option value="true">Active only</option>
                  <option value="false">Drafts only</option>
                  <option value="">All statuses</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>Sort</label>
              <div className="relative">
                <select className={selectBase} value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="name_asc">Name A→Z</option>
                  <option value="name_desc">Name Z→A</option>
                  <option value="popular">Most Popular</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <div className="relative">
                <select className={selectBase} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>Sizing</label>
              <div className="relative">
                <select className={selectBase} value={hasSize} onChange={(e) => setHasSize(e.target.value)}>
                  <option value="">All sizing</option>
                  <option value="true">Has sizes</option>
                  <option value="false">One-size</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
              </div>
            </div>

            {/* ── Best Product filter ── */}
            <div>
              <label className={labelCls}>Best Product</label>
              <div className="relative">
                <select className={selectBase} value={isBestProduct} onChange={(e) => setIsBestProduct(e.target.value)}>
                  <option value="">All products</option>
                  <option value="true">⭐ Best only</option>
                  <option value="false">Non-best only</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: "var(--bw-ghost)" }}>▼</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>Min Price</label>
              <input
                className={inputBase}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="৳ 0"
                type="number" min="0"
              />
            </div>

            <div>
              <label className={labelCls}>Max Price</label>
              <input
                className={inputBase}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="৳ any"
                type="number" min="0"
              />
            </div>
          </div>

          {/* Size pills */}
          <div>
            <label className={labelCls}>Size</label>
            <div className="flex flex-wrap gap-1.5">
              <SizePill label="All" active={size === ""} onClick={() => setSize("")} />
              {PRESET_SIZES.map((s) => (
                <SizePill
                  key={s}
                  label={s}
                  active={size === s}
                  onClick={() => setSize(size === s ? "" : s)}
                />
              ))}
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "var(--bw-divider)" }}>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                style={{ background: "none", borderColor: "var(--bw-border)", color: "var(--bw-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--bw-red)"; e.currentTarget.style.color = "var(--bw-red)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bw-border)"; e.currentTarget.style.color = "var(--bw-muted)"; }}
              >
                ✕ Reset
              </button>
            )}
            <button
              type="button"
              onClick={applyFilters}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none"
              style={{
                background: "var(--bw-ink)",
                color: "var(--bw-bg)",
                opacity: hasPendingChanges ? 1 : 0.75,
              }}
            >
              {hasPendingChanges && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: "var(--bw-bg)", animation: "bw-pulse 1.2s ease-in-out infinite" }}
                />
              )}
              {hasPendingChanges ? "Apply Filters" : "Search"}
            </button>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {applied.isBestProduct === "true" && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                background: "var(--bw-bg-alt)",
                borderColor: "var(--bw-border)",
                color: "var(--bw-ink)",
              }}
            >
              ⭐ Best Products only
              <button
                type="button"
                onClick={() => {
                  setIsBestProduct("");
                  setApplied((a) => ({ ...a, isBestProduct: "", page: 1 }));
                }}
                className="text-[10px] cursor-pointer border-none bg-transparent leading-none"
                style={{ color: "var(--bw-ghost)" }}
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {/* ── Product Grid ── */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} delay={i * 70} />)
          ) : products.length === 0 ? (
            <div className="col-span-full py-16 sm:py-20 text-center">
              <div className="text-5xl mb-4 opacity-30">📦</div>
              <p className="text-xl sm:text-2xl mb-2" style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-muted)" }}>
                No products found
              </p>
              <p className="text-sm" style={{ color: "var(--bw-ghost)" }}>
                Try adjusting your filters or create a new product.
              </p>
            </div>
          ) : (
            products.map((p: any) => {
              const sp = p.pricing?.sellingPrice ?? 0;
              const currency = p.pricing?.currency ?? "BDT";
              const ep = effectivePrice(p);
              const cost = totalCost(p);
              const mgn = margin(p);
              const mgnPct = marginPct(p);
              const hasDiscount = p.discount && ep < sp;

              return (
                <a
                  key={p._id}
                  href={`/admin/products/${p._id}`}
                  className="group flex flex-col rounded-[var(--bw-radius-lg)] overflow-hidden no-underline transition-all duration-200"
                  style={{
                    background: "var(--bw-surface)",
                    border: "1px solid var(--bw-border)",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "var(--bw-shadow-hover)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "var(--bw-border-strong)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.borderColor = "var(--bw-border)";
                  }}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ background: "var(--bw-surface-alt)" }}>
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-40 sm:h-48 object-cover block transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-40 sm:h-48 flex items-center justify-center text-4xl opacity-20"
                        style={{ color: "var(--bw-ghost)" }}
                      >
                        📷
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                      <span
                        className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
                        style={
                          p.isActive
                            ? { background: "rgba(22,163,74,0.9)",  color: "#fff" }
                            : { background: "rgba(10,10,10,0.6)",   color: "#fff" }
                        }
                      >
                        {p.isActive ? "Active" : "Draft"}
                      </span>

                      {/* ── Best Product badge ── */}
                      {p.isBestProduct && (
                        <span
                          className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(234,179,8,0.92)", color: "#713f12" }}
                        >
                          ⭐ Best
                        </span>
                      )}

                      {!p.hasSize && (
                        <span
                          className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(79,70,229,0.85)", color: "#fff" }}
                        >
                          No Size
                        </span>
                      )}
                      {hasDiscount && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(220,38,38,0.88)", color: "#fff" }}
                        >
                          {p.discount.type === "percentage"
                            ? `${p.discount.value}% OFF`
                            : `${fmtPrice(p.discount.value, currency)} OFF`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
                    {p.category?.name && (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block w-fit"
                        style={{
                          color: "var(--bw-ink-secondary)",
                          background: "var(--bw-surface-alt)",
                          border: "1px solid var(--bw-border)",
                        }}
                      >
                        {p.category.name}
                      </span>
                    )}

                    <p className="text-sm leading-snug tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
                      {p.name}
                    </p>

                    {p.details?.description && (
                      <p
                        className="text-[11px] leading-relaxed mt-0.5 flex-1"
                        style={{
                          color: "var(--bw-muted)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {p.details.description}
                      </p>
                    )}

                    {p.hasSize && p.sizes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.sizes.slice(0, 4).map((s: string) => (
                          <span
                            key={s}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--bw-bg-alt)", color: "var(--bw-muted)" }}
                          >
                            {s}
                          </span>
                        ))}
                        {p.sizes.length > 4 && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--bw-bg-alt)", color: "var(--bw-muted)" }}
                          >
                            +{p.sizes.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Pricing block */}
                    <div className="mt-2 pt-2.5 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--bw-border)" }}>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>
                          Price
                        </span>
                        <span className="flex items-baseline gap-1">
                          <span className="text-base font-bold tracking-tight" style={{ color: "var(--bw-ink)" }}>
                            {fmtPrice(ep, currency)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] line-through" style={{ color: "var(--bw-ghost)" }}>
                              {fmtPrice(sp, currency)}
                            </span>
                          )}
                        </span>
                      </div>

                      {cost != null && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>Cost</span>
                          <span className="text-[11px]" style={{ color: "var(--bw-muted)" }}>{fmtPrice(cost, currency)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>Margin</span>
                        <div className="flex items-center gap-1">
                          {mgn == null ? (
                            <span className="text-[11px]" style={{ color: "var(--bw-ghost)" }}>— not set</span>
                          ) : (
                            <>
                              <span className="text-[11px] font-bold" style={{ color: mgn >= 0 ? "var(--bw-green)" : "var(--bw-red)" }}>
                                {mgn >= 0 ? "+" : ""}{fmtPrice(mgn, currency)}
                              </span>
                              {mgnPct && (
                                <span className="text-[10px]" style={{ color: "var(--bw-ghost)" }}>({mgnPct}%)</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Purchase count */}
                      {p.purchaseCount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>Sold</span>
                          <span className="text-[11px] font-semibold" style={{ color: "var(--bw-muted)" }}>
                            {p.purchaseCount} unit{p.purchaseCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className="text-[10px] truncate max-w-[100px] sm:max-w-[120px]"
                        style={{ color: "var(--bw-ghost)", fontFamily: "var(--bw-font-mono)" }}
                      >
                        {p.slug}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--bw-ghost)", fontFamily: "var(--bw-font-mono)" }}>
                        {p._id.slice(-6)}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* ── Pagination ── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-8 sm:mt-10 flex-wrap">
            <PageBtn onClick={() => goToPage(page - 1)} disabled={page <= 1} label="←" />
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="text-sm px-2" style={{ color: "var(--bw-ghost)" }}>…</span>
                ) : (
                  <PageBtn
                    key={p}
                    onClick={() => goToPage(p as number)}
                    disabled={false}
                    label={String(p)}
                    current={p === page}
                  />
                )
              )}
            <PageBtn onClick={() => goToPage(page + 1)} disabled={page >= meta.totalPages} label="→" />
          </div>
        )}
      </div>

      <style>{`
        @keyframes bw-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes bw-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function SizePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full border cursor-pointer transition-all duration-150"
      style={
        active
          ? { background: "var(--bw-ink)", color: "var(--bw-bg)", border: "1.5px solid var(--bw-ink)" }
          : { background: "var(--bw-surface)", color: "var(--bw-muted)", border: "1.5px solid var(--bw-border)" }
      }
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--bw-ink)"; e.currentTarget.style.color = "var(--bw-ink)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--bw-border)"; e.currentTarget.style.color = "var(--bw-muted)"; } }}
    >
      {label}
    </button>
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  const shimmer = "linear-gradient(90deg,var(--bw-surface-alt) 25%,var(--bw-border) 50%,var(--bw-surface-alt) 75%)";
  return (
    <div className="rounded-[var(--bw-radius-lg)] overflow-hidden" style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}>
      <div className="w-full h-40 sm:h-48" style={{ background: shimmer, backgroundSize: "200% 100%", animation: `bw-shimmer 1.4s ${delay}ms infinite` }} />
      <div className="p-3 sm:p-4 flex flex-col gap-3">
        {[["55%", 16], ["90%", 12], ["70%", 12], ["40%", 20]].map(([w, h], i) => (
          <div key={i} className="rounded-md" style={{ width: w, height: h, background: shimmer, backgroundSize: "200% 100%", animation: `bw-shimmer 1.4s ${delay + i * 50}ms infinite` }} />
        ))}
      </div>
    </div>
  );
}

function PageBtn({ onClick, disabled, label, current = false }: { onClick: () => void; disabled: boolean; label: string; current?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-[var(--bw-radius-md)] text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={
        current
          ? { background: "var(--bw-ink)", color: "var(--bw-bg)", border: "1.5px solid var(--bw-ink)" }
          : { background: "var(--bw-surface)", color: "var(--bw-muted)", border: "1.5px solid var(--bw-border)" }
      }
      onMouseEnter={(e) => { if (!disabled && !current) { e.currentTarget.style.borderColor = "var(--bw-ink)"; e.currentTarget.style.color = "var(--bw-ink)"; } }}
      onMouseLeave={(e) => { if (!disabled && !current) { e.currentTarget.style.borderColor = "var(--bw-border)"; e.currentTarget.style.color = "var(--bw-muted)"; } }}
    >
      {label}
    </button>
  );
}