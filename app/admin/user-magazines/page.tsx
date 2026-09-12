"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "rgba(245,158,11,0.12)", color: "#d97706", label: "Draft" },
  published: { bg: "rgba(34,197,94,0.12)", color: "#16a34a", label: "Published" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}

interface UserMagazineRow {
  _id: string;
  publicId: string;
  status: string;
  magazineName: string;
  pageCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUserMagazinesPage() {
  const [rows, setRows] = useState<UserMagazineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (q) params.set("q", q);

      const res = await api.get<{ data: UserMagazineRow[]; meta: { totalPages: number } }>(
        `/admin/user-magazines?${params.toString()}`
      );
      setRows(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error("[admin magazines] load failed", err);
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload(id: string, publicId: string) {
    setDownloadingId(id);
    try {
      // Using fetch directly (not api.get) since we need the raw blob,
      // not JSON — but still need the auth header your api client adds.
      const { getAccessToken } = await import("@/lib/api");
      const token = getAccessToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api"}/admin/user-magazines/${id}/pdf`,
        {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) throw new Error(`Download failed (${res.status})`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `magazine-${publicId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("[admin magazines] download failed", err);
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--bw-font-body)", background: "var(--bw-bg)", color: "var(--bw-ink)" }}>
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <h1 className="text-[26px] font-bold tracking-wider mb-6" style={{ fontFamily: "var(--bw-font-mono)" }}>
          Saved Magazines
        </h1>

        <div className="flex gap-3 mb-5">
          <input
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            placeholder="Search by public ID…"
            className="h-10 px-3 text-[13px] rounded-[var(--bw-radius-md)]"
            style={{ border: "1.5px solid var(--bw-border)", background: "var(--bw-input-bg)" }}
          />
          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            className="h-10 px-3 text-[13px] rounded-[var(--bw-radius-md)]"
            style={{ border: "1.5px solid var(--bw-border)", background: "var(--bw-input-bg)" }}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="rounded-[var(--bw-radius-xl)] overflow-hidden" style={{ background: "var(--bw-surface)", border: "1px solid var(--bw-border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--bw-surface-alt)", borderBottom: "1px solid var(--bw-border)" }}>
                {["Magazine", "Public ID", "Status", "Pages", "Created", "Published", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--bw-ghost)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--bw-muted)" }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--bw-muted)" }}>No magazines found</td></tr>
              ) : (
                rows.map((row) => {
                  const st = STATUS_STYLES[row.status] || STATUS_STYLES.draft;
                  return (
                    <tr key={row._id} style={{ borderTop: "1px solid var(--bw-divider)" }}>
                      <td className="px-4 py-3 text-[13px] font-semibold">
                        <Link href={`/admin/user-magazines/${row._id}`} className="hover:underline">
                          {row.magazineName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono" style={{ color: "var(--bw-muted)" }}>{row.publicId}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] tabular-nums">{row.pageCount}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--bw-muted)" }}>{fmtDate(row.createdAt)}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--bw-muted)" }}>
                        {row.publishedAt ? fmtDate(row.publishedAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDownload(row._id, row.publicId)}
                          disabled={downloadingId === row._id || row.pageCount === 0}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-[var(--bw-radius-md)] disabled:opacity-50"
                          style={{ background: "rgba(59,130,246,0.10)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.25)" }}
                        >
                          {downloadingId === row._id ? "Preparing…" : "⬇ PDF"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-3 mt-5">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="text-[13px] disabled:opacity-40">← Prev</button>
          <span className="text-[13px]" style={{ color: "var(--bw-muted)" }}>Page {page} of {totalPages || 1}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="text-[13px] disabled:opacity-40">Next →</button>
        </div>
      </div>
    </div>
  );
}