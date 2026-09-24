"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";

type CostRow = { id: string; label: string; amount: string };

export default function AdminCreateMagazinePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minPages: 1,
    maxPages: 10,
    isActive: true,
    thumbnail: "" as string | null,

    // ── Pricing ──
    currency: "BDT",
    sellingPrice: "" as number | string,
    costPrice: "" as number | string,

    // ── Discount ──
    discountType: "" as "" | "percentage" | "fixed",
    discountValue: "" as number | string,
    discountStartDate: "",
    discountEndDate: "",
  });

  const [additionalCosts, setAdditionalCosts] = useState<CostRow[]>([]);

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");

  const [selectedTemplates, setSelectedTemplates] = useState<
    Map<string, { required: boolean; minUses: number; maxUses: number }>
  >(new Map());

  /* ─────────────────────── helpers ─────────────────────── */

  function makeRowId() {
    return `cost_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /* ─────────────────────── fetch ─────────────────────── */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const tplData = await api.get<any>("/admin/templates?limit=100");
        setTemplates(tplData.data || []);
      } catch (err) {
        setError("Failed to load templates");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* ─────────────────────── form actions ─────────────────────── */

  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  }

  /* ─────────────────────── pricing / discount ─────────────────────── */

  function addCostRow() {
    setAdditionalCosts([...additionalCosts, { id: makeRowId(), label: "", amount: "" }]);
  }

  function updateCostRow(rowId: string, field: "label" | "amount", value: string) {
    setAdditionalCosts((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  }

  function removeCostRow(rowId: string) {
    setAdditionalCosts((rows) => rows.filter((r) => r.id !== rowId));
  }

  const numericSellingPrice =
    formData.sellingPrice === "" ? null : Number(formData.sellingPrice);
  const numericCostPrice =
    formData.costPrice === "" ? null : Number(formData.costPrice);
  const additionalCostsTotal = additionalCosts.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0
  );
  const totalCost =
    numericCostPrice !== null ? numericCostPrice + additionalCostsTotal : null;
  const margin =
    numericSellingPrice !== null && totalCost !== null && numericSellingPrice > 0
      ? (((numericSellingPrice - totalCost) / numericSellingPrice) * 100).toFixed(1)
      : null;

  /* ─────────────────────── thumbnail upload ─────────────────────── */

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_SIZE_MB = 5;

  async function handleThumbnailSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setThumbnailError("Only JPEG, PNG, WEBP, or GIF images are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setThumbnailError(`Image must be smaller than ${MAX_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    // Local preview immediately
    const localPreview = URL.createObjectURL(file);
    setThumbnailPreview(localPreview);

    setUploadingThumbnail(true);
    try {
      const body = new FormData();
      body.append("thumbnail", file);

      const res = await api.upload<any>("/admin/magazines/upload-thumbnail", body);
      setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
    } catch (err: any) {
      setThumbnailError(
        err.response?.data?.message || "Failed to upload image"
      );
      setThumbnailPreview(null);
      setFormData((prev) => ({ ...prev, thumbnail: "" }));
    } finally {
      setUploadingThumbnail(false);
      e.target.value = "";
    }
  }

  function handleRemoveThumbnail() {
    setThumbnailPreview(null);
    setThumbnailError("");
    setFormData((prev) => ({ ...prev, thumbnail: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleTemplate(templateId: string) {
    const newMap = new Map(selectedTemplates);
    if (newMap.has(templateId)) {
      newMap.delete(templateId);
    } else {
      newMap.set(templateId, {
        required: false,
        minUses: 1,
        maxUses: 5,
      });
    }
    setSelectedTemplates(newMap);
  }

  function updateTemplateConfig(
    templateId: string,
    field: "required" | "minUses" | "maxUses",
    value: any
  ) {
    const newMap = new Map(selectedTemplates);
    const config = newMap.get(templateId);
    if (config) {
      (config as any)[field] = value;
      newMap.set(templateId, config);
      setSelectedTemplates(newMap);
    }
  }

  async function handleCreate() {
    setError("");

    if (!formData.name.trim()) {
      setError("Magazine name is required");
      return;
    }

    if (formData.maxPages < formData.minPages) {
      setError("Max pages must be >= min pages");
      return;
    }

    if (selectedTemplates.size === 0) {
      setError("At least one template must be assigned");
      return;
    }

    if (uploadingThumbnail) {
      setError("Please wait for the cover image to finish uploading");
      return;
    }

    if (formData.discountType && formData.discountValue === "") {
      setError("Enter a discount value or clear the discount type");
      return;
    }

    setSaving(true);
    try {
      const additionalCostsObj = Object.fromEntries(
        additionalCosts
          .filter((r) => r.label.trim())
          .map((r) => [r.label.trim(), Number(r.amount) || 0])
      );

      const payload = {
        name: formData.name,
        description: formData.description,
        thumbnail: formData.thumbnail || null,
        minPages: formData.minPages,
        maxPages: formData.maxPages,
        isActive: formData.isActive,
        pricing: {
          sellingPrice: numericSellingPrice,
          costPrice: numericCostPrice,
          currency: formData.currency || "BDT",
          additionalCosts: additionalCostsObj,
        },
        discount: formData.discountType
          ? {
              type: formData.discountType,
              value:
                formData.discountValue === ""
                  ? null
                  : Number(formData.discountValue),
              startDate: formData.discountStartDate || null,
              endDate: formData.discountEndDate || null,
            }
          : { type: null, value: null, startDate: null, endDate: null },
        templates: Array.from(selectedTemplates.entries()).map(
          ([templateId, config]) => ({
            templateId,
            ...config,
          })
        ),
      };

      const response = await api.post("/admin/magazines", payload);
      router.push(`/admin/magazines/${(response as any).data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create magazine");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  /* ─────────────────────── shared tw classes ─────────────────────── */

  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] w-full " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

  const labelCls =
    "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "var(--bw-bg)",
          color: "var(--bw-ink)",
          fontFamily: "var(--bw-font-body)",
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p style={{ color: "var(--bw-muted)" }}>Loading templates…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bw-bg)",
        color: "var(--bw-ink)",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      <div className="max-w-[1000px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Create Magazine
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
              Define a new magazine template
            </p>
          </div>
          <a
            href="/admin/magazines"
            className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
            style={{
              background: "var(--bw-surface)",
              borderColor: "var(--bw-border)",
              color: "var(--bw-ink)",
            }}
          >
            ← Back
          </a>
        </div>

        {/* ── Error Alert ── */}
        {error && (
          <div
            className="mb-4 p-4 rounded-[var(--bw-radius-md)] text-sm"
            style={{
              background: "rgba(220,38,38,0.15)",
              color: "rgb(220,38,38)",
              border: "1px solid rgba(220,38,38,0.3)",
            }}
          >
            {error}
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* ── Left Column: Basic Info ── */}
          <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
            {/* Basic Info Card */}
            <div
              className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
              style={{
                background: "var(--bw-surface)",
                border: "1px solid var(--bw-border)",
                boxShadow: "var(--bw-shadow-sm)",
              }}
            >
              <h2
                className="text-lg font-bold mb-5"
                style={{ fontFamily: "var(--bw-font-display)" }}
              >
                Basic Information
              </h2>

              <div className="space-y-4">
                {/* Cover Image */}
                <div>
                  <label className={labelCls}>Cover Image</label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                    id="thumbnail-input"
                  />

                  {thumbnailPreview ? (
                    <div
                      className="relative rounded-[var(--bw-radius-md)] overflow-hidden border"
                      style={{ borderColor: "var(--bw-border)" }}
                    >
                      <img
                        src={thumbnailPreview}
                        alt="Cover preview"
                        className="w-full h-44 object-cover"
                        style={{
                          opacity: uploadingThumbnail ? 0.5 : 1,
                          transition: "opacity 0.2s",
                        }}
                      />

                      {uploadingThumbnail && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl animate-pulse">⏳</span>
                        </div>
                      )}

                      {!uploadingThumbnail && (
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <label
                            htmlFor="thumbnail-input"
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-[var(--bw-radius-sm)] cursor-pointer"
                            style={{
                              background: "var(--bw-surface)",
                              border: "1px solid var(--bw-border)",
                              color: "var(--bw-ink)",
                            }}
                          >
                            Replace
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveThumbnail}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-[var(--bw-radius-sm)] cursor-pointer border-none"
                            style={{
                              background: "rgba(220,38,38,0.15)",
                              color: "rgb(220,38,38)",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label
                      htmlFor="thumbnail-input"
                      className="flex flex-col items-center justify-center gap-1.5 rounded-[var(--bw-radius-md)] border-2 border-dashed h-32 cursor-pointer transition-colors"
                      style={{
                        borderColor: "var(--bw-border)",
                        color: "var(--bw-muted)",
                      }}
                    >
                      <span className="text-xl">🖼️</span>
                      <span className="text-xs font-medium">
                        Click to upload cover image
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--bw-ghost)" }}>
                        JPEG, PNG, WEBP, or GIF — up to {MAX_SIZE_MB}MB
                      </span>
                    </label>
                  )}

                  {thumbnailError && (
                    <p className="text-[11px] mt-1.5" style={{ color: "rgb(220,38,38)" }}>
                      {thumbnailError}
                    </p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className={labelCls}>Magazine Name *</label>
                  <input
                    className={inputBase}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Fashion Magazine, Tech Digest"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    className={inputBase}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this magazine template…"
                    rows={3}
                  />
                </div>

                {/* Pages Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Min Pages *</label>
                    <input
                      className={inputBase}
                      type="number"
                      name="minPages"
                      value={formData.minPages}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                    />
                    <p
                      className="text-[10px] mt-1"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      Minimum pages required
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Max Pages *</label>
                    <input
                      className={inputBase}
                      type="number"
                      name="maxPages"
                      value={formData.maxPages}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                    />
                    <p
                      className="text-[10px] mt-1"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      Maximum pages allowed
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="pt-2 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <label
                    className="flex items-center gap-2 cursor-pointer select-none"
                    style={{ fontFamily: "var(--bw-font-display)" }}
                  >
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                  <p
                    className="text-[11px] mt-1.5 ml-6"
                    style={{ color: "var(--bw-ghost)" }}
                  >
                    Active magazines are available for creating new instances. You can change this later.
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div
              className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
              style={{
                background: "var(--bw-surface)",
                border: "1px solid var(--bw-border)",
                boxShadow: "var(--bw-shadow-sm)",
              }}
            >
              <h2
                className="text-lg font-bold mb-5"
                style={{ fontFamily: "var(--bw-font-display)" }}
              >
                Pricing
              </h2>

              <p className="text-sm mb-4" style={{ color: "var(--bw-muted)" }}>
                Optional — set a selling price and cost breakdown for this magazine.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Currency</label>
                    <input
                      className={inputBase}
                      type="text"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      placeholder="BDT"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Selling Price</label>
                    <input
                      className={inputBase}
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Cost Price</label>
                    <input
                      className={inputBase}
                      type="number"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Additional Costs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls} style={{ marginBottom: 0 }}>
                      Additional Costs
                    </label>
                    <button
                      type="button"
                      onClick={addCostRow}
                      className="text-[11px] font-semibold px-2 py-1 rounded-[var(--bw-radius-sm)] cursor-pointer border"
                      style={{
                        background: "var(--bw-surface-alt)",
                        borderColor: "var(--bw-border)",
                        color: "var(--bw-ink)",
                      }}
                    >
                      + Add cost
                    </button>
                  </div>

                  {additionalCosts.length === 0 ? (
                    <p className="text-xs" style={{ color: "var(--bw-ghost)" }}>
                      e.g. printing, shipping, design — none added yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {additionalCosts.map((row) => (
                        <div key={row.id} className="flex gap-2">
                          <input
                            className={inputBase}
                            type="text"
                            placeholder="Label (e.g. Printing)"
                            value={row.label}
                            onChange={(e) =>
                              updateCostRow(row.id, "label", e.target.value)
                            }
                          />
                          <input
                            className={inputBase}
                            style={{ maxWidth: "9rem" }}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Amount"
                            value={row.amount}
                            onChange={(e) =>
                              updateCostRow(row.id, "amount", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeCostRow(row.id)}
                            className="px-3 rounded-[var(--bw-radius-md)] text-xs font-semibold cursor-pointer border-none"
                            style={{
                              background: "rgba(220,38,38,0.15)",
                              color: "rgb(220,38,38)",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {margin !== null && (
                  <p className="text-[11px]" style={{ color: "var(--bw-ghost)" }}>
                    Estimated margin:{" "}
                    <span
                      style={{
                        color: Number(margin) >= 0 ? "rgb(22,163,74)" : "rgb(220,38,38)",
                        fontWeight: 700,
                      }}
                    >
                      {margin}%
                    </span>{" "}
                    (selling price minus cost price and additional costs)
                  </p>
                )}

                {/* Discount */}
                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <label className={labelCls}>Discount</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className={inputBase}
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                    >
                      <option value="">No discount</option>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                    <input
                      className={inputBase}
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder={
                        formData.discountType === "percentage" ? "e.g. 10" : "e.g. 100"
                      }
                      disabled={!formData.discountType}
                    />
                  </div>

                  {formData.discountType && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className={labelCls}>Starts</label>
                        <input
                          className={inputBase}
                          type="date"
                          name="discountStartDate"
                          value={formData.discountStartDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Ends</label>
                        <input
                          className={inputBase}
                          type="date"
                          name="discountEndDate"
                          value={formData.discountEndDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Templates Card */}
            <div
              className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
              style={{
                background: "var(--bw-surface)",
                border: "1px solid var(--bw-border)",
                boxShadow: "var(--bw-shadow-sm)",
              }}
            >
              <h2
                className="text-lg font-bold mb-5"
                style={{ fontFamily: "var(--bw-font-display)" }}
              >
                Select Templates *
              </h2>

              <p
                className="text-sm mb-4"
                style={{ color: "var(--bw-muted)" }}
              >
                Choose which templates can be used in this magazine. You must select at least one.
              </p>

              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <p
                    className="text-sm"
                    style={{ color: "var(--bw-muted)" }}
                  >
                    No templates available. Create templates first.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {templates.map((template: any) => {
                    const isSelected = selectedTemplates.has(template._id);
                    const config = selectedTemplates.get(template._id);

                    return (
                      <div
                        key={template._id}
                        className="rounded-[var(--bw-radius-md)] p-4 border transition-all cursor-pointer"
                        onClick={() => toggleTemplate(template._id)}
                        style={{
                          background: isSelected
                            ? "var(--bw-bg)"
                            : "var(--bw-surface-alt)",
                          borderColor: isSelected
                            ? "var(--bw-ink)"
                            : "var(--bw-border)",
                        }}
                      >
                        {/* Template header */}
                        <div className="flex items-start gap-3 mb-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTemplate(template._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded mt-1 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {template.name}
                            </p>
                            <p
                              className="text-[11px] mt-0.5 truncate"
                              style={{ color: "var(--bw-muted)" }}
                            >
                              {template.description ||
                                `${template.fields?.length || 0} fields`}
                            </p>
                            {template.version && (
                              <p
                                className="text-[10px] mt-1"
                                style={{
                                  color: "var(--bw-ghost)",
                                  fontFamily: "var(--bw-font-mono)",
                                }}
                              >
                                v{template.version}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Template config (only if selected) */}
                        {isSelected && (
                          <div
                            className="grid grid-cols-3 gap-2 ml-7 pt-3 border-t"
                            style={{ borderColor: "var(--bw-divider)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Required toggle */}
                            <label
                              className="flex items-center gap-2 cursor-pointer text-xs"
                              style={{
                                color: "var(--bw-ink)",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={config?.required || false}
                                onChange={(e) => {
                                  updateTemplateConfig(
                                    template._id,
                                    "required",
                                    e.target.checked
                                  );
                                  e.stopPropagation();
                                }}
                                className="w-3 h-3 rounded cursor-pointer"
                              />
                              <span>Required</span>
                            </label>

                            {/* Min uses */}
                            <div>
                              <label className="text-[9px] font-semibold block mb-1 opacity-75">
                                Min Uses
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={config?.minUses || 1}
                                onChange={(e) => {
                                  updateTemplateConfig(
                                    template._id,
                                    "minUses",
                                    parseInt(e.target.value, 10)
                                  );
                                  e.stopPropagation();
                                }}
                                className={`${inputBase} text-xs p-1.5`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Max uses */}
                            <div>
                              <label className="text-[9px] font-semibold block mb-1 opacity-75">
                                Max Uses
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={config?.maxUses || 5}
                                onChange={(e) => {
                                  updateTemplateConfig(
                                    template._id,
                                    "maxUses",
                                    parseInt(e.target.value, 10)
                                  );
                                  e.stopPropagation();
                                }}
                                className={`${inputBase} text-xs p-1.5`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Summary ── */}
          <div className="lg:col-span-1 flex flex-col gap-5 sm:gap-6">
            {/* Summary Card */}
            <div
              className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6 sticky top-8"
              style={{
                background: "var(--bw-surface)",
                border: "1px solid var(--bw-border)",
                boxShadow: "var(--bw-shadow-sm)",
              }}
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{ fontFamily: "var(--bw-font-display)" }}
              >
                Configuration
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--bw-ghost)" }}
                  >
                    Status
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={
                      formData.isActive
                        ? {
                            background: "rgba(22,163,74,0.15)",
                            color: "rgb(22,163,74)",
                          }
                        : {
                            background: "rgba(100,100,100,0.15)",
                            color: "rgb(100,100,100)",
                          }
                    }
                  >
                    {formData.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="h-px" style={{ background: "var(--bw-divider)" }} />

                <div className="flex justify-between items-center">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--bw-ghost)" }}
                  >
                    Pages
                  </span>
                  <span className="text-sm font-semibold">
                    {formData.minPages}–{formData.maxPages}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--bw-ghost)" }}
                  >
                    Templates
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      selectedTemplates.size === 0 ? "text-[var(--bw-red)]" : ""
                    }`}
                    style={
                      selectedTemplates.size === 0
                        ? { color: "var(--bw-red)" }
                        : {}
                    }
                  >
                    {selectedTemplates.size}
                  </span>
                </div>

                <div className="h-px" style={{ background: "var(--bw-divider)" }} />

                <div className="flex justify-between items-center">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--bw-ghost)" }}
                  >
                    Selling Price
                  </span>
                  <span className="text-sm font-semibold">
                    {numericSellingPrice !== null
                      ? `${formData.currency} ${numericSellingPrice.toLocaleString()}`
                      : "—"}
                  </span>
                </div>

                {formData.discountType && (
                  <div className="flex justify-between items-center">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      Discount
                    </span>
                    <span className="text-sm font-semibold">
                      {formData.discountValue || 0}
                      {formData.discountType === "percentage" ? "%" : ` ${formData.currency}`}
                    </span>
                  </div>
                )}

                {margin !== null && (
                  <div className="flex justify-between items-center">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      Margin
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: Number(margin) >= 0 ? "rgb(22,163,74)" : "rgb(220,38,38)" }}
                    >
                      {margin}%
                    </span>
                  </div>
                )}

                {selectedTemplates.size > 0 && (
                  <>
                    <div className="h-px" style={{ background: "var(--bw-divider)" }} />

                    <div className="text-xs space-y-1.5 pt-2 max-h-40 overflow-y-auto">
                      <p
                        className="font-semibold"
                        style={{ color: "var(--bw-ghost)" }}
                      >
                        Selected:
                      </p>
                      {Array.from(selectedTemplates.entries()).map(
                        ([templateId, config]) => {
                          const tpl = templates.find((t) => t._id === templateId);
                          return (
                            <div
                              key={templateId}
                              className="pl-2 border-l"
                              style={{ borderColor: "var(--bw-border)" }}
                            >
                              <p
                                className="font-medium"
                                style={{ color: "var(--bw-ink)" }}
                              >
                                {tpl?.name}
                              </p>
                              <p style={{ color: "var(--bw-muted)" }}>
                                {config.required && "Required • "}
                                {config.minUses}–{config.maxUses} uses
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={saving || selectedTemplates.size === 0 || uploadingThumbnail}
                className="w-full mt-6 px-4 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "var(--bw-ink)",
                  color: "var(--bw-bg)",
                }}
              >
                {saving ? "Creating…" : "Create Magazine"}
              </button>

              <p
                className="text-[10px] mt-3 text-center"
                style={{ color: "var(--bw-ghost)" }}
              >
                Select at least one template to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}