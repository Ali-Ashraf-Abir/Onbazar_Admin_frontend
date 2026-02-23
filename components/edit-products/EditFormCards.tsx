"use client";

import React from "react";
import { SIZE_CHART_PRESETS, SizeChartRow, buildDefaultChart } from "../../constants/sizeChart";
import {
  inputCls, labelCls, cardCls, cardHeaderCls, cardTitleCls,
  computeProfit, BwToggle, CurrencySelect, AddRowBtn,
  CostEntry,
} from "../create-products/Ui";
import { COMMON_COST_KEYS, EditProductStore } from "./useEditProduct";

/* ─────────────────────── Current Images Card ─────────────────────── */

export function ImagesCard({
  product, settingCover, removeImage, setCoverImage,
}: Pick<EditProductStore, "product" | "settingCover" | "removeImage" | "setCoverImage">) {
  if (!product) return null;

  return (
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
            {product.images.map((img, idx) => (
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
  );
}

/* ─────────────────────── Upload Images Card ─────────────────────── */

export function UploadCard({
  imageMode, setImageMode,
  newFiles, setNewFiles,
  dragOver, setDragOver,
}: Pick<EditProductStore,
  | "imageMode" | "setImageMode"
  | "newFiles" | "setNewFiles"
  | "dragOver" | "setDragOver"
>) {
  return (
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
          <p className="text-sm font-medium" style={{ color: "var(--bw-ink-secondary)" }}>
            Click or drag images here
          </p>
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
  );
}

/* ─────────────────────── Pricing Card ─────────────────────── */

export function PricingCard({
  sellingPrice, setSellingPrice,
  currency, setCurrency,
  hasDiscount, setHasDiscount,
  discountType, setDiscountType,
  discountValue, setDiscountValue,
  discountStart, setDiscountStart,
  discountEnd, setDiscountEnd,
  showCostSection, setShowCostSection,
  costPrice, setCostPrice,
  additionalCosts, addCostRow, updateCostRow, removeCostRow, addPresetCost,
  hasCostData,
}: Pick<EditProductStore,
  | "sellingPrice" | "setSellingPrice"
  | "currency" | "setCurrency"
  | "hasDiscount" | "setHasDiscount"
  | "discountType" | "setDiscountType"
  | "discountValue" | "setDiscountValue"
  | "discountStart" | "setDiscountStart"
  | "discountEnd" | "setDiscountEnd"
  | "showCostSection" | "setShowCostSection"
  | "costPrice" | "setCostPrice"
  | "additionalCosts" | "addCostRow" | "updateCostRow" | "removeCostRow" | "addPresetCost"
  | "hasCostData"
>) {
  const profit = computeProfit(sellingPrice, costPrice, additionalCosts);

  return (
    <div className={cardCls}>
      <div className={cardHeaderCls}>
        <div className={cardTitleCls}><span>💰</span> Pricing</div>
      </div>
      <div className="p-5 flex flex-col gap-4">

        {/* Selling price */}
        <div>
          <label className={labelCls}>
            Selling Price <span style={{ color: "var(--bw-red)" }}>*</span>
          </label>
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

        {/* Discount */}
        <BwToggle
          checked={hasDiscount}
          onChange={setHasDiscount}
          label="Discount"
          desc="Apply a percentage or fixed price reduction"
        />

        {hasDiscount && (
          <DiscountSection
            currency={currency}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            discountStart={discountStart}
            setDiscountStart={setDiscountStart}
            discountEnd={discountEnd}
            setDiscountEnd={setDiscountEnd}
            sellingPrice={sellingPrice}
          />
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
          <CostSection
            currency={currency}
            costPrice={costPrice}
            setCostPrice={setCostPrice}
            additionalCosts={additionalCosts}
            addCostRow={addCostRow}
            updateCostRow={updateCostRow}
            removeCostRow={removeCostRow}
            addPresetCost={addPresetCost}
            hasCostData={hasCostData}
            sellingPrice={sellingPrice}
            profit={profit}
          />
        )}
      </div>
    </div>
  );
}

/* ── Discount sub-section ── */

function DiscountSection({
  currency, discountType, setDiscountType,
  discountValue, setDiscountValue,
  discountStart, setDiscountStart,
  discountEnd, setDiscountEnd,
  sellingPrice,
}: {
  currency: string;
  discountType: "percentage" | "fixed";
  setDiscountType: (t: "percentage" | "fixed") => void;
  discountValue: string;
  setDiscountValue: (v: string) => void;
  discountStart: string;
  setDiscountStart: (v: string) => void;
  discountEnd: string;
  setDiscountEnd: (v: string) => void;
  sellingPrice: string;
}) {
  return (
    <div
      className="p-4 rounded-[var(--bw-radius-md)] flex flex-col gap-3"
      style={{ background: "var(--bw-surface-alt)", border: "1.5px solid var(--bw-border)" }}
    >
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
  );
}

/* ── Cost sub-section ── */

function CostSection({
  currency, costPrice, setCostPrice,
  additionalCosts, addCostRow, updateCostRow, removeCostRow, addPresetCost,
  hasCostData, sellingPrice, profit,
}: {
  currency: string;
  costPrice: string;
  setCostPrice: (v: string) => void;
  additionalCosts: CostEntry[];
  addCostRow: () => void;
  updateCostRow: (id: string, field: "key" | "label" | "value", val: string) => void;
  removeCostRow: (id: string) => void;
  addPresetCost: (key: string, label: string) => void;
  hasCostData: boolean;
  sellingPrice: string;
  profit: ReturnType<typeof computeProfit>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelCls}>
          Cost Price{" "}
          <span className="normal-case font-normal" style={{ color: "var(--bw-ghost)" }}>(product cost)</span>
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
                  background: "var(--bw-input-bg)",
                  color: "var(--bw-muted)",
                  opacity: used ? 0.4 : 1,
                  cursor: used ? "not-allowed" : "pointer",
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
                        const k = e.target.value.trim()
                          .replace(/\s+(.)/g, (_, ch) => ch.toUpperCase())
                          .replace(/\s/g, "");
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
                    <button
                      type="button"
                      onClick={() => removeCostRow(c.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-xs border-none cursor-pointer"
                      style={{ background: "var(--bw-surface-alt)", color: "var(--bw-muted)" }}
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AddRowBtn onClick={addCostRow}>+ Add custom cost</AddRowBtn>
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
                color: profit.margin > 0
                  ? "var(--bw-green)"
                  : profit.margin < 0
                  ? "var(--bw-red)"
                  : "var(--bw-ghost)",
              }}
            >
              {profit.margin > 0 ? "+" : ""}{profit.margin.toFixed(2)}
              {profit.sp > 0 && (
                <span className="text-xs font-medium opacity-60 ml-1.5">({profit.pct}%)</span>
              )}
            </span>
          </div>
          <div className="border-t" style={{ borderColor: "var(--bw-border)" }}>
            {[
              { label: "Selling Price", val: `${profit.sp.toFixed(2)}`, strong: false },
              ...(profit.cp > 0 ? [{ label: "Cost Price", val: `− ${profit.cp.toFixed(2)}`, strong: false }] : []),
              ...additionalCosts.filter((c) => parseFloat(c.value) > 0).map((c) => ({
                label: c.label || c.key,
                val: `− ${parseFloat(c.value).toFixed(2)}`,
                strong: false,
              })),
              { label: "Total Cost", val: `− ${profit.total.toFixed(2)}`, strong: true },
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
                  {currency} {row.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Size Chart Card ─────────────────────── */

export function SizeChartCard({
  showSizeChart, setShowSizeChart,
  useCustomSizeChart, setUseCustomSizeChart,
  sizeChart, setSizeChart,
  sizes,
  updateChartCell, updateRowLabel, addChartRow, removeChartRow,
  resetSizeChartToDefault,
}: Pick<EditProductStore,
  | "showSizeChart" | "setShowSizeChart"
  | "useCustomSizeChart" | "setUseCustomSizeChart"
  | "sizeChart" | "setSizeChart"
  | "sizes"
  | "updateChartCell" | "updateRowLabel" | "addChartRow" | "removeChartRow"
  | "resetSizeChartToDefault"
>) {
  return (
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
            <span className="text-[11px] font-normal" style={{ color: "var(--bw-ghost)" }}>
              ({sizeChart.unit})
            </span>
          )}
        </span>
        <span
          className="text-xs transition-transform duration-200"
          style={{
            color: "var(--bw-ghost)",
            display: "inline-block",
            transform: showSizeChart ? "rotate(180deg)" : "none",
          }}
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
                        onClick={() => {
                          if (confirm(`Load "${key}" preset?`))
                            setSizeChart(buildDefaultChart(sizes, key));
                        }}
                        className="px-3 py-1 rounded-md text-xs font-semibold capitalize border cursor-pointer"
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--bw-muted)" }}>
                    Measurements ({sizeChart.unit})
                  </span>
                  <div className="flex rounded-md overflow-hidden border" style={{ borderColor: "var(--bw-border)" }}>
                    {(["inches", "cm"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setSizeChart((p:any) => ({ ...p, unit: u }))}
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
                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1" style={{ color: "var(--bw-ghost)" }}>
                          Measurement
                        </th>
                        {sizeChart.columns.map((col:any, ci:any) => (
                          <th key={ci} className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1" style={{ color: "var(--bw-ghost)" }}>
                            {col}
                          </th>
                        ))}
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {sizeChart.rows.map((row: SizeChartRow, ri: number) => (
                        <tr key={ri}>
                          <td className="px-1 py-1">
                            <input
                              className={inputCls}
                              value={row.label}
                              onChange={(e) => updateRowLabel(ri, e.target.value)}
                              placeholder="e.g. Chest"
                            />
                          </td>
                          {row.values.map((val, ci) => (
                            <td key={ci} className="px-1 py-1">
                              <input
                                className={inputCls}
                                type="number" min="0" step="0.5"
                                value={val}
                                onChange={(e) => updateChartCell(ri, ci, e.target.value)}
                                placeholder="–"
                              />
                            </td>
                          ))}
                          <td className="px-1 py-1">
                            <button
                              type="button"
                              onClick={() => removeChartRow(ri)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-xs border-none cursor-pointer"
                              style={{ background: "var(--bw-surface-alt)", color: "var(--bw-muted)" }}
                            >✕</button>
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
                    style={{ background: "transparent", borderColor: "var(--bw-border)", color: "var(--bw-red)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background  = "var(--bw-red-bg)";
                      e.currentTarget.style.borderColor = "var(--bw-red)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background  = "transparent";
                      e.currentTarget.style.borderColor = "var(--bw-border)";
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
  );
}