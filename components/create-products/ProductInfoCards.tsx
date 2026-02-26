"use client";

import React from "react";
import {
  inputCls, labelCls, cardCls, cardHeaderCls, cardTitleCls,
  BwToggle, StockPill, AddRowBtn,
} from "./Ui";
import { PRESET_SIZES, CreateProductStore } from "./useCreateProduct";

/* ─────────────────────── Basic Info Card ─────────────────────── */

export function BasicInfoCard({
  name, setName,
  isActive, setIsActive,
  isBestProduct, setIsBestProduct,
  categories, categoryId, setCategoryId,
  categoriesLoading, selectedCategory,
}: Pick<CreateProductStore,
  | "name" | "setName"
  | "isActive" | "setIsActive"
  | "isBestProduct" | "setIsBestProduct"
  | "categories" | "categoryId" | "setCategoryId"
  | "categoriesLoading" | "selectedCategory"
>) {
  return (
    <div className={cardCls}>
      <div className={cardHeaderCls}>
        <div className={cardTitleCls}><span>📦</span> Basic Info</div>
      </div>
      <div className="p-5 flex flex-col gap-4">

        <div>
          <label className={labelCls}>
            Product Name <span style={{ color: "var(--bw-red)" }}>*</span>
          </label>
          <input
            className={inputCls}
            placeholder="e.g. Box Fit Heavyweight Tee"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>
            Category <span style={{ color: "var(--bw-red)" }}>*</span>
          </label>
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
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
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
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {selectedCategory.name}
                    <span style={{ color: "var(--bw-ghost)", fontWeight: 400 }}>· {selectedCategory.slug}</span>
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Visibility & Badging toggles ── */}
        <div className="flex flex-col gap-3">
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

          <BwToggle
            checked={isBestProduct}
            onChange={setIsBestProduct}
            label={
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ background: isBestProduct ? "var(--bw-amber, #f59e0b)" : "var(--bw-ghost)" }}
                />
                {isBestProduct ? "Best Product — Featured badge on" : "Best Product — No badge"}
              </span>
            }
            desc="Mark to surface this product in Best Sellers sections"
          />
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────── Description Card ─────────────────────── */

export function DescriptionCard({
  description, setDescription,
}: Pick<CreateProductStore, "description" | "setDescription">) {
  return (
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
  );
}

/* ─────────────────────── Key Features Card ─────────────────────── */

export function KeyFeaturesCard({
  bullets, addBullet, updateBullet, removeBullet,
}: Pick<CreateProductStore, "bullets" | "addBullet" | "updateBullet" | "removeBullet">) {
  return (
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
  );
}

/* ─────────────────────── Sizing Card ─────────────────────── */

export function SizingCard({
  hasSize, setHasSize,
  sizes,
  sizeDropOpen, setSizeDropOpen,
  customSizeInput, setCustomSizeInput,
  sizeDropRef, sizeTriggerRef,
  toggleSize, addCustomSize, removeSize,
}: Pick<CreateProductStore,
  | "hasSize" | "setHasSize"
  | "sizes"
  | "sizeDropOpen" | "setSizeDropOpen"
  | "customSizeInput" | "setCustomSizeInput"
  | "sizeDropRef" | "sizeTriggerRef"
  | "toggleSize" | "addCustomSize" | "removeSize"
>) {
  return (
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
  );
}

/* ─────────────────────── Stock Card ─────────────────────── */

export function StockCard({
  stockManaged, setStockManaged,
  hasSize,
  sizes,
  stockQty, setStockQty,
  sizeStockRows, setSizeStockRows,
  updateSizeStock,
  totalSizedStock,
}: Pick<CreateProductStore,
  | "stockManaged" | "setStockManaged"
  | "hasSize"
  | "sizes"
  | "stockQty" | "setStockQty"
  | "sizeStockRows" | "setSizeStockRows"
  | "updateSizeStock"
  | "totalSizedStock"
>) {
  return (
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
            {/* Unsized product */}
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
                  {stockQty !== "" && <StockPill inStock={parseInt(stockQty) > 0} />}
                </div>
              </div>
            )}

            {/* Sized product */}
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
                        const qty    = parseInt(row.qty);
                        const filled = row.qty !== "";
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
                                <StockPill inStock={qty > 0} compact />
                              ) : (
                                <span className="text-xs" style={{ color: "var(--bw-ghost)" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

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
  );
}