"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";

export default function AdminCreateGiftCardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    thumbnail: "" as string | null,
    sellingPrice: 500,
    costPrice: "" as string | number,
    currency: "BDT",
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  /* ─────────────────────── fetch ─────────────────────── */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Only canvas templates are eligible for gift cards.
        const tplData = await api.get<any>("/admin/templates?type=canvas&limit=100");
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === "number") {
      setFormData({ ...formData, [name]: value === "" ? "" : parseFloat(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

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

    const localPreview = URL.createObjectURL(file);
    setThumbnailPreview(localPreview);

    setUploadingThumbnail(true);
    try {
      const body = new FormData();
      body.append("thumbnail", file);

      const res = await api.upload<any>("/admin/gift-cards/upload-thumbnail", body);
      setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
    } catch (err: any) {
      setThumbnailError(err.response?.data?.message || "Failed to upload image");
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

  async function handleCreate() {
    setError("");

    if (!formData.name.trim()) {
      setError("Gift card name is required");
      return;
    }
    if (!selectedTemplateId) {
      setError("Select a template for this gift card");
      return;
    }
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      setError("Selling price must be greater than 0");
      return;
    }
    if (uploadingThumbnail) {
      setError("Please wait for the cover image to finish uploading");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        thumbnail: formData.thumbnail || null,
        isActive: formData.isActive,
        templateId: selectedTemplateId,
        pricing: {
          sellingPrice: Number(formData.sellingPrice),
          costPrice: formData.costPrice === "" ? null : Number(formData.costPrice),
          currency: formData.currency,
        },
      };

      const response = await api.post("/admin/gift-cards", payload);
      router.push(`/admin/gift-cards/${(response as any).data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create gift card");
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
        style={{ background: "var(--bw-bg)", color: "var(--bw-ink)", fontFamily: "var(--bw-font-body)" }}
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
      style={{ background: "var(--bw-bg)", color: "var(--bw-ink)", fontFamily: "var(--bw-font-body)" }}
    >
      <div className="max-w-[1000px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: "var(--bw-font-display)" }}>
              Create Gift Card
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
              Define a new gift card / birthday card product
            </p>
          </div>
          
            href="/admin/gift-cards"
            className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
            style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)", color: "var(--bw-ink)" }}
          >
            ← Back
          </a>
        </div>

        {error && (
          <div
            className="mb-4 p-4 rounded-[var(--bw-radius-md)] text-sm"
            style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)", border: "1px solid rgba(220,38,38,0.3)" }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
            {/* Basic Info */}
            <div
              className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
              style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
            >
              <h2 className="text-lg font-bold mb-5" style={{ fontFamily: "var(--bw-font-display)" }}>
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
                    <div className="relative rounded-[var(--bw-radius-md)] overflow-hidden border" style={{ borderColor: "var(--bw-border)" }}>
                      <img
                        src={thumbnailPreview}
                        alt="Cover preview"
                        className="w-full h-44 object-cover"
                        style={{ opacity: uploadingThumbnail ? 0.5 : 1, transition: "opacity 0.2s" }}
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
                            style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", color: "var(--bw-ink)" }}
                          >
                            Replace
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveThumbnail}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-[var(--bw-radius-sm)] cursor-pointer border-none"
                            style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)" }}
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
                      style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)" }}
                    >
                      <span className="text-xl">🎁</span>
                      <span className="text-xs font-medium">Click to upload cover image</span>
                      <span className="text-[10px]" style={{ color: "var(--bw-ghost)" }}>
                        JPEG, PNG, WEBP, or GIF — up to {MAX_SIZE_MB}MB
                      </span>
                    </label>
                  )}
                  {thumbnailError && (
                    <p className="text-[11px] mt-1.5" style={{ color: "rgb(220,38,38)" }}>{thumbnailError}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className={labelCls}>Gift Card Name *</label>
                  <input
                    className={inputBase}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Birthday Card — Confetti"
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
                    placeholder="Brief description of this gift card…"
                    rows={3}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Selling Price *</label>
                    <input
                      className={inputBase}
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      min="0"
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
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Currency</label>
                    <input
                      className={inputBase}
                      type="text"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="pt-2 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontFamily: "var(--bw-font-display)" }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                  <p className="text-[11px] mt-1.5 ml-6" style={{ color: "var(--bw-ghost)" }}>
                    Active gift cards are available for customers to buy and customize.
                  </p>
                </div>
              </div>
            </div>

            {/* Template picker — single selection, unlike Magazine's multi-select */}
            <div
              className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
              style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
            >
              <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--bw-font-display)" }}>
                Select Template *
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--bw-muted)" }}>
                Choose exactly one canvas template. A gift card is always a single page.
              </p>

              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: "var(--bw-muted)" }}>
                    No canvas templates available. Create a canvas template first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {templates.map((template: any) => {
                    const isSelected = selectedTemplateId === template._id;
                    return (
                      <button
                        key={template._id}
                        type="button"
                        onClick={() => setSelectedTemplateId(template._id)}
                        className="text-left rounded-[var(--bw-radius-md)] p-3 border transition-all cursor-pointer"
                        style={{
                          background: isSelected ? "var(--bw-bg)" : "var(--bw-surface-alt)",
                          borderColor: isSelected ? "var(--bw-ink)" : "var(--bw-border)",
                          borderWidth: isSelected ? "2px" : "1px",
                        }}
                      >
                        {template.thumbnail ? (
                          <img
                            src={template.thumbnail}
                            alt={template.name}
                            className="w-full h-24 object-cover rounded-[var(--bw-radius-sm)] mb-2"
                          />
                        ) : (
                          <div
                            className="w-full h-24 rounded-[var(--bw-radius-sm)] mb-2 flex items-center justify-center text-2xl"
                            style={{ background: "var(--bw-bg)" }}
                          >
                            🖼️
                          </div>
                        )}
                        <p className="font-semibold text-sm truncate">{template.name}</p>
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--bw-muted)" }}>
                          {(template.imagePlaceholders?.length || 0)} images · {(template.textPlaceholders?.length || 0)} text fields
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Summary ── */}
          <div className="lg:col-span-1 flex flex-col gap-5 sm:gap-6">
            <div
              className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6 sticky top-8"
              style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)", boxShadow: "var(--bw-shadow-sm)" }}
            >
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--bw-font-display)" }}>
                Configuration
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>Status</span>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={
                      formData.isActive
                        ? { background: "rgba(22,163,74,0.15)", color: "rgb(22,163,74)" }
                        : { background: "rgba(100,100,100,0.15)", color: "rgb(100,100,100)" }
                    }
                  >
                    {formData.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="h-px" style={{ background: "var(--bw-divider)" }} />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>Price</span>
                  <span className="text-sm font-semibold">
                    {formData.currency} {Number(formData.sellingPrice || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--bw-ghost)" }}>Template</span>
                  <span
                    className="text-sm font-semibold"
                    style={!selectedTemplateId ? { color: "var(--bw-red)" } : {}}
                  >
                    {selectedTemplateId
                      ? templates.find((t) => t._id === selectedTemplateId)?.name
                      : "None selected"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={saving || !selectedTemplateId || uploadingThumbnail}
                className="w-full mt-6 px-4 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
              >
                {saving ? "Creating…" : "Create Gift Card"}
              </button>

              <p className="text-[10px] mt-3 text-center" style={{ color: "var(--bw-ghost)" }}>
                Select a template to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}