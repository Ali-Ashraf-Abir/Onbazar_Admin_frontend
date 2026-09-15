"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

interface FontDoc {
  _id: string;
  name: string;
  family: string;
  fileUrl: string;
  format: string;
  weight: number;
  style: "normal" | "italic";
  isActive: boolean;
  createdAt: string;
}

const WEIGHT_OPTIONS = [
  { value: 100, label: "Thin" },
  { value: 300, label: "Light" },
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "SemiBold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "ExtraBold" },
  { value: 900, label: "Black" },
];

export default function AdminFontsPage() {
  const [fonts, setFonts] = useState<FontDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    family: "",
    weight: 400,
    style: "normal" as "normal" | "italic",
  });
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: FontDoc[] }>("/fonts");
      setFonts(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load fonts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);

    // Pre-fill name/family from the filename so admins rarely have to type them.
    if (f && !form.name) {
      const base = f.name.replace(/\.[^/.]+$/, "");
      setForm((prev) => ({
        ...prev,
        name: prev.name || base,
        family: prev.family || base.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      }));
    }
  }

  async function handleUpload() {
    setError("");
    setSuccess("");

    if (!file) {
      setError("Choose a font file (.woff2, .woff, .ttf, or .otf)");
      return;
    }
    if (!form.name.trim()) {
      setError("Font name is required");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.family)) {
      setError("Family must be lowercase letters, numbers, and hyphens only");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", form.name.trim());
      fd.append("family", form.family.trim());
      fd.append("weight", String(form.weight));
      fd.append("style", form.style);

      await api.post("/fonts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Font uploaded successfully");
      setForm({ name: "", family: "", weight: 400, style: "normal" });
      setFile(null);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload font");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this font? Templates already using it will fall back to a system font.")) {
      return;
    }

    setDeletingId(id);
    setError("");
    try {
      await api.delete(`/fonts/${id}`);
      setFonts((prev) => prev.filter((f) => f._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete font");
      console.error(err);
    } finally {
      setDeletingId(null);
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

  // Grouped by family so multiple weights/styles of the same typeface sit together.
  const grouped = fonts.reduce<Record<string, FontDoc[]>>((acc, f) => {
    (acc[f.family] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bw-bg)",
        color: "var(--bw-ink)",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Fonts
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--bw-muted)" }}>
              Upload custom fonts for use in canvas templates
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
            ← Back to Templates
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
          {/* ── Upload Card ── */}
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
                className="text-lg font-bold mb-5"
                style={{ fontFamily: "var(--bw-font-display)" }}
              >
                Upload Font
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Font File</label>
                  <label
                    className="flex items-center justify-center w-full px-3 py-6 text-sm font-semibold rounded-[var(--bw-radius-md)] border border-dashed cursor-pointer text-center"
                    style={{
                      borderColor: "var(--bw-border)",
                      color: file ? "var(--bw-ink)" : "var(--bw-muted)",
                      background: "var(--bw-input-bg)",
                    }}
                  >
                    {file ? `📄 ${file.name}` : "📁 Choose .woff2 / .woff / .ttf / .otf"}
                    <input
                      type="file"
                      accept=".woff2,.woff,.ttf,.otf,.eot"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className={labelCls}>Display Name</label>
                  <input
                    className={inputBase}
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Brand Display Bold"
                  />
                </div>

                <div>
                  <label className={labelCls}>Family (CSS identifier)</label>
                  <input
                    className={inputBase}
                    type="text"
                    value={form.family}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        family: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                      })
                    }
                    placeholder="brand-display"
                  />
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--bw-ghost)" }}>
                    Lowercase, hyphens only. Multiple weights/styles can reuse the same
                    family — e.g. upload "brand-display" as both Regular and Bold.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Weight</label>
                    <div className="relative">
                      <select
                        className={selectBase}
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value, 10) })}
                      >
                        {WEIGHT_OPTIONS.map((w) => (
                          <option key={w.value} value={w.value}>
                            {w.label} ({w.value})
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
                    <label className={labelCls}>Style</label>
                    <div className="relative">
                      <select
                        className={selectBase}
                        value={form.style}
                        onChange={(e) =>
                          setForm({ ...form, style: e.target.value as "normal" | "italic" })
                        }
                      >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                      </select>
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
                        style={{ color: "var(--bw-ghost)" }}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-6 px-4 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
              >
                {uploading ? "Uploading…" : "Upload Font"}
              </button>
            </div>
          </div>

          {/* ── Font List ── */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-16">
                <div className="text-3xl mb-3 animate-pulse">⏳</div>
                <p style={{ color: "var(--bw-muted)" }}>Loading fonts…</p>
              </div>
            ) : fonts.length === 0 ? (
              <div
                className="rounded-[var(--bw-radius-lg)] p-10 text-center"
                style={{
                  background: "var(--bw-surface)",
                  border: "1px solid var(--bw-border)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--bw-muted)" }}>
                  No fonts uploaded yet. Upload one to make it available in the canvas editor.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(grouped).map(([family, variants]) => (
                  <div
                    key={family}
                    className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6"
                    style={{
                      background: "var(--bw-surface)",
                      border: "1px solid var(--bw-border)",
                      boxShadow: "var(--bw-shadow-sm)",
                    }}
                  >
                    <style>
                      {variants
                        .map(
                          (f) => `
@font-face {
  font-family: 'admin-preview-${f._id}';
  src: url('${f.fileUrl}') format('${f.format}');
  font-weight: ${f.weight};
  font-style: ${f.style};
}`
                        )
                        .join("\n")}
                    </style>

                    <p
                      className="text-xs font-mono mb-3"
                      style={{ color: "var(--bw-ghost)" }}
                    >
                      {family}
                    </p>

                    <div className="space-y-3">
                      {variants.map((f) => (
                        <div
                          key={f._id}
                          className="flex items-center justify-between gap-4 rounded-[var(--bw-radius-md)] p-3 border"
                          style={{ borderColor: "var(--bw-border)", background: "var(--bw-bg)" }}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate"
                              style={{
                                fontFamily: `'admin-preview-${f._id}', sans-serif`,
                                fontWeight: f.weight,
                                fontStyle: f.style,
                                fontSize: 20,
                              }}
                            >
                              {f.name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--bw-muted)" }}>
                              {f.weight} · {f.style} · {f.format}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(f._id)}
                            disabled={deletingId === f._id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none cursor-pointer disabled:opacity-50"
                            style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)" }}
                          >
                            {deletingId === f._id ? "Deleting…" : "🗑️ Delete"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}