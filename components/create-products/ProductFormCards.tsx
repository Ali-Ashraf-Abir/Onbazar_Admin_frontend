"use client";

import React from "react";
import { SIZE_CHART_PRESETS, buildDefaultChart } from "../../constants/sizeChart";
import {
  inputCls, labelCls, cardCls, cardHeaderCls, cardTitleCls, sectionDividerCls,
  computeProfit,
  BwToggle, CurrencySelect, AddRowBtn,
  CostEntry,
} from "./Ui";
import { COMMON_COST_KEYS, CreateProductStore } from "./useCreateProduct";

/* ─────────────────────── Images Card ─────────────────────── */

export function ImagesCard({
  images, dragOver, setDragOver, addImages, removeImage, setAsCover, clearAllImages,
}: Pick<CreateProductStore,
  "images" | "dragOver" | "setDragOver" | "addImages" | "removeImage" | "setAsCover" | "clearAllImages"
>) {
  return (
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
              onClick={clearAllImages}
              className="mt-3 text-xs underline bg-transparent border-none cursor-pointer"
              style={{ color: "var(--bw-ghost)" }}
            >
              Clear all
            </button>
          </>
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
}: Pick<CreateProductStore,
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
          label="Add Discount"
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
      {/* Type tabs */}
      <div className="flex rounded-[var(--bw-radius-md)] overflow-hidden border" style={{ borderColor: "var(--bw-border)" }}>
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
                  background: "var(--bw-input-bg)",
                  color: used ? "var(--bw-ghost)" : "var(--bw-muted)",
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
  );
}

/* ─────────────────────── Advanced Card ─────────────────────── */

export function AdvancedCard({
  showAdvanced, setShowAdvanced,
  hasSize,
  useCustomSizeChart, setUseCustomSizeChart,
  sizeChart, setSizeChart,
  sizes,
  allowedAddonsJson, setAllowedAddonsJson,
  updateChartCell, updateRowLabel, addChartRow, removeChartRow,
}: Pick<CreateProductStore,
  | "showAdvanced" | "setShowAdvanced"
  | "hasSize"
  | "useCustomSizeChart" | "setUseCustomSizeChart"
  | "sizeChart" | "setSizeChart"
  | "sizes"
  | "allowedAddonsJson" | "setAllowedAddonsJson"
  | "updateChartCell" | "updateRowLabel" | "addChartRow" | "removeChartRow"
>) {
  return (
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
                if (v && sizeChart.columns.length === 0)
                  setSizeChart(buildDefaultChart(sizes));
              }}
              label="Custom Size Chart"
              desc="Build a measurement table for customers"
            />
          )}

          {hasSize && useCustomSizeChart && (
            <SizeChartEditor
              sizeChart={sizeChart}
              setSizeChart={setSizeChart}
              sizes={sizes}
              updateChartCell={updateChartCell}
              updateRowLabel={updateRowLabel}
              addChartRow={addChartRow}
              removeChartRow={removeChartRow}
            />
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
  );
}

/* ── Size chart editor sub-component ── */

function SizeChartEditor({
  sizeChart, setSizeChart, sizes,
  updateChartCell, updateRowLabel, addChartRow, removeChartRow,
}: Pick<CreateProductStore,
  "sizeChart" | "setSizeChart" | "sizes"
  | "updateChartCell" | "updateRowLabel" | "addChartRow" | "removeChartRow"
>) {
  if (sizes.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: "var(--bw-ghost)" }}>
        ↑ Add sizes above to start building your size chart.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3">
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
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1" style={{ color: "var(--bw-ghost)" }}>
                Measurement
              </th>
              {sizeChart.columns.map((col, ci) => (
                <th key={ci} className="text-left text-[10px] font-semibold uppercase tracking-wider pb-2 px-1" style={{ color: "var(--bw-ghost)" }}>
                  {col}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {sizeChart.rows.map((row, ri) => (
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
    </div>
  );
}