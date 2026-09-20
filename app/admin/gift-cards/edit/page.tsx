
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";

export default function AdminGiftCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [giftCard, setGiftCard] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    thumbnail: "" as string | null,
    sellingPrice: 0,
    costPrice: "" as string | number,
    currency: "BDT",
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [gcData, tplData] = await Promise.all([
          api.get<any>(`/admin/gift-cards/${id}`),
          api.get<any>("/admin/templates?type=canvas&limit=100"),
        ]);

        setGiftCard(gcData.data);
        setTemplates(tplData.data || []);

        const gc = gcData.data;
        setFormData({
          name: gc.name || "",
          description: gc.description || "",
          isActive: gc.isActive ?? true,
          thumbnail: gc.thumbnail || "",
          sellingPrice: gc.pricing?.sellingPrice ?? 0,
          costPrice: gc.pricing?.costPrice ?? "",
          currency: gc.pricing?.currency || "BDT",
        });

        setThumbnailPreview(gc.thumbnail || null);
        setSelectedTemplateId(
          typeof gc.templateId === "object"
            ? gc.templateId?._id
            : gc.templateId
        );
      } catch (err) {
        setError("Failed to load gift card");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

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

    const previousPreview = thumbnailPreview;
    setThumbnailPreview(URL.createObjectURL(file));
    setUploadingThumbnail(true);

    try {
      const body = new FormData();
      body.append("thumbnail", file);
      const res = await api.upload<any>("/admin/gift-cards/upload-thumbnail", body);
      setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
      setSuccess("Cover image uploaded — hit Save to persist it.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setThumbnailError(err.response?.data?.message || "Failed to upload image");
      setThumbnailPreview(previousPreview);
    } finally {
      setUploadingThumbnail(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Gift card name is required");
      return;
    }

    if (!selectedTemplateId) {
      setError("A template must be selected");
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

      await api.put(`/admin/gift-cards/${id}`, payload);
      setSuccess("Gift card updated successfully");
      setTimeout(() => router.push("/admin/gift-cards"), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save gift card");
    } finally {
      setSaving(false);
    }
  }

  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] w-full " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

  const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bw-bg)", color: "var(--bw-ink)" }}
      >
        <p style={{ color: "var(--bw-muted)" }}>Loading gift card…</p>
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
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Edit Gift Card
            </h1>
            <p
              className="mt-0.5 text-sm"
              style={{ color: "var(--bw-muted)" }}
            >
              {giftCard?.name}
            </p>
          </div>

          <a
            href="/admin/gift-cards"
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

        {success && (
          <div
            className="mb-4 p-4 rounded-[var(--bw-radius-md)] text-sm"
            style={{
              background: "rgba(22,163,74,0.15)",
              color: "rgb(22,163,74)",
              border: "1px solid rgba(22,163,74,0.3)",
            }}
          >
            ✓ {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
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
                        alt="Cover"
                        className="w-full h-44 object-cover"
                        style={{
                          opacity: uploadingThumbnail ? 0.5 : 1,
                        }}
                      />

                      {!uploadingThumbnail && (
                        <label
                          htmlFor="thumbnail-input"
                          className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-semibold rounded-[var(--bw-radius-sm)] cursor-pointer"
                          style={{
                            background: "var(--bw-surface)",
                            border: "1px solid var(--bw-border)",
                            color: "var(--bw-ink)",
                          }}
                        >
                          Replace
                        </label>
                      )}
                    </div>
                  ) : (
                    <label
                      htmlFor="thumbnail-input"
                      className="flex flex-col items-center justify-center gap-1.5 rounded-[var(--bw-radius-md)] border-2 border-dashed h-32 cursor-pointer"
                      style={{
                        borderColor: "var(--bw-border)",
                        color: "var(--bw-muted)",
                      }}
                    >
                      <span className="text-xl">🎁</span>
                      <span className="text-xs font-medium">
                        Click to upload cover image
                      </span>
                    </label>
                  )}

                  {thumbnailError && (
                    <p
                      className="text-[11px] mt-1.5"
                      style={{ color: "rgb(220,38,38)" }}
                    >
                      {thumbnailError}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Gift Card Name *</label>
                  <input
                    className={inputBase}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    className={inputBase}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

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

                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>
            </div>

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
                Template
              </h2>

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
                        background: isSelected
                          ? "var(--bw-bg)"
                          : "var(--bw-surface-alt)",
                        borderColor: isSelected
                          ? "var(--bw-ink)"
                          : "var(--bw-border)",
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

                      <p className="font-semibold text-sm truncate">
                        {template.name}
                      </p>
                    </button>
                  );
                })}
              </div>

              <p
                className="text-[10px] mt-3"
                style={{ color: "var(--bw-ghost)" }}
              >
                Changing the template only affects future orders — orders
                already placed keep the template that was live when the
                customer designed their card (frozen as `giftCardTemplateId`).
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div
              className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
              style={{
                background: "var(--bw-surface)",
                border: "1px solid var(--bw-border)",
                boxShadow: "var(--bw-shadow-sm)",
              }}
            >
              <button
                onClick={handleSave}
                disabled={saving || uploadingThumbnail}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50"
                style={{
                  background: "var(--bw-ink)",
                  color: "var(--bw-bg)",
                }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
