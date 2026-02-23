"use client";

import React from "react";
import { useCreateProduct } from "../../../components/create-products/useCreateProduct";
import { ImagesCard, PricingCard, AdvancedCard } from "../../../components/create-products/ProductFormCards";
import { BasicInfoCard, DescriptionCard, KeyFeaturesCard, SizingCard, StockCard } from "../../../components/create-products/ProductInfoCards";

export default function CreateProductPage() {
  const store = useCreateProduct();

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
        <a
          href="/admin/products"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--bw-muted)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bw-ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bw-muted)")}
        >
          ← Back to Products
        </a>
      </header>

      <div className="max-w-[1200px] mx-auto px-5 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
            New Product
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--bw-muted)" }}>
            Fill in the details below to list a product
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ══ LEFT column ══ */}
          <div>
            <ImagesCard
              images={store.images}
              dragOver={store.dragOver}
              setDragOver={store.setDragOver}
              addImages={store.addImages}
              removeImage={store.removeImage}
              setAsCover={store.setAsCover}
              clearAllImages={store.clearAllImages}
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

            <AdvancedCard
              showAdvanced={store.showAdvanced}
              setShowAdvanced={store.setShowAdvanced}
              hasSize={store.hasSize}
              useCustomSizeChart={store.useCustomSizeChart}
              setUseCustomSizeChart={store.setUseCustomSizeChart}
              sizeChart={store.sizeChart}
              setSizeChart={store.setSizeChart}
              sizes={store.sizes}
              allowedAddonsJson={store.allowedAddonsJson}
              setAllowedAddonsJson={store.setAllowedAddonsJson}
              updateChartCell={store.updateChartCell}
              updateRowLabel={store.updateRowLabel}
              addChartRow={store.addChartRow}
              removeChartRow={store.removeChartRow}
            />
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

            {/* ── Submit ── */}
            <SubmitFooter
              loading={store.loading}
              handleCreate={store.handleCreate}
            />

            {/* ── Last created card ── */}
            {store.lastCreated && (
              <LastCreatedCard
                id={store.lastCreated.id}
                name={store.lastCreated.name}
                sellingPrice={store.lastCreated.sellingPrice}
                image={store.lastCreated.image}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Success Toast ── */}
      {store.showSuccess && (
        <div
          className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium whitespace-nowrap z-[9999]"
          style={{
            background: "var(--bw-ink)",
            color: "var(--bw-bg)",
            boxShadow: "var(--bw-shadow-lg)",
            fontFamily: "var(--bw-font-body)",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
            style={{ background: "var(--bw-green)", color: "#fff" }}
          >
            ✓
          </div>
          Product created successfully!
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Submit footer ─────────────────────── */

function SubmitFooter({
  loading,
  handleCreate,
}: {
  loading: boolean;
  handleCreate: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-[var(--bw-radius-xl)] border"
      style={{
        background: "var(--bw-surface)",
        borderColor: "var(--bw-border)",
        boxShadow: "var(--bw-shadow-sm)",
      }}
    >
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-3.5 rounded-[var(--bw-radius-md)] text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
      >
        {loading ? (
          <>
            <span
              className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: "var(--bw-bg)" }}
            />
            Creating…
          </>
        ) : (
          "Create Product →"
        )}
      </button>
      <p className="text-center text-xs" style={{ color: "var(--bw-ghost)" }}>
        Slug auto-generated · Costs are private
      </p>
    </div>
  );
}

/* ─────────────────────── Last created card ─────────────────────── */

function LastCreatedCard({
  id, name, sellingPrice, image,
}: {
  id: string;
  name: string;
  sellingPrice: number;
  image: string;
}) {
  return (
    <a href={`/admin/products/${id}`} style={{ textDecoration: "none" }}>
      <div
        className="flex items-center gap-4 p-4 rounded-[var(--bw-radius-xl)] border cursor-pointer mt-3 transition-all"
        style={{
          background: "var(--bw-surface)",
          borderColor: "var(--bw-border-strong)",
          boxShadow: "var(--bw-shadow-sm)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--bw-shadow-hover)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--bw-shadow-sm)";
          (e.currentTarget as HTMLDivElement).style.transform = "";
        }}
      >
        {image && (
          <img
            src={image}
            alt=""
            className="w-14 h-14 object-cover rounded-[var(--bw-radius-md)] flex-shrink-0"
            style={{ background: "var(--bw-surface-alt)" }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--bw-muted)" }}>
            Last Created
          </p>
          <p className="text-sm font-semibold truncate" style={{ color: "var(--bw-ink)" }}>
            {name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--bw-ghost)" }}>
            ৳ {sellingPrice.toFixed(2)}
          </p>
        </div>
        <span className="text-lg flex-shrink-0" style={{ color: "var(--bw-ghost)" }}>→</span>
      </div>
    </a>
  );
}