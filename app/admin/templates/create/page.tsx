"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import CanvasEditor, {
  CanvasPlaceholder,
  CanvasTextPlaceholder,
  FontOption,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
} from "../canvas-editor";

export default function AdminCreateTemplatePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: 1,
    thumbnail: "",
    isActive: true,
  });

  const [canvasData, setCanvasData] = useState<{
    backgroundImage: string;
    backgroundZIndex: number;
    imagePlaceholders: CanvasPlaceholder[];
    textPlaceholders: CanvasTextPlaceholder[];
  }>({
    backgroundImage: "",
    backgroundZIndex: 2,
    imagePlaceholders: [],
    textPlaceholders: [],
  });

  const [availableFonts, setAvailableFonts] = useState<FontOption[]>([]);

  useEffect(() => {
    async function loadFonts() {
      try {
        const res = await api.get<{ data: FontOption[] }>("/fonts?isActive=true");
        setAvailableFonts(res.data);
      } catch (err) {
        console.error("Failed to load fonts", err); // non-fatal — falls back to system fonts
      }
    }
    loadFonts();
  }, []);

  /* ─────────────────────── form actions ─────────────────────── */

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
        [name]: parseInt(value, 10) || 1,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  }

  function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, thumbnail: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleCreate() {
    setError("");

    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!canvasData.backgroundImage) {
      setError("Background image is required for the template");
      return;
    }

    // Validate placeholder keys are unique
    const placeholderKeys = new Set<string>();
    for (const placeholder of canvasData.imagePlaceholders) {
      if (!placeholder.key.trim()) {
        setError("All placeholders must have a key");
        return;
      }
      if (placeholderKeys.has(placeholder.key)) {
        setError(`Duplicate placeholder key: ${placeholder.key}`);
        return;
      }
      placeholderKeys.add(placeholder.key);
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: "canvas",
        thumbnail: formData.thumbnail,
        isActive: formData.isActive,
        canvas: {
          backgroundImage: canvasData.backgroundImage,
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
        },
        imagePlaceholders: canvasData.imagePlaceholders,
        textPlaceholders: canvasData.textPlaceholders,
      };

      const response = await api.post("/admin/templates", payload);
      router.push(`/admin/templates/${(response as any).data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create template");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] w-full " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

  const labelCls =
    "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bw-bg)",
        color: "var(--bw-ink)",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Create Template
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
              Design a new page template by uploading a background and placing content zones
            </p>
          </div>
          <a
            href="/admin/templates"
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

        {/* ── Basic Info Card ── */}
        <div
          className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6 mb-6"
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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className={labelCls}>Template Name *</label>
              <input
                className={inputBase}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Cover Page, Article Layout"
              />
            </div>

            <div>
              <label className={labelCls}>Version</label>
              <input
                className={inputBase}
                type="number"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div className="flex items-end pb-2.5">
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
            </div>

            <div className="lg:col-span-4">
              <label className={labelCls}>Description</label>
              <textarea
                className={inputBase}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this template…"
                rows={2}
              />
            </div>

            <div className="lg:col-span-2">
              <label className={labelCls}>Thumbnail Image</label>
              <div className="flex items-center gap-3">
                <label
                  className="px-4 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] cursor-pointer transition-all"
                  style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
                >
                  📁 Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </label>
                {formData.thumbnail && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, thumbnail: "" }))}
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{ background: "rgba(220,38,38,0.1)", color: "var(--bw-red)" }}
                  >
                    Remove
                  </button>
                )}
                {formData.thumbnail && (
                  <img
                    src={formData.thumbnail}
                    alt="Thumbnail preview"
                    className="w-12 h-12 object-cover rounded border"
                    style={{ borderColor: "var(--bw-border)" }}
                  />
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className={labelCls}>Thumbnail URL</label>
              <input
                className={inputBase}
                type="text"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleInputChange}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
          </div>
        </div>

        {/* ── Canvas Editor — big, centered, the main focus of the page ── */}
        <div
          className="rounded-[var(--bw-radius-lg)] p-5 sm:p-8 mb-6"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "var(--bw-font-display)" }}
              >
                Canvas Editor
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--bw-muted)" }}>
                Upload a background image, then place image and text zones where dynamic content should appear
              </p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{ background: "rgba(59,130,246,0.12)", color: "rgb(59,130,246)" }}
            >
              {canvasData.imagePlaceholders.length + canvasData.textPlaceholders.length} placeholder
              {canvasData.imagePlaceholders.length + canvasData.textPlaceholders.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="w-full flex justify-center">
            <div className="w-full max-w-[1400px]">
              <CanvasEditor
                backgroundImage={canvasData.backgroundImage}
                backgroundZIndex={canvasData.backgroundZIndex}
                placeholders={canvasData.imagePlaceholders}
                textPlaceholders={canvasData.textPlaceholders}
                availableFonts={availableFonts}
                onChange={(data) => setCanvasData(data)}
              />
            </div>
          </div>
        </div>

        {/* ── Summary / Create ── */}
        <div
          className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
            boxShadow: "var(--bw-shadow-sm)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className={labelCls.replace("mb-1.5", "mb-0")}>Status</span>
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

              <div className="flex items-center gap-2">
                <span className={labelCls.replace("mb-1.5", "mb-0")}>Version</span>
                <span className="text-sm font-semibold">v{formData.version}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={labelCls.replace("mb-1.5", "mb-0")}>Image Placeholders</span>
                <span className="text-sm font-semibold">{canvasData.imagePlaceholders.length}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={labelCls.replace("mb-1.5", "mb-0")}>Text Placeholders</span>
                <span className="text-sm font-semibold">{canvasData.textPlaceholders.length}</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              style={{
                background: "var(--bw-ink)",
                color: "var(--bw-bg)",
              }}
            >
              {saving ? "Creating…" : "Create Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}