"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL as string;

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
    ? Object.values(pricing.additionalCosts as Record<string, number>).reduce(
        (a, b) => a + b,
        0
      )
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
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [isActive, setIsActive] = useState("true");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [size, setSize] = useState("");
  const [hasSize, setHasSize] = useState("");
  const [loading, setLoading] = useState(false);

  const [applied, setApplied] = useState({
    q: "",
    isActive: "true",
    sort: "newest",
    minPrice: "",
    maxPrice: "",
    size: "",
    category: "",
    hasSize: "",
    page: 1,
  });

  /* ─────────────────────── fetch ─────────────────────── */

  async function loadProducts(a: typeof applied) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(a.page));
      params.set("limit", "8");
      if (a.q) params.set("q", a.q);
      if (a.category) params.set("category", a.category);
      if (a.isActive) params.set("isActive", a.isActive);
      if (a.sort) params.set("sort", a.sort);
      if (a.hasSize) params.set("hasSize", a.hasSize);
      if (a.minPrice) params.set("minPrice", a.minPrice);
      if (a.maxPrice) params.set("maxPrice", a.maxPrice);
      if (a.size) params.set("size", a.size);

      const res = await fetch(`${API}/admin/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.data || []);
      setMeta(data.meta || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts(applied);
  }, [applied]);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch(() => {});
  }, []);

  /* ─────────────────────── filter actions ─────────────────────── */

  function applyFilters() {
    setApplied({ q, isActive, sort, minPrice, maxPrice, size, category, hasSize, page: 1 });
  }

  function resetFilters() {
    const d = {
      q: "", isActive: "true", sort: "newest", minPrice: "",
      maxPrice: "", size: "", category: "", hasSize: "", page: 1,
    };
    setQ(""); setIsActive("true"); setSort("newest"); setMinPrice("");
    setMaxPrice(""); setSize(""); setCategory(""); setHasSize(""); setPage(1);
    setApplied(d);
  }

  function goToPage(p: number) {
    setPage(p);
    setApplied({ ...applied, page: p });
  }

  const hasActiveFilters = !!(
    applied.q || applied.minPrice || applied.maxPrice ||
    applied.size || applied.category || applied.hasSize ||
    applied.isActive !== "true" || applied.sort !== "newest"
  );

  const hasPendingChanges =
    q !== applied.q || isActive !== applied.isActive || sort !== applied.sort ||
    minPrice !== applied.minPrice || maxPrice !== applied.maxPrice ||
    size !== applied.size || category !== applied.category || hasSize !== applied.hasSize;

  /* ─────────────────────── shared tw classes ─────────────────────── */

  // Input / select base styles
  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] font-[var(--bw-font-body)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

  const selectBase =
    `${inputBase} cursor-pointer appearance-none pr-8 bg-no-repeat ` +
    "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22%23737373%22%20d%3D%22M4%206l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] " +
    "bg-[right_10px_center] bg-[length:16px_16px]";

  /* ═══════════════════════════════════════════════════════ */

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bw-bg)",
        color: "var(--bw-ink)",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-5 py-8">

        {/* ── Page Header ── */}
        <div className="flex items-baseline justify-between mb-7">
          <div>
            <h1
              className="text-3xl tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Products
            </h1>
            {meta && (
              <p className="mt-1 text-sm" style={{ color: "var(--bw-muted)" }}>
                {meta.total ?? products.length} product
                {(meta.total ?? products.length) !== 1 ? "s" : ""}
                {meta.totalPages > 1 && ` · Page ${meta.page} of ${meta.totalPages}`}
              </p>
            )}
          </div>
        </div>

        {/* ── Filters Panel ── */}
        <div
          className="rounded-[var(--bw-radius-xl)] p-5 mb-6 flex flex-col gap-4"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          {/* Row 1: Search + dropdowns + price */}
          <div className="flex flex-wrap gap-2.5 items-center">

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                style={{ color: "var(--bw-ghost)" }}
              >
                🔍
              </span>
              <input
                className={`${inputBase} w-full pl-9`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search products…"
              />
            </div>

            {/* Status */}
            <select className={selectBase} value={isActive} onChange={(e) => setIsActive(e.target.value)}>
              <option value="true">Active only</option>
              <option value="false">Drafts only</option>
              <option value="">All statuses</option>
            </select>

            {/* Sort */}
            <select className={selectBase} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="name_asc">Name A → Z</option>
              <option value="name_desc">Name Z → A</option>
            </select>

            {/* Category */}
            <select className={selectBase} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            {/* Sizing type */}
            <select className={selectBase} value={hasSize} onChange={(e) => setHasSize(e.target.value)}>
              <option value="">All sizing</option>
              <option value="true">Has sizes</option>
              <option value="false">No sizes (free / one-size)</option>
            </select>

            {/* Price range */}
            <div className="flex items-center gap-1.5">
              <input
                className={`${inputBase} w-24`}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min ৳"
                type="number"
                min="0"
              />
              <span className="text-sm" style={{ color: "var(--bw-ghost)" }}>–</span>
              <input
                className={`${inputBase} w-24`}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max ৳"
                type="number"
                min="0"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border transition-all duration-150 cursor-pointer"
                  style={{
                    background: "none",
                    border: "1.5px solid var(--bw-border)",
                    color: "var(--bw-muted)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bw-red)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--bw-red)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bw-border)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--bw-muted)";
                  }}
                >
                  ✕ Reset
                </button>
              )}

              <button
                type="button"
                onClick={applyFilters}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all duration-150 cursor-pointer"
                style={{
                  background: hasPendingChanges ? "var(--bw-ink)" : "var(--bw-ink)",
                  color: "var(--bw-bg)",
                  border: "none",
                  outline: "none",
                  opacity: hasPendingChanges ? 1 : 0.75,
                }}
              >
                {hasPendingChanges && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: "var(--bw-bg)",
                      animation: "bw-pulse 1.2s ease-in-out infinite",
                    }}
                  />
                )}
                {hasPendingChanges ? "Apply Filters" : "Search"}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--bw-divider)" }} />

          {/* Row 2: Size pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold tracking-widest uppercase mr-1 whitespace-nowrap"
              style={{ color: "var(--bw-ghost)" }}
            >
              Size
            </span>
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

        {/* ── Product Grid ── */}
        <div className="grid grid-cols-4 gap-4 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 xs:grid-cols-1">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} delay={i * 70} />)
          ) : products.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="text-5xl mb-4 opacity-30">📦</div>
              <p
                className="text-2xl mb-2"
                style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-muted)" }}
              >
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
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--bw-shadow-hover)";
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--bw-border-strong)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
                    (e.currentTarget as HTMLAnchorElement).style.transform = "";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--bw-border)";
                  }}
                >
                  {/* Image */}
                  <div
                    className="relative overflow-hidden"
                    style={{ background: "var(--bw-surface-alt)" }}
                  >
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-48 object-cover block transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-48 flex items-center justify-center text-4xl opacity-20"
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
                            ? { background: "rgba(22,163,74,0.9)", color: "#fff" }
                            : { background: "rgba(10,10,10,0.6)", color: "#fff" }
                        }
                      >
                        {p.isActive ? "Active" : "Draft"}
                      </span>
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
                  <div className="p-4 flex flex-col gap-1.5 flex-1">
                    {/* Category tag */}
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

                    {/* Name */}
                    <p
                      className="text-sm leading-snug tracking-tight"
                      style={{ fontFamily: "var(--bw-font-display)" }}
                    >
                      {p.name}
                    </p>

                    {/* Description */}
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

                    {/* Sizes */}
                    {p.hasSize && p.sizes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.sizes.slice(0, 5).map((s: string) => (
                          <span
                            key={s}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "var(--bw-bg-alt)",
                              color: "var(--bw-muted)",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                        {p.sizes.length > 5 && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--bw-bg-alt)", color: "var(--bw-muted)" }}
                          >
                            +{p.sizes.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Pricing block */}
                    <div
                      className="mt-2 pt-2.5 flex flex-col gap-1.5"
                      style={{ borderTop: "1px solid var(--bw-border)" }}
                    >
                      {/* Selling price */}
                      <div className="flex justify-between items-baseline">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--bw-ghost)" }}
                        >
                          Price
                        </span>
                        <span className="flex items-baseline gap-1">
                          <span
                            className="text-base font-bold tracking-tight"
                            style={{ color: "var(--bw-ink)" }}
                          >
                            {fmtPrice(ep, currency)}
                          </span>
                          {hasDiscount && (
                            <span
                              className="text-[11px] line-through"
                              style={{ color: "var(--bw-ghost)" }}
                            >
                              {fmtPrice(sp, currency)}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Cost */}
                      {cost != null && (
                        <div className="flex justify-between items-center">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--bw-ghost)" }}
                          >
                            Cost
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--bw-muted)" }}>
                            {fmtPrice(cost, currency)}
                          </span>
                        </div>
                      )}

                      {/* Margin */}
                      <div className="flex justify-between items-center">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--bw-ghost)" }}
                        >
                          Margin
                        </span>
                        <div className="flex items-center gap-1">
                          {mgn == null ? (
                            <span className="text-[11px]" style={{ color: "var(--bw-ghost)" }}>
                              — not set
                            </span>
                          ) : (
                            <>
                              <span
                                className="text-[11px] font-bold"
                                style={{ color: mgn >= 0 ? "var(--bw-green)" : "var(--bw-red)" }}
                              >
                                {mgn >= 0 ? "+" : ""}
                                {fmtPrice(mgn, currency)}
                              </span>
                              {mgnPct && (
                                <span className="text-[10px]" style={{ color: "var(--bw-ghost)" }}>
                                  ({mgnPct}%)
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className="text-[10px] truncate max-w-[120px]"
                        style={{ color: "var(--bw-ghost)", fontFamily: "var(--bw-font-mono)" }}
                      >
                        {p.slug}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--bw-ghost)", fontFamily: "var(--bw-font-mono)" }}
                      >
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
          <div className="flex items-center justify-center gap-2 mt-10">
            <PageBtn
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              label="←"
            />
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e-${i}`}
                    className="text-sm px-2"
                    style={{ color: "var(--bw-ghost)" }}
                  >
                    …
                  </span>
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
            <PageBtn
              onClick={() => goToPage(page + 1)}
              disabled={page >= meta.totalPages}
              label="→"
            />
          </div>
        )}
      </div>

      {/* Keyframe for pending dot pulse */}
      <style>{`
        @keyframes bw-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function SizePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer transition-all duration-150"
      style={
        active
          ? {
              background: "var(--bw-ink)",
              color: "var(--bw-bg)",
              border: "1.5px solid var(--bw-ink)",
            }
          : {
              background: "var(--bw-surface)",
              color: "var(--bw-muted)",
              border: "1.5px solid var(--bw-border)",
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bw-ink)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--bw-ink)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bw-border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--bw-muted)";
        }
      }}
    >
      {label}
    </button>
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="rounded-[var(--bw-radius-lg)] overflow-hidden"
      style={{
        background: "var(--bw-surface)",
        border: "1px solid var(--bw-border)",
      }}
    >
      <div
        className="w-full h-48"
        style={{
          background:
            "linear-gradient(90deg,var(--bw-surface-alt) 25%,var(--bw-border) 50%,var(--bw-surface-alt) 75%)",
          backgroundSize: "200% 100%",
          animation: `bw-shimmer 1.4s ${delay}ms infinite`,
        }}
      />
      <div className="p-4 flex flex-col gap-3">
        {[["55%", 16], ["90%", 12], ["70%", 12], ["40%", 20]].map(([w, h], i) => (
          <div
            key={i}
            className="rounded-md"
            style={{
              width: w,
              height: h,
              background:
                "linear-gradient(90deg,var(--bw-surface-alt) 25%,var(--bw-border) 50%,var(--bw-surface-alt) 75%)",
              backgroundSize: "200% 100%",
              animation: `bw-shimmer 1.4s ${delay + i * 50}ms infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bw-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function PageBtn({
  onClick,
  disabled,
  label,
  current = false,
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
      className="w-9 h-9 flex items-center justify-center rounded-[var(--bw-radius-md)] text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={
        current
          ? {
              background: "var(--bw-ink)",
              color: "var(--bw-bg)",
              border: "1.5px solid var(--bw-ink)",
            }
          : {
              background: "var(--bw-surface)",
              color: "var(--bw-muted)",
              border: "1.5px solid var(--bw-border)",
            }
      }
      onMouseEnter={(e) => {
        if (!disabled && !current) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bw-ink)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--bw-ink)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !current) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bw-border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--bw-muted)";
        }
      }}
    >
      {label}
    </button>
  );
}