"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import CanvasEditor, { CanvasPlaceholder, A4_WIDTH_PX, A4_HEIGHT_PX } from "../canvas-editor";

const FIELD_TYPES = ["text", "textarea", "image", "number", "date"];

interface Field {
  key: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  defaultValue: string;
}

export default function AdminCreateTemplatePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [templateType, setTemplateType] = useState<"html" | "canvas">("html");
  const A4_WIDTH_PX = 794;   // 210mm at 96dpi
  const A4_HEIGHT_PX = 1123; // 297mm at 96dpi
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: 1,
    type: "html" as "html" | "canvas",
    html: "",
    css: "",
    thumbnail: "",
    isActive: true,
    backgroundImage: "",
  });

  const [fields, setFields] = useState<Field[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [testImages, setTestImages] = useState<Record<string, string>>({});
  const [canvasData, setCanvasData] = useState<{
    backgroundImage: string;
    imagePlaceholders: CanvasPlaceholder[];
  }>({
    backgroundImage: "",
    imagePlaceholders: [],
  });

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

  function addField() {
    setFields([
      ...fields,
      {
        key: "",
        label: "",
        type: "text",
        placeholder: "",
        required: false,
        defaultValue: "",
      },
    ]);
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  function updateField(
    index: number,
    field: string,
    value: string | boolean
  ) {
    const updated = [...fields];
    updated[index] = { ...updated[index], [field]: value };
    setFields(updated);
  }

  function handleJsonImport() {
    try {
      const parsed = JSON.parse(jsonInput);

      if (parsed.name) setFormData(prev => ({ ...prev, name: parsed.name }));
      if (parsed.description) setFormData(prev => ({ ...prev, description: parsed.description }));
      if (parsed.html) setFormData(prev => ({ ...prev, html: parsed.html }));
      if (parsed.css) setFormData(prev => ({ ...prev, css: parsed.css }));
      if (parsed.version) setFormData(prev => ({ ...prev, version: parsed.version }));
      if (parsed.thumbnail) setFormData(prev => ({ ...prev, thumbnail: parsed.thumbnail }));

      if (parsed.fields && Array.isArray(parsed.fields)) {
        setFields(parsed.fields);
      }

      setShowJsonImport(false);
      setJsonInput("");
      setError("");
    } catch (err) {
      setError("Invalid JSON format. Please check your input.");
    }
  }

  function handleTestImageUpload(fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTestImages(prev => ({ ...prev, [fieldKey]: reader.result as string }));
        setTestData(prev => ({ ...prev, [fieldKey]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

  function renderPreview() {
    let html = formData.html;

    // Replace field placeholders with test data
    fields.forEach(field => {
      const value = testData[field.key] || field.defaultValue || `[${field.label || field.key}]`;

      // Replace {{fieldKey}} syntax
      html = html.replace(new RegExp(`{{${field.key}}}`, 'g'), value);

      // Also replace data-field attributes for compatibility
      if (field.type === 'image') {
        // Replace images with data-field attribute
        const imgRegex = new RegExp(`<img([^>]*?)data-field="${field.key}"([^>]*?)>`, 'g');
        html = html.replace(imgRegex, (match, before, after) => {
          // Keep other attributes but update src
          const updatedSrc = value || 'https://via.placeholder.com/400x300?text=Upload+Image';
          return `<img${before}data-field="${field.key}"${after.replace(/src="[^"]*"/, '')} src="${updatedSrc}">`;
        });
      } else {
        // Replace text content with data-field attribute
        const regex = new RegExp(`(<[^>]*?data-field="${field.key}"[^>]*?>)(.*?)(<\\/[^>]*?>)`, 'g');
        html = html.replace(regex, `$1${value}$3`);
      }
    });

    return html;
  }

  async function handleCreate() {
    setError("");

    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    if (templateType === "html") {
      if (!formData.html.trim()) {
        setError("HTML template is required");
        return;
      }

      // Validate field keys are unique
      const fieldKeys = new Set<string>();
      for (const field of fields) {
        if (!field.key.trim()) {
          setError("All fields must have a key");
          return;
        }
        if (fieldKeys.has(field.key)) {
          setError(`Duplicate field key: ${field.key}`);
          return;
        }
        fieldKeys.add(field.key);
      }

      setSaving(true);
      try {
        const payload = {
          ...formData,
          type: "html",
          fields: fields.map((f) => ({
            key: f.key.trim(),
            label: f.label.trim() || f.key.trim(),
            type: f.type,
            placeholder: f.placeholder,
            required: f.required,
            defaultValue: f.defaultValue,
          })),
        };

        const response = await api.post("/admin/templates", payload);
        router.push(`/admin/templates/${(response as any).data._id}`);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to create template");
        console.error(err);
      } finally {
        setSaving(false);
      }
    } else {
      // Canvas template
      if (!canvasData.backgroundImage) {
        setError("Background image is required for canvas templates");
        return;
      }

      if (canvasData.imagePlaceholders.length === 0) {
        setError("At least one image placeholder is required");
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
  }

  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] w-full " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";

  const selectBase = `${inputBase} cursor-pointer appearance-none`;
  const labelCls =
    "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";
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
  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bw-bg)",
        color: "var(--bw-ink)",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
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
              Design a new page template for magazines
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJsonImport(true)}
              className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
              style={{
                background: "var(--bw-surface)",
                borderColor: "var(--bw-border)",
                color: "var(--bw-ink)",
              }}
            >
              📋 Import JSON
            </button>
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

        {/* ── Template Type Selector ── */}
        <div
          className="mb-6 p-4 rounded-[var(--bw-radius-md)]"
          style={{
            background: "var(--bw-surface)",
            border: "1px solid var(--bw-border)",
          }}
        >
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--bw-ink)" }}
          >
            Template Type
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="html"
                checked={templateType === "html"}
                onChange={(e) => {
                  setTemplateType(e.target.value as "html" | "canvas");
                  setFormData({ ...formData, type: "html" });
                }}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm">HTML Template</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="canvas"
                checked={templateType === "canvas"}
                onChange={(e) => {
                  setTemplateType(e.target.value as "html" | "canvas");
                  setFormData({ ...formData, type: "canvas" });
                }}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm">Canvas Editor (Canva-like)</span>
            </label>
          </div>
          <p
            className="text-xs mt-2"
            style={{ color: "var(--bw-muted)" }}
          >
            {templateType === "html"
              ? "Create templates using HTML/CSS with dynamic fields"
              : "Create templates by uploading an image and defining image placement zones"}
          </p>
        </div>

        {/* ── Info Box ── */}
        {templateType === "html" && (
          <div
            className="mb-6 p-4 rounded-[var(--bw-radius-md)] text-sm"
            style={{
              background: "rgba(59,130,246,0.1)",
              color: "rgb(59,130,246)",
              border: "1px solid rgba(59,130,246,0.3)",
            }}
          >
            💡 <strong>Pro Tip:</strong> Use AI to generate your template! Ask an AI to create JSON with name, description, html, css, and fields array. Then click "Import JSON" and paste it here.
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* ── Left Column: Template Info ── */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
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
                </div>

                <div>
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
                </div>
              </div>
            </div>

            {/* HTML/CSS Card - Only for HTML templates */}
            {templateType === "html" && (
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
                    Template Code
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
                    <label className={labelCls}>HTML Template *</label>
                    <textarea
                      className={`${inputBase} font-mono text-xs`}
                      name="html"
                      value={formData.html}
                      onChange={handleInputChange}
                      placeholder='<div class="page"><h1>{{title}}</h1><img src="{{image}}" /><p>{{content}}</p></div>'
                      rows={10}
                      style={{ fontFamily: "var(--bw-font-mono)" }}
                    />
                    <p
                      className="text-[10px] mt-1.5"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      Use {`{{fieldKey}}`} syntax for dynamic fields
                    </p>
                  </div>

                  <div>
                    <label className={labelCls}>CSS Styles</label>
                    <textarea
                      className={`${inputBase} font-mono text-xs`}
                      name="css"
                      value={formData.css}
                      onChange={handleInputChange}
                      placeholder=".page { padding: 40px; background: white; } h1 { font-size: 32px; }"
                      rows={8}
                      style={{ fontFamily: "var(--bw-font-mono)" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Canvas Editor - Only for Canvas templates */}
            {templateType === "canvas" && (
              <CanvasEditor
                backgroundImage={canvasData.backgroundImage}
                placeholders={canvasData.imagePlaceholders}
                onChange={(data) => setCanvasData(data)}
              />
            )}

            {/* Fields Card - Only for HTML templates */}
            {templateType === "html" && (
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
                    Dynamic Fields
                  </h2>
                  <button
                    type="button"
                    onClick={addField}
                    className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer"
                    style={{
                      background: "var(--bw-ink)",
                      color: "var(--bw-bg)",
                    }}
                  >
                    + Add Field
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: "var(--bw-muted)" }}>
                      No fields defined yet. Click "Add Field" to create dynamic content areas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={index}
                        className="rounded-[var(--bw-radius-md)] p-4 border"
                        style={{
                          background: "var(--bw-bg)",
                          borderColor: "var(--bw-border)",
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs font-bold" style={{ color: "var(--bw-ghost)" }}>
                            Field {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="text-xs font-semibold px-2 py-1 rounded cursor-pointer border-none"
                            style={{
                              background: "rgba(220,38,38,0.15)",
                              color: "rgb(220,38,38)",
                            }}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Key *</label>
                            <input
                              className={inputBase}
                              type="text"
                              value={field.key}
                              onChange={(e) =>
                                updateField(index, "key", e.target.value)
                              }
                              placeholder="title"
                            />
                          </div>

                          <div>
                            <label className={labelCls}>Label</label>
                            <input
                              className={inputBase}
                              type="text"
                              value={field.label}
                              onChange={(e) =>
                                updateField(index, "label", e.target.value)
                              }
                              placeholder="Page Title"
                            />
                          </div>

                          <div>
                            <label className={labelCls}>Type</label>
                            <div className="relative">
                              <select
                                className={selectBase}
                                value={field.type}
                                onChange={(e) =>
                                  updateField(index, "type", e.target.value)
                                }
                              >
                                {FIELD_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <span
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
                                style={{ color: "var(--bw-ghost)" }}
                              >
                                ▼
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className={labelCls}>Placeholder</label>
                            <input
                              className={inputBase}
                              type="text"
                              value={field.placeholder}
                              onChange={(e) =>
                                updateField(index, "placeholder", e.target.value)
                              }
                              placeholder="Enter title…"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className={labelCls}>Default Value</label>
                            <input
                              className={inputBase}
                              type="text"
                              value={field.defaultValue}
                              onChange={(e) =>
                                updateField(index, "defaultValue", e.target.value)
                              }
                              placeholder="Optional default value"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(index, "required", e.target.checked)
                                }
                                className="w-3 h-3 rounded cursor-pointer"
                              />
                              <span>Required field</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                {/* Preview Header */}
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
                      Updates in real-time
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* Test Data Inputs */}
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

                    {fields.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: "var(--bw-muted)" }}>
                        Add fields below to test your template with sample data
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {fields.map((field, index) => (
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
                                onChange={(e) =>
                                  setTestData({ ...testData, [field.key]: e.target.value })
                                }
                                placeholder={field.placeholder || `Enter ${field.label || field.key}`}
                                rows={3}
                              />
                            ) : (
                              <input
                                className={`${inputBase} text-xs`}
                                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                value={testData[field.key] || ""}
                                onChange={(e) =>
                                  setTestData({ ...testData, [field.key]: e.target.value })
                                }
                                placeholder={field.placeholder || `Enter ${field.label || field.key}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview Render */}
                  {formData.html ? (
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
              ${formData.css}
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
                  ) : (
                    <div
                      className="border-2 rounded-[var(--bw-radius-md)] flex items-center justify-center"
                      style={{
                        background: "#ffffff",
                        borderColor: "var(--bw-border)",
                        minHeight: "300px",
                      }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3 opacity-30">📄</div>
                        <p className="text-sm" style={{ color: "var(--bw-muted)" }}>
                          Add HTML code above to see the preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
                Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={labelCls.replace("mb-1.5", "")}>Status</span>
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
                  <span className={labelCls.replace("mb-1.5", "")}>Version</span>
                  <span className="text-sm font-semibold">v{formData.version}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={labelCls.replace("mb-1.5", "")}>Fields</span>
                  <span className="text-sm font-semibold">{fields.length}</span>
                </div>

                {fields.length > 0 && (
                  <>
                    <div className="h-px" style={{ background: "var(--bw-divider)" }} />
                    <div className="text-xs space-y-1 pt-2">
                      <p className="font-semibold" style={{ color: "var(--bw-ghost)" }}>
                        Field Keys:
                      </p>
                      {fields.map((field, i) => (
                        <div
                          key={i}
                          className="pl-2 border-l flex items-center justify-between"
                          style={{ borderColor: "var(--bw-border)" }}
                        >
                          <code
                            className="font-mono text-[11px]"
                            style={{ color: "var(--bw-ink)" }}
                          >
                            {field.key || `field_${i + 1}`}
                          </code>
                          <span style={{ color: "var(--bw-ghost)" }}>{field.type}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full mt-6 px-4 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ── JSON Import Modal ── */}
      {showJsonImport && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowJsonImport(false)}
        >
          <div
            className="rounded-[var(--bw-radius-lg)] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{
              background: "var(--bw-surface)",
              border: "1px solid var(--bw-border)",
              boxShadow: "var(--bw-shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-lg font-bold mb-4"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Import Template JSON
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--bw-muted)" }}>
              Paste the complete template JSON from AI or your own design. It should include: name, description, html, css, and fields array.
            </p>

            {/* AI Prompt Helper */}
            <div
              className="mb-4 p-4 rounded-[var(--bw-radius-md)] text-xs"
              style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.3)",
                color: "rgb(59,130,246)",
              }}
            >
              <p className="font-bold mb-2">💡 Copy this prompt to use with AI:</p>
              <div
                className="p-3 rounded font-mono text-xs overflow-x-auto"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  color: "#fff",
                }}
              >
                {`Create a magazine template JSON with these requirements:
1. Use {{fieldKey}} syntax for dynamic fields (e.g., {{title}}, {{image}})
2. For images, use: <img src="{{imageFieldKey}}" />
3. Include at least 3-5 fields with types: text, textarea, or image
4. Make it visually appealing with modern CSS
5. Return ONLY valid JSON with this structure:

{
  "name": "Template Name",
  "description": "Brief description",
  "html": "<div class='container'><h1>{{title}}</h1><img src='{{coverImage}}' /><p>{{content}}</p></div>",
  "css": ".container { padding: 40px; } h1 { font-size: 32px; }",
  "fields": [
    {
      "key": "title",
      "label": "Page Title",
      "type": "text",
      "placeholder": "Enter title",
      "required": true,
      "defaultValue": ""
    },
    {
      "key": "coverImage",
      "label": "Cover Image",
      "type": "image",
      "placeholder": "",
      "required": true,
      "defaultValue": ""
    },
    {
      "key": "content",
      "label": "Content",
      "type": "textarea",
      "placeholder": "Enter content",
      "required": false,
      "defaultValue": ""
    }
  ]
}

Theme: [Describe your magazine page theme here, e.g., "modern fashion cover page" or "corporate annual report"]`}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Create a magazine template JSON with these requirements:
1. Use {{fieldKey}} syntax for dynamic fields (e.g., {{title}}, {{image}})
2. For images, use: <img src="{{imageFieldKey}}" />
3. Include at least 3-5 fields with types: text, textarea, or image
4. Make it visually appealing with modern CSS
5. Return ONLY valid JSON with this structure:

{
  "name": "Template Name",
  "description": "Brief description",
  "html": "<div class='container'><h1>{{title}}</h1><img src='{{coverImage}}' /><p>{{content}}</p></div>",
  "css": ".container { padding: 40px; } h1 { font-size: 32px; }",
  "fields": [
    {
      "key": "title",
      "label": "Page Title",
      "type": "text",
      "placeholder": "Enter title",
      "required": true,
      "defaultValue": ""
    },
    {
      "key": "coverImage",
      "label": "Cover Image",
      "type": "image",
      "placeholder": "",
      "required": true,
      "defaultValue": ""
    },
    {
      "key": "content",
      "label": "Content",
      "type": "textarea",
      "placeholder": "Enter content",
      "required": false,
      "defaultValue": ""
    }
  ]
}

Theme: [Describe your magazine page theme here]`);
                }}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded cursor-pointer"
                style={{
                  background: "rgba(59,130,246,0.2)",
                  color: "#fff",
                  border: "none",
                }}
              >
                📋 Copy Prompt
              </button>
            </div>

            <div className="mb-4">
              <label className={labelCls}>JSON Data</label>
              <textarea
                className={`${inputBase} font-mono text-xs`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`{\n  "name": "Cover Page",\n  "description": "Magazine cover",\n  "html": "<div>{{title}}</div>",\n  "css": "div { padding: 20px; }",\n  "fields": [\n    {\n      "key": "title",\n      "label": "Title",\n      "type": "text",\n      "placeholder": "Enter title",\n      "required": true,\n      "defaultValue": ""\n    }\n  ]\n}`}
                rows={15}
                style={{ fontFamily: "var(--bw-font-mono)" }}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowJsonImport(false)}
                className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] border transition-all cursor-pointer"
                style={{
                  background: "var(--bw-bg)",
                  borderColor: "var(--bw-border)",
                  color: "var(--bw-ink)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJsonImport}
                className="px-4 py-2 text-sm font-semibold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none"
                style={{
                  background: "var(--bw-ink)",
                  color: "var(--bw-bg)",
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}