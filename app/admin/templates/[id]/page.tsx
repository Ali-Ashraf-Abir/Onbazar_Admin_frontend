"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";
import CanvasEditor from "../canvas-editor";

const FIELD_TYPES = ["text", "textarea", "image", "number", "date"];

export default function AdminTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const A4_WIDTH_PX = 794;   // 210mm at 96dpi
  const A4_HEIGHT_PX = 1123; // 297mm at 96dpi
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [testImages, setTestImages] = useState<Record<string, string>>({});
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    if (!showPreview) return;

    const el = previewContainerRef.current;
    if (!el) return;

    function computeScale() {
      const containerWidth = el!.clientWidth;
      setPreviewScale(containerWidth / A4_WIDTH_PX);
    }

    computeScale();

    const observer = new ResizeObserver(computeScale);
    observer.observe(el);

    return () => observer.disconnect();
  }, [showPreview]);

  function handleTestImageUpload(fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTestImages((prev) => ({ ...prev, [fieldKey]: reader.result as string }));
        setTestData((prev) => ({ ...prev, [fieldKey]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

  function renderPreview() {
    if (!template?.html) return "";
    let html = template.html;

    (template.fields || []).forEach((field: any) => {
      const value = testData[field.key] || field.defaultValue || `[${field.label || field.key}]`;

      // {{fieldKey}} syntax
      html = html.replace(new RegExp(`{{${field.key}}}`, "g"), value);

      // data-field attribute syntax (compatibility with older templates)
      if (field.type === "image") {
        const imgRegex = new RegExp(`<img([^>]*?)data-field="${field.key}"([^>]*?)>`, "g");
        html = html.replace(imgRegex, (match: string, before: string, after: string) => {
          const updatedSrc = value || "https://via.placeholder.com/400x300?text=Upload+Image";
          return `<img${before}data-field="${field.key}"${after.replace(/src="[^"]*"/, "")} src="${updatedSrc}">`;
        });
      } else {
        const regex = new RegExp(`(<[^>]*?data-field="${field.key}"[^>]*?>)(.*?)(<\\/[^>]*?>)`, "g");
        html = html.replace(regex, `$1${value}$3`);
      }
    });

    return html;
  }
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    thumbnail: "",
    isActive: true,
  });

  /* ─────────────────────── fetch ─────────────────────── */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.get<any>(`/admin/templates/${id}`);
        setTemplate(data.data);
        setFormData({
          name: data.data.name || "",
          description: data.data.description || "",
          thumbnail: data.data.thumbnail || "",
          isActive: data.data.isActive ?? true,
        });
      } catch (err) {
        setError("Failed to load template");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

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
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/admin/templates/${id}`, formData);
      setSuccess("Template updated successfully");
      setTimeout(() => router.push("/admin/templates"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save template");
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
          <p style={{ color: "var(--bw-muted)" }}>Loading template…</p>
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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Edit Template
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
              {template?.name}
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

        {/* ── Alerts ── */}
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

        {/* ── Info Box ── */}
        <div
          className="mb-6 p-4 rounded-[var(--bw-radius-md)] text-sm"
          style={{
            background: "rgba(59,130,246,0.1)",
            color: "rgb(59,130,246)",
            border: "1px solid rgba(59,130,246,0.3)",
          }}
        >
          ℹ️ You can only update the template name, description, thumbnail, and status. To modify fields, HTML, or CSS, create a new template version.
        </div>

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* ── Left Column: Editable Fields ── */}
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
                <div>
                  <label className={labelCls}>Template Name</label>
                  <input
                    className={inputBase}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Template name"
                  />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    className={inputBase}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Template description…"
                    rows={3}
                  />
                </div>

                <div>
                  <label className={labelCls}>Thumbnail URL</label>
                  <input
                    className={inputBase}
                    type="text"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleInputChange}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  {formData.thumbnail && (
                    <div className="mt-2">
                      <img
                        src={formData.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full max-w-xs h-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

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
                    className="text-[11px] mt-1.5"
                    style={{ color: "var(--bw-ghost)" }}
                  >
                    Inactive templates cannot be assigned to magazines
                  </p>
                </div>
              </div>
            </div>

            {/* Template Details (Read-only) - HTML templates only */}
            {template?.type === "html" && (
              <div
                className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
                style={{
                  background: "var(--bw-surface)",
                  border: "1px solid var(--bw-border)",
                  boxShadow: "var(--bw-shadow-sm)",
                }}
              >

                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="text-lg font-bold"
                    style={{ fontFamily: "var(--bw-font-display)" }}
                  >
                    Template Code (Read-only)
                  </h2>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none flex items-center gap-2"
                    style={{
                      background: showPreview ? "var(--bw-green)" : "var(--bw-ink)",
                      color: "var(--bw-bg)",
                    }}
                  >
                    {showPreview ? "✓ Preview Active" : "👁️ Show Live Preview"}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>HTML Template</label>
                    <div
                      className="rounded-[var(--bw-radius-md)] p-3 max-h-48 overflow-y-auto font-mono text-xs"
                      style={{
                        background: "var(--bw-bg)",
                        border: "1px solid var(--bw-border)",
                        color: "var(--bw-muted)",
                        fontFamily: "var(--bw-font-mono)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {template?.html || "No HTML defined"}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>CSS Styles</label>
                    <div
                      className="rounded-[var(--bw-radius-md)] p-3 max-h-40 overflow-y-auto font-mono text-xs"
                      style={{
                        background: "var(--bw-bg)",
                        border: "1px solid var(--bw-border)",
                        color: "var(--bw-muted)",
                        fontFamily: "var(--bw-font-mono)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {template?.css || "No CSS defined"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Canvas Preview - Canvas templates only */}
            {template?.type === "canvas" && (
              <div
                className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
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
                  Canvas Template (Read-only)
                </h2>
                <CanvasEditor
                  backgroundImage={template?.canvas?.backgroundImage || ""}
                  backgroundZIndex={template?.canvas?.zIndex ?? 2}
                  placeholders={template?.imagePlaceholders || []}
                  textPlaceholders={template?.textPlaceholders || []}
                  readOnly={true}
                />
              </div>
            )}
            {/* Preview Card */}
            {showPreview && (
              <div
                className="rounded-[var(--bw-radius-lg)] overflow-hidden"
                style={{
                  background: "var(--bw-surface)",
                  border: "2px solid var(--bw-green)",
                  boxShadow: "0 8px 32px rgba(34,197,94,0.15)",
                }}
              >
                <div
                  className="px-5 py-3 border-b"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    borderColor: "var(--bw-border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h2
                      className="text-lg font-bold flex items-center gap-2"
                      style={{ fontFamily: "var(--bw-font-display)" }}
                    >
                      <span style={{ color: "var(--bw-green)" }}>●</span>
                      Live Preview
                    </h2>
                    <span className="text-xs font-semibold" style={{ color: "var(--bw-green)" }}>
                      A4 · Updates in real-time
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* Test Data Inputs */}
                  {template?.fields && template.fields.length > 0 && (
                    <div
                      className="mb-6 p-4 rounded-[var(--bw-radius-md)] border"
                      style={{
                        background: "var(--bw-bg)",
                        borderColor: "var(--bw-border)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold" style={{ color: "var(--bw-ink)" }}>
                          📝 Test Content (Preview Only)
                        </p>
                        <button
                          onClick={() => {
                            setTestData({});
                            setTestImages({});
                          }}
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{
                            background: "rgba(100,100,100,0.1)",
                            color: "var(--bw-muted)",
                          }}
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {template.fields.map((field: any, index: number) => (
                          <div key={index}>
                            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--bw-ink)" }}>
                              {field.label || field.key}
                              {field.required && <span style={{ color: "var(--bw-red)" }}> *</span>}
                            </label>
                            {field.type === "image" ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <label
                                    className="px-4 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] cursor-pointer transition-all"
                                    style={{
                                      background: "var(--bw-ink)",
                                      color: "var(--bw-bg)",
                                    }}
                                  >
                                    📁 Choose Image
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleTestImageUpload(field.key, e)}
                                      className="hidden"
                                    />
                                  </label>
                                  {testImages[field.key] && (
                                    <button
                                      onClick={() => {
                                        const newImages = { ...testImages };
                                        const newData = { ...testData };
                                        delete newImages[field.key];
                                        delete newData[field.key];
                                        setTestImages(newImages);
                                        setTestData(newData);
                                      }}
                                      className="text-xs font-semibold px-2 py-1 rounded"
                                      style={{
                                        background: "rgba(220,38,38,0.1)",
                                        color: "var(--bw-red)",
                                      }}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                                {testImages[field.key] && (
                                  <img
                                    src={testImages[field.key]}
                                    alt="Preview"
                                    className="w-full max-w-xs h-auto rounded border"
                                    style={{ borderColor: "var(--bw-border)" }}
                                  />
                                )}
                              </div>
                            ) : field.type === "textarea" ? (
                              <textarea
                                className={`${inputBase} text-xs`}
                                value={testData[field.key] || ""}
                                onChange={(e) => setTestData({ ...testData, [field.key]: e.target.value })}
                                placeholder={field.placeholder || field.defaultValue || `Enter ${field.label || field.key}`}
                                rows={3}
                              />
                            ) : (
                              <input
                                className={`${inputBase} text-xs`}
                                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                value={testData[field.key] || ""}
                                onChange={(e) => setTestData({ ...testData, [field.key]: e.target.value })}
                                placeholder={field.placeholder || field.defaultValue || `Enter ${field.label || field.key}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* A4 Rendered Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold" style={{ color: "var(--bw-ink)" }}>
                        🎨 Rendered Output
                      </p>
                      <span className="text-xs" style={{ color: "var(--bw-ghost)" }}>
                        A4 · 210×297mm
                      </span>
                    </div>
                    <div
                      ref={previewContainerRef}
                      className="rounded-[var(--bw-radius-md)] overflow-hidden mx-auto"
                      style={{
                        border: "1px solid var(--bw-border)",
                        width: "100%",
                        maxWidth: `${A4_WIDTH_PX}px`,
                        aspectRatio: `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}`,
                        background: "#ffffff",
                        boxShadow: "var(--bw-shadow-sm)",
                      }}
                    >
                      <iframe
                        title="Template Preview"
                        srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body { width: ${A4_WIDTH_PX}px; height: ${A4_HEIGHT_PX}px; overflow: hidden; }
                    ${template?.css || ""}
                  </style>
                </head>
                <body>${renderPreview()}</body>
              </html>
            `}
                        style={{
                          width: `${A4_WIDTH_PX}px`,
                          height: `${A4_HEIGHT_PX}px`,
                          border: "none",
                          transform: `scale(${previewScale})`,
                          transformOrigin: "top left",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Fields (Read-only) - HTML templates only */}
            {template?.type === "html" && (
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
                  Dynamic Fields (Read-only)
                </h2>

                {!template?.fields || template.fields.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--bw-muted)" }}>
                    No fields defined
                  </p>
                ) : (
                  <div className="space-y-3">
                    {template.fields.map((field: any, index: number) => (
                      <div
                        key={index}
                        className="rounded-[var(--bw-radius-md)] p-4 border"
                        style={{
                          background: "var(--bw-bg)",
                          borderColor: "var(--bw-border)",
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{field.label || field.key}</p>
                            <code
                              className="text-xs"
                              style={{
                                color: "var(--bw-muted)",
                                fontFamily: "var(--bw-font-mono)",
                              }}
                            >
                              {field.key}
                            </code>
                          </div>
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded"
                            style={{
                              background: "var(--bw-border)",
                              color: "var(--bw-muted)",
                            }}
                          >
                            {field.type}
                          </span>
                        </div>
                        {field.placeholder && (
                          <p
                            className="text-xs mt-2"
                            style={{ color: "var(--bw-ghost)" }}
                          >
                            Placeholder: {field.placeholder}
                          </p>
                        )}
                        {field.required && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--bw-ghost)" }}
                          >
                            ✓ Required field
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Column: Summary ── */}
          <div className="lg:col-span-1">
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
                Template Info
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={labelCls.replace("mb-1.5", "")}>Status</span>
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
                  <span className={labelCls.replace("mb-1.5", "")}>Version</span>
                  <span className="text-sm font-semibold">
                    v{template?.version || 1}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={labelCls.replace("mb-1.5", "")}>Fields</span>
                  <span className="text-sm font-semibold">
                    {template?.fields?.length || 0}
                  </span>
                </div>

                <div className="h-px" style={{ background: "var(--bw-divider)" }} />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--bw-ghost)" }}>
                    Template ID
                  </p>
                  <code
                    className="text-[10px] mt-1 block break-all"
                    style={{
                      color: "var(--bw-muted)",
                      fontFamily: "var(--bw-font-mono)",
                    }}
                  >
                    {template?._id}
                  </code>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mt-3" style={{ color: "var(--bw-ghost)" }}>
                    Created
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--bw-muted)" }}
                  >
                    {new Date(template?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-6 px-4 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
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
