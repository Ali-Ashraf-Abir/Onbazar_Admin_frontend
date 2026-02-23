"use client";

import React from "react";
import { useEditProduct } from "../../../../components/edit-products/useEditProduct";
import { ImagesCard, UploadCard, PricingCard, SizeChartCard } from "../../../../components/edit-products/EditFormCards";
import {
  BasicInfoCard, DescriptionCard, KeyFeaturesCard,
  SizingCard, StockCard, AdvancedCard,
} from "../../../../components/edit-products/EditInfoCards";

export default function ProductDetailsPage() {
  const store = useEditProduct();
  const { product, saving, handlePatch, handleDelete, savedPricing, hasSize, totalSizedStock, stockQty } = store;

  /* ── guards ── */
  if (!store.id) return (
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

          <span className="text-xl font-semibold tracking-tight" style={{ color: "var(--bw-ink)" }}>
            <span className="text-sm font-normal mr-0.5" style={{ color: "var(--bw-ghost)" }}>৳</span>
            {savedPricing.sellingPrice?.toFixed(2) ?? "–"}
          </span>

          {savedPricing.costPrice != null && (
            <span className="text-xs" style={{ color: "var(--bw-muted)" }}>
              Cost: ৳{savedPricing.costPrice.toFixed(2)}
            </span>
          )}

          {product.stock?.managed && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ background: "var(--bw-surface-alt)", borderColor: "var(--bw-border)", color: "var(--bw-ink)" }}
            >
              📦 {hasSize ? totalSizedStock : (parseInt(stockQty) || product.stock?.quantity || 0)} units
            </span>
          )}

          {product.category && typeof product.category === "object" && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ background: "var(--bw-bg-alt)", borderColor: "var(--bw-border-strong)", color: "var(--bw-ink-secondary)" }}
            >
              {product.category.name}
            </span>
          )}

          <span
            className="text-xs px-2 py-0.5 rounded-md"
            style={{ background: "var(--bw-surface-alt)", color: "var(--bw-ghost)", fontFamily: "var(--bw-font-mono)" }}
          >
            {product.slug}
          </span>

          <span
            className="text-[10px]"
            style={{ color: "var(--bw-ghost)", fontFamily: "var(--bw-font-mono)" }}
          >
            {product._id}
          </span>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ══ LEFT column ══ */}
          <div>
            <ImagesCard
              product={store.product}
              settingCover={store.settingCover}
              removeImage={store.removeImage}
              setCoverImage={store.setCoverImage}
            />

            <UploadCard
              imageMode={store.imageMode}
              setImageMode={store.setImageMode}
              newFiles={store.newFiles}
              setNewFiles={store.setNewFiles}
              dragOver={store.dragOver}
              setDragOver={store.setDragOver}
            />

            <PricingCard
              sellingPrice={store.sellingPrice}
              setSellingPrice={store.setSellingPrice}
              currency={store.currency}
              setCurrency={store.setCurrency}
              hasDiscount={store.hasDiscount}
              setHasDiscount={store.setHasDiscount}
              discountType={store.discountType}
              setDiscountType={store.setDiscountType}
              discountValue={store.discountValue}
              setDiscountValue={store.setDiscountValue}
              discountStart={store.discountStart}
              setDiscountStart={store.setDiscountStart}
              discountEnd={store.discountEnd}
              setDiscountEnd={store.setDiscountEnd}
              showCostSection={store.showCostSection}
              setShowCostSection={store.setShowCostSection}
              costPrice={store.costPrice}
              setCostPrice={store.setCostPrice}
              additionalCosts={store.additionalCosts}
              addCostRow={store.addCostRow}
              updateCostRow={store.updateCostRow}
              removeCostRow={store.removeCostRow}
              addPresetCost={store.addPresetCost}
              hasCostData={store.hasCostData}
            />

            {store.hasSize && (
              <SizeChartCard
                showSizeChart={store.showSizeChart}
                setShowSizeChart={store.setShowSizeChart}
                useCustomSizeChart={store.useCustomSizeChart}
                setUseCustomSizeChart={store.setUseCustomSizeChart}
                sizeChart={store.sizeChart}
                setSizeChart={store.setSizeChart}
                sizes={store.sizes}
                updateChartCell={store.updateChartCell}
                updateRowLabel={store.updateRowLabel}
                addChartRow={store.addChartRow}
                removeChartRow={store.removeChartRow}
                resetSizeChartToDefault={store.resetSizeChartToDefault}
              />
            )}
          </div>

          {/* ══ RIGHT column ══ */}
          <div>
            <BasicInfoCard
              name={store.name}
              setName={store.setName}
              isActive={store.isActive}
              setIsActive={store.setIsActive}
              categories={store.categories}
              categoryId={store.categoryId}
              setCategoryId={store.setCategoryId}
              categoriesLoading={store.categoriesLoading}
              selectedCategory={store.selectedCategory}
            />

            <DescriptionCard
              description={store.description}
              setDescription={store.setDescription}
            />

            <KeyFeaturesCard
              bullets={store.bullets}
              addBullet={store.addBullet}
              updateBullet={store.updateBullet}
              removeBullet={store.removeBullet}
            />

            <SizingCard
              hasSize={store.hasSize}
              setHasSize={store.setHasSize}
              sizes={store.sizes}
              sizeDropOpen={store.sizeDropOpen}
              setSizeDropOpen={store.setSizeDropOpen}
              customSizeInput={store.customSizeInput}
              setCustomSizeInput={store.setCustomSizeInput}
              sizeDropRef={store.sizeDropRef}
              sizeTriggerRef={store.sizeTriggerRef}
              toggleSize={store.toggleSize}
              addCustomSize={store.addCustomSize}
              removeSize={store.removeSize}
            />

            <StockCard
              stockManaged={store.stockManaged}
              setStockManaged={store.setStockManaged}
              hasSize={store.hasSize}
              sizes={store.sizes}
              stockQty={store.stockQty}
              setStockQty={store.setStockQty}
              sizeStockRows={store.sizeStockRows}
              setSizeStockRows={store.setSizeStockRows}
              updateSizeStock={store.updateSizeStock}
              totalSizedStock={store.totalSizedStock}
            />

            <AdvancedCard
              showAdvanced={store.showAdvanced}
              setShowAdvanced={store.setShowAdvanced}
              allowedAddonsJson={store.allowedAddonsJson}
              setAllowedAddonsJson={store.setAllowedAddonsJson}
            />

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
                    <span
                      className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderTopColor: "var(--bw-bg)" }}
                    />
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