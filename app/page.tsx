"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL as string;

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "XXL", "Free Size"];

export default function Home() {
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
  const [loading, setLoading] = useState(false);

  const [applied, setApplied] = useState({
    q: "", isActive: "true", sort: "newest",
    minPrice: "", maxPrice: "", size: "", category: "", page: 1,
  });

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
      if (a.minPrice) params.set("minPrice", String(Math.round(Number(a.minPrice) * 100)));
      if (a.maxPrice) params.set("maxPrice", String(Math.round(Number(a.maxPrice) * 100)));
      if (a.size) params.set("size", a.size);
      const res = await fetch(`${API}/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.data || []);
      setMeta(data.meta || null);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadProducts(applied); }, [applied]);
  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch(() => { });
  }, []);

  function applyFilters() {
    setApplied({ q, isActive, sort, minPrice, maxPrice, size, category, page: 1 });
  }
  function resetFilters() {
    const d = { q: "", isActive: "true", sort: "newest", minPrice: "", maxPrice: "", size: "", category: "", page: 1 };
    setQ(""); setIsActive("true"); setSort("newest"); setMinPrice(""); setMaxPrice(""); setSize(""); setCategory(""); setPage(1);
    setApplied(d);
  }
  function goToPage(p: number) { setPage(p); setApplied({ ...applied, page: p }); }

  const hasActiveFilters = !!(
    applied.q || applied.minPrice || applied.maxPrice ||
    applied.size || applied.category ||
    applied.isActive !== "true" || applied.sort !== "newest"
  );

  const hasPendingChanges =
    q !== applied.q || isActive !== applied.isActive || sort !== applied.sort ||
    minPrice !== applied.minPrice || maxPrice !== applied.maxPrice ||
    size !== applied.size || category !== applied.category;

  return (
    <>
      <style>{`
        .hp-filters { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 18px 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 14px; }
        .hp-filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .hp-filter-divider { height: 1px; background: var(--color-divider); }
        .hp-filter-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }

        .hp-search-wrap { position: relative; flex: 1; min-width: 180px; }
        .hp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-ghost); font-size: 14px; pointer-events: none; }
        .hp-search { width: 100%; background: var(--color-input-bg); border: 1.5px solid transparent; border-radius: var(--radius-md); padding: 10px 14px 10px 36px; font-family: var(--font-body); font-size: 14px; color: var(--color-ink); outline: none; transition: all 0.2s; }
        .hp-search::placeholder { color: var(--color-ghost); }
        .hp-search:focus { border-color: var(--color-accent); background: var(--color-input-focus); }

        .hp-price-group { display: flex; align-items: center; gap: 6px; }
        .hp-price-input { width: 100px; background: var(--color-input-bg); border: 1.5px solid transparent; border-radius: var(--radius-md); padding: 10px 12px; font-family: var(--font-body); font-size: 13px; color: var(--color-ink); outline: none; transition: all 0.2s; }
        .hp-price-input::placeholder { color: var(--color-ghost); }
        .hp-price-input:focus { border-color: var(--color-accent); background: var(--color-input-focus); }
        .hp-price-sep { color: var(--color-ghost); font-size: 13px; }

        .hp-size-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .hp-size-label { font-size: 11px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: var(--color-subtle); margin-right: 4px; white-space: nowrap; }
        .hp-size-pill { padding: 5px 12px; border-radius: var(--radius-pill); font-family: var(--font-body); font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--color-border); background: var(--color-surface); color: var(--color-muted); transition: all 0.15s; }
        .hp-size-pill:hover { border-color: var(--color-ink); color: var(--color-ink); }
        .hp-size-pill--active { background: var(--color-ink); color: var(--color-header-text); border-color: var(--color-ink); }

        .hp-btn-reset { display: flex; align-items: center; gap: 5px; padding: 8px 14px; background: none; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-subtle); cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .hp-btn-reset:hover { border-color: var(--color-red); color: var(--color-red); }
        .hp-btn-apply { display: flex; align-items: center; gap: 6px; padding: 9px 20px; background: var(--color-ink); color: var(--color-header-text); border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.1s; white-space: nowrap; }
        .hp-btn-apply:hover { background: var(--color-ink-hover); transform: translateY(-1px); }
        .hp-btn-apply--pending { background: var(--color-accent); color: var(--color-ink); }
        .hp-btn-apply--pending:hover { background: var(--color-accent-hover); }
        .hp-pending-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-ink); animation: hp-pulse 1.2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes hp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .hp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1024px) { .hp-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 720px)  { .hp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .hp-grid { grid-template-columns: 1fr; } }

        .hp-card { background: var(--color-surface); border-radius: 14px; border: 1px solid var(--color-border); overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: box-shadow 0.2s, transform 0.2s; }
        .hp-card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
        .hp-card-img-wrap { position: relative; overflow: hidden; background: var(--color-surface-alt); }
        .hp-card-img { width: 100%; height: 200px; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .hp-card:hover .hp-card-img { transform: scale(1.04); }
        .hp-card-img-placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 36px; opacity: 0.3; }
        .hp-card-status { position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.4px; padding: 3px 8px; border-radius: var(--radius-pill); }
        .hp-card-status--active { background: rgba(44,107,79,0.9); color: white; }
        .hp-card-status--draft { background: rgba(26,24,20,0.55); color: var(--color-header-text); }
        .hp-card-body { padding: 14px 16px 16px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .hp-card-name { font-family: var(--font-display); font-size: 15px; letter-spacing: -0.2px; line-height: 1.3; }
        .hp-card-desc { font-size: 12px; color: var(--color-subtle); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
        .hp-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .hp-card-price { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
        .hp-card-price span { font-size: 12px; color: var(--color-subtle); font-weight: 400; margin-right: 1px; }
        .hp-card-slug { font-size: 10px; color: var(--color-ghost); font-family: monospace; }
        .hp-card-sizes { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
        .hp-card-size-chip { font-size: 10px; font-weight: 600; padding: 2px 7px; background: var(--color-bg); border-radius: var(--radius-pill); color: var(--color-muted); }

        .hp-empty { grid-column: 1 / -1; padding: 64px 20px; text-align: center; }
        .hp-empty-icon { font-size: 48px; opacity: 0.3; margin-bottom: 12px; }
        .hp-empty-title { font-family: var(--font-display); font-size: 22px; color: var(--color-muted); margin-bottom: 6px; }
        .hp-empty-sub { font-size: 14px; color: var(--color-ghost); }

        .hp-skeleton { background: var(--color-surface); border-radius: 14px; border: 1px solid var(--color-border); overflow: hidden; }
        .hp-skel-img { width: 100%; height: 200px; background: linear-gradient(90deg, var(--color-surface-alt) 25%, var(--color-border) 50%, var(--color-surface-alt) 75%); background-size: 200% 100%; animation: hp-shimmer 1.4s infinite; }
        .hp-skel-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; }
        .hp-skel-line { border-radius: 6px; background: linear-gradient(90deg, var(--color-surface-alt) 25%, var(--color-border) 50%, var(--color-surface-alt) 75%); background-size: 200% 100%; animation: hp-shimmer 1.4s infinite; }
        @keyframes hp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .hp-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 40px; }
        .hp-page-btn { width: 38px; height: 38px; border-radius: var(--radius-md); border: 1.5px solid var(--color-border); background: var(--color-surface); font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--color-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .hp-page-btn:hover:not(:disabled) { border-color: var(--color-ink); color: var(--color-ink); }
        .hp-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .hp-page-btn--current { background: var(--color-ink); color: var(--color-header-text); border-color: var(--color-ink); }
        .hp-page-info { font-size: 13px; color: var(--color-subtle); padding: 0 8px; }
      `}</style>

      <div style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)", minHeight: "100vh", color: "var(--color-ink)" }}>
        <header className="as-header flex items-center justify-between">
          <span className="as-header-brand">Admin Studio</span>

          <div className="flex items-center gap-6 px-4">
            <a href="/create" className="as-btn-accent inline-flex">+ New Product</a>
            <a href="/categories" className="as-btn-accent inline-flex">+ New Category</a>
          </div>
        </header>


        <div className="as-body as-body--wide">
          <div className="as-title-row">
            <h1 className="as-title">Products</h1>
            {meta && (
              <p className="as-title-sub">
                {meta.total ?? products.length} product{(meta.total ?? products.length) !== 1 ? "s" : ""}
                {meta.totalPages > 1 && ` · Page ${meta.page} of ${meta.totalPages}`}
              </p>
            )}
          </div>

          <div className="hp-filters">
            <div className="hp-filter-row">
              <div className="hp-search-wrap">
                <span className="hp-search-icon">🔍</span>
                <input className="hp-search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()} placeholder="Search products…" />
              </div>
              <select className="as-select" value={isActive} onChange={(e) => setIsActive(e.target.value)}>
                <option value="true">Active only</option>
                <option value="false">Drafts only</option>
                <option value="">All statuses</option>
              </select>
              <select className="as-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name_asc">Name A → Z</option>
                <option value="name_desc">Name Z → A</option>
              </select>
              <select
                className="as-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <div className="hp-price-group">
                <input className="hp-price-input" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min ৳" type="number" min="0" />
                <span className="hp-price-sep">–</span>
                <input className="hp-price-input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max ৳" type="number" min="0" />
              </div>
              <div className="hp-filter-actions">
                {hasActiveFilters && <button type="button" className="hp-btn-reset" onClick={resetFilters}>✕ Reset</button>}
                <button type="button" className={`hp-btn-apply ${hasPendingChanges ? "hp-btn-apply--pending" : ""}`} onClick={applyFilters}>
                  {hasPendingChanges && <span className="hp-pending-dot" />}
                  {hasPendingChanges ? "Apply Filters" : "Search"}
                </button>
              </div>
            </div>

            <div className="hp-filter-divider" />

            <div className="hp-size-row">
              <span className="hp-size-label">Size</span>
              <button type="button" className={`hp-size-pill ${size === "" ? "hp-size-pill--active" : ""}`} onClick={() => setSize("")}>All</button>
              {PRESET_SIZES.map((s) => (
                <button key={s} type="button" className={`hp-size-pill ${size === s ? "hp-size-pill--active" : ""}`} onClick={() => setSize(size === s ? "" : s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="hp-grid">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="hp-skeleton">
                  <div className="hp-skel-img" style={{ animationDelay: `${i * 0.07}s` }} />
                  <div className="hp-skel-body">
                    <div className="hp-skel-line" style={{ height: 18, width: "70%" }} />
                    <div className="hp-skel-line" style={{ height: 12, width: "90%" }} />
                    <div className="hp-skel-line" style={{ height: 12, width: "60%" }} />
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="hp-empty">
                <div className="hp-empty-icon">📦</div>
                <p className="hp-empty-title">No products found</p>
                <p className="hp-empty-sub">Try adjusting your filters or create a new product.</p>
              </div>
            ) : (
              products.map((p: any) => (
                <a key={p._id} href={`/products/${p._id}`} className="hp-card">
                  <div className="hp-card-img-wrap">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="hp-card-img" /> : <div className="hp-card-img-placeholder">📷</div>}
                    <span className={`hp-card-status ${p.isActive ? "hp-card-status--active" : "hp-card-status--draft"}`}>{p.isActive ? "Active" : "Draft"}</span>
                  </div>
                  <div className="hp-card-body">
                    <p className="hp-card-name">{p.name}</p>
                    {p.details?.description && <p className="hp-card-desc">{p.details.description}</p>}
                    {p.sizes?.length > 0 && (
                      <div className="hp-card-sizes">
                        {p.sizes.slice(0, 5).map((s: string) => <span key={s} className="hp-card-size-chip">{s}</span>)}
                        {p.sizes.length > 5 && <span className="hp-card-size-chip">+{p.sizes.length - 5}</span>}
                      </div>
                    )}
                    <div className="hp-card-footer">
                      <p className="hp-card-price"><span>৳</span>{(p.price / 100).toFixed(2)}</p>
                      <p className="hp-card-slug">{p.slug}</p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="hp-pagination">
              <button className="hp-page-btn" disabled={page <= 1} onClick={() => goToPage(page - 1)}>←</button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, [])
                .map((p, i) => p === "..." ? <span key={`e-${i}`} className="hp-page-info">…</span> : <button key={p} className={`hp-page-btn ${p === page ? "hp-page-btn--current" : ""}`} onClick={() => goToPage(p as number)}>{p}</button>)}
              <button className="hp-page-btn" disabled={page >= meta.totalPages} onClick={() => goToPage(page + 1)}>→</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}