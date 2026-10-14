"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api, { ApiError } from "@/lib/api";

export type PuzzleFormValues = {
  name: string;
  details: string;
  isActive: boolean;
  thumbnail: string;
  maxImages: number;
  sellingPrice: number | string;
  costPrice: number | string;
  currency: string;
};

const EMPTY: PuzzleFormValues = {
  name: "",
  details: "",
  isActive: true,
  thumbnail: "",
  maxImages: 30,
  sellingPrice: "",
  costPrice: "",
  currency: "BDT",
};

const MAX_SIZE_MB = 5;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Props = {
  initial?: Partial<PuzzleFormValues>;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
};

export default function PuzzleForm({ initial, submitLabel, onSubmit }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<PuzzleFormValues>({ ...EMPTY, ...initial });
  const [preview, setPreview] = useState<string | null>(initial?.thumbnail || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [thumbError, setThumbError] = useState("");

  const inputBase =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] " +
    "px-3 py-2.5 text-sm text-[var(--bw-ink)] outline-none transition-all duration-200 " +
    "placeholder:text-[var(--bw-placeholder)] w-full " +
    "focus:border-[var(--bw-ink)] focus:bg-[var(--bw-input-focus)] focus:ring-2 focus:ring-[var(--bw-focus-ring)]";
  const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[var(--bw-ghost)]";

  async function handleThumbnail(file: File) {
    if (!ALLOWED.includes(file.type)) {
      setThumbError("Only JPEG, PNG, WEBP, or GIF images are allowed");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setThumbError(`Image must be smaller than ${MAX_SIZE_MB}MB`);
      return;
    }

    setThumbError("");
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const body = new FormData();
      body.append("thumbnail", file);
      const res = await api.upload<{ data: { url: string } }>("/admin/puzzles/upload-thumbnail", body);
      setForm((prev) => ({ ...prev, thumbnail: res.data.url }));
      setPreview(res.data.url);
    } catch (err) {
      setThumbError(err instanceof Error ? err.message : "Failed to upload image");
      setPreview(initial?.thumbnail || null);
      setForm((prev) => ({ ...prev, thumbnail: initial?.thumbnail || "" }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const sellingPrice = Number(form.sellingPrice);
    const maxImages = Number(form.maxImages);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (form.sellingPrice === "" || !Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setError("Enter a valid price");
      return;
    }
    if (!Number.isInteger(maxImages) || maxImages < 1) {
      setError("Maximum photos must be a whole number of at least 1");
      return;
    }

    const costRaw = String(form.costPrice).trim();
    const costPrice = costRaw === "" ? null : Number(costRaw);
    if (costPrice !== null && (!Number.isFinite(costPrice) || costPrice < 0)) {
      setError("Cost price must be empty or a number of 0 or more");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        details: form.details.trim(),
        thumbnail: form.thumbnail || null,
        maxImages,
        isActive: form.isActive,
        pricing: {
          sellingPrice,
          costPrice,
          currency: form.currency.trim() || "BDT",
        },
      });
      router.push("/admin/puzzles");
    } catch (err) {
      const details =
        err instanceof ApiError &&
        err.data &&
        typeof err.data === "object" &&
        Array.isArray((err.data as { errors?: string[] }).errors)
          ? (err.data as { errors: string[] }).errors.join(", ")
          : null;
      setError(details || (err instanceof Error ? err.message : "Could not save puzzle"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div
        className="rounded-[var(--bw-radius-lg)] p-5 sm:p-6 space-y-5"
        style={{
          background: "var(--bw-surface)",
          border: "1px solid var(--bw-border)",
          boxShadow: "var(--bw-shadow-sm)",
        }}
      >
        <div>
          <label className={labelCls}>Cover image</label>
          {preview ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-24 w-20 rounded object-cover" />
              <div className="flex gap-2">
                <label className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-sm)] border cursor-pointer" style={{ borderColor: "var(--bw-border)" }}>
                  Replace
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleThumbnail(file);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setForm((prev) => ({ ...prev, thumbnail: "" }));
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-[var(--bw-radius-sm)] cursor-pointer border-none"
                  style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-1.5 rounded-[var(--bw-radius-md)] border-2 border-dashed h-32 cursor-pointer"
              style={{ borderColor: "var(--bw-border)", color: "var(--bw-muted)" }}
            >
              <span className="text-xl">🧩</span>
              <span className="text-xs font-medium">Click to upload cover image</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleThumbnail(file);
                }}
              />
            </label>
          )}
          {uploading && <p className="text-[11px] mt-1.5" style={{ color: "var(--bw-muted)" }}>Uploading…</p>}
          {thumbError && <p className="text-[11px] mt-1.5" style={{ color: "rgb(220,38,38)" }}>{thumbError}</p>}
        </div>

        <div>
          <label className={labelCls}>Name *</label>
          <input
            className={inputBase}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Puzzle Image"
          />
        </div>

        <div>
          <label className={labelCls}>Details</label>
          <textarea
            className={inputBase}
            rows={4}
            value={form.details}
            onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
            placeholder="Shown on the left of the puzzle page"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Price *</label>
            <input
              className={inputBase}
              type="number"
              min="0"
              value={form.sellingPrice}
              onChange={(event) => setForm((prev) => ({ ...prev, sellingPrice: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Cost price</label>
            <input
              className={inputBase}
              type="number"
              min="0"
              value={form.costPrice}
              onChange={(event) => setForm((prev) => ({ ...prev, costPrice: event.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className={labelCls}>Max photos *</label>
            <input
              className={inputBase}
              type="number"
              min="1"
              step="1"
              value={form.maxImages}
              onChange={(event) => setForm((prev) => ({ ...prev, maxImages: Number(event.target.value) }))}
            />
          </div>
        </div>
        <p className="text-[11px] -mt-2" style={{ color: "var(--bw-ghost)" }}>
          Customers must upload at least 1 photo and cannot upload more than this number.
        </p>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-sm font-medium">Active</span>
        </label>

        {error && <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-5 py-2.5 text-sm font-bold rounded-[var(--bw-radius-md)] border-none cursor-pointer disabled:opacity-50"
            style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
          >
            {saving ? "Saving…" : submitLabel}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/puzzles")}
            className="px-4 py-2.5 text-sm font-semibold rounded-[var(--bw-radius-md)] border cursor-pointer"
            style={{ background: "var(--bw-bg)", borderColor: "var(--bw-border)", color: "var(--bw-ink)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
