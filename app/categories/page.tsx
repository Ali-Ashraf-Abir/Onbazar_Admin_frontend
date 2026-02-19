"use client";

import { useState, useEffect, useCallback, CSSProperties, FormEvent } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

/* ─────────────────────── types ─────────────────────── */

interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CategoryFormData {
    name: string;
    description: string;
    isActive: boolean;
}

interface ToastItem {
    id: number;
    message: string;
    type: "success" | "error";
}

/* ─────────────────────── helpers ─────────────────────── */

function slugify(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

/* ─────────────────────── Toast ─────────────────────── */

interface ToastProps {
    toasts: ToastItem[];
    onRemove: (id: number) => void;
}

function Toast({ toasts, onRemove }: ToastProps) {
    return (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
            {toasts.map((t) => (
                <div
                    key={t.id}
                    onClick={() => onRemove(t.id)}
                    style={{
                        background: t.type === "error" ? "var(--color-red)" : "var(--color-ink)",
                        color: "var(--color-header-text)",
                        padding: "12px 18px",
                        borderRadius: "var(--radius-md)",
                        fontSize: 14,
                        fontFamily: "var(--font-body)",
                        boxShadow: "var(--shadow-drop)",
                        cursor: "pointer",
                        animation: "slideIn 0.2s ease",
                        maxWidth: 320,
                        lineHeight: 1.4,
                    }}
                >
                    {t.message}
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────── Badge ─────────────────────── */

function Badge({ active }: { active: boolean }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                background: active ? "var(--color-green-bg)" : "var(--color-surface-alt)",
                color: active ? "var(--color-green)" : "var(--color-muted)",
                border: `1px solid ${active ? "rgba(44,107,79,0.2)" : "var(--color-border)"}`,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: active ? "var(--color-green)" : "var(--color-ghost)",
                }}
            />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

/* ─────────────────────── Modal ─────────────────────── */

interface ModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

function Modal({ open, title, onClose, children }: ModalProps) {
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(26,24,20,0.45)",
                backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 24,
                animation: "fadeIn 0.15s ease",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-drop)",
                    width: "100%", maxWidth: 480,
                    padding: "32px 32px 28px",
                    animation: "scaleIn 0.18s ease",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--color-ink)", margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={iconBtnStyle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/* ─────────────────────── Category Form ─────────────────────── */

interface CategoryFormProps {
    initial?: Category;
    onSubmit: (data: CategoryFormData) => void;
    loading: boolean;
}

function CategoryForm({ initial, onSubmit, loading }: CategoryFormProps) {
    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);
    const [focus, setFocus] = useState<string | null>(null);

    const preview = slugify(name) || "—";

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), description: description.trim(), isActive });
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
                <label style={labelStyle}>Category Name *</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocus("name")}
                    onBlur={() => setFocus(null)}
                    placeholder="e.g. Oversized Tees"
                    required
                    style={inputStyle(focus === "name")}
                />
                <p style={{ fontSize: 12, color: "var(--color-subtle)", margin: "5px 0 0", fontFamily: "var(--font-body)" }}>
                    Slug: <span style={{ color: "var(--color-accent-dark)", fontWeight: 600 }}>{preview}</span>
                </p>
            </div>

            <div>
                <label style={labelStyle}>Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => setFocus("desc")}
                    onBlur={() => setFocus(null)}
                    placeholder="Short description (optional)"
                    rows={3}
                    style={{ ...inputStyle(focus === "desc"), resize: "vertical", minHeight: 80 }}
                />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                    type="button"
                    onClick={() => setIsActive((v) => !v)}
                    style={{
                        width: 44, height: 24,
                        borderRadius: 99, border: "none", cursor: "pointer",
                        background: isActive ? "var(--color-green)" : "var(--color-ghost)",
                        position: "relative", transition: "background 0.2s",
                        flexShrink: 0,
                    }}
                    aria-label="Toggle active"
                >
                    <span style={{
                        position: "absolute",
                        top: 3, left: isActive ? 23 : 3,
                        width: 18, height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                    }} />
                </button>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-ink)" }}>
                    {isActive ? "Active — visible to storefront" : "Inactive — hidden from storefront"}
                </span>
            </div>

            <button
                type="submit"
                disabled={loading || !name.trim()}
                style={{
                    marginTop: 4,
                    padding: "13px 0",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                    background: loading || !name.trim() ? "var(--color-ghost)" : "var(--color-ink)",
                    color: "var(--color-header-text)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: 15,
                    transition: "background var(--transition-base)",
                    letterSpacing: "0.01em",
                }}
            >
                {loading ? "Saving…" : initial ? "Save Changes" : "Create Category"}
            </button>
        </form>
    );
}

/* ─────────────────────── Delete Confirm ─────────────────────── */

interface DeleteConfirmProps {
    category: Category;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

function DeleteConfirm({ category, onConfirm, onCancel, loading }: DeleteConfirmProps) {
    return (
        <div style={{ textAlign: "center", padding: "4px 0" }}>
            <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "var(--color-red-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 18px",
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                </svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--color-ink)", margin: "0 0 8px" }}>
                Delete &ldquo;{category.name}&rdquo;?
            </h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-muted)", margin: "0 0 28px", lineHeight: 1.5 }}>
                This action cannot be undone. Products linked to this category must be reassigned first.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
                <button onClick={onCancel} style={{ ...secondaryBtnStyle, flex: 1 }}>Cancel</button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    style={{
                        flex: 1, padding: "12px 0",
                        border: "none", borderRadius: "var(--radius-md)",
                        background: "var(--color-red)", color: "#fff",
                        fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "opacity var(--transition-base)",
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    {loading ? "Deleting…" : "Yes, Delete"}
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────── Main Page ─────────────────────── */

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    /* ── toasts ── */
    function addToast(message: string, type: "success" | "error" = "success") {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    }
    function removeToast(id: number) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

    /* ── fetch ── */
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/categories?includeInactive=true`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message as string);
            setCategories(json.data as Category[]);
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Failed to load categories", "error");
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    /* ── create ── */
    async function handleCreate(data: CategoryFormData) {
        setFormLoading(true);
        try {
            const res = await fetch(`${API}/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message as string);
            setCategories((prev) => [json.data as Category, ...prev]);
            setCreateOpen(false);
            addToast(`"${(json.data as Category).name}" created successfully`);
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Failed to create category", "error");
        } finally {
            setFormLoading(false);
        }
    }

    /* ── update ── */
    async function handleUpdate(data: CategoryFormData) {
        if (!editTarget) return;
        setFormLoading(true);
        try {
            const res = await fetch(`${API}/categories/${editTarget._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message as string);
            const updated = json.data as Category;
            setCategories((prev) => prev.map((c) => (c._id === editTarget._id ? updated : c)));
            setEditTarget(null);
            addToast(`"${updated.name}" updated`);
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Failed to update category", "error");
        } finally {
            setFormLoading(false);
        }
    }

    /* ── delete ── */
    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`${API}/categories/${deleteTarget._id}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message as string);
            setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
            setDeleteTarget(null);
            addToast("Category deleted");
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Failed to delete category", "error");
        } finally {
            setDeleteLoading(false);
        }
    }

    /* ── quick toggle ── */
    async function toggleActive(cat: Category) {
        try {
            const res = await fetch(`${API}/categories/${cat._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !cat.isActive }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message as string);
            const updated = json.data as Category;
            setCategories((prev) => prev.map((c) => (c._id === cat._id ? updated : c)));
            addToast(`"${updated.name}" is now ${updated.isActive ? "active" : "inactive"}`);
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Failed to update", "error");
        }
    }

    /* ── filtered list ── */
    const filtered = categories.filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filterActive === "all" ? true : filterActive === "active" ? c.isActive : !c.isActive;
        return matchSearch && matchFilter;
    });

    const totalActive = categories.filter((c) => c.isActive).length;
    const totalInactive = categories.length - totalActive;

    const stats: { label: string; value: number; color: string }[] = [
        { label: "Total", value: categories.length, color: "var(--color-ink)" },
        { label: "Active", value: totalActive, color: "var(--color-green)" },
        { label: "Inactive", value: totalInactive, color: "var(--color-muted)" },
    ];

    const filterOptions: Array<"all" | "active" | "inactive"> = ["all", "active", "inactive"];

    return (
        <>
            <style>{globalStyles}</style>
            <Toast toasts={toasts} onRemove={removeToast} />

            <div style={{ minHeight: "100vh", background: "var(--color-bg)", fontFamily: "var(--font-body)" }}>
                {/* Header */}
                <header style={{
                    background: "var(--color-ink)",
                    padding: "0 40px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    height: 64,
                    position: "sticky", top: 0, zIndex: 100,
                    boxShadow: "0 2px 16px rgba(26,24,20,0.18)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: "var(--radius-sm)",
                            background: "var(--color-accent)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                        </div>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--color-header-text)", letterSpacing: "0.01em" }}>
                            Categories
                        </span>
                    </div>
                    <div className="flex justify-center items-center gap-4 ">
                        <button  className="text-white cursor-pointer underline">
                            <a href='/'>Go To Home</a>
                        </button>
                        <button
                            onClick={() => setCreateOpen(true)}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "9px 20px",
                                background: "var(--color-accent)",
                                border: "none", borderRadius: "var(--radius-md)",
                                color: "var(--color-ink)", fontFamily: "var(--font-body)",
                                fontWeight: 700, fontSize: 14, cursor: "pointer",
                                transition: "background var(--transition-base)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-accent-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-accent)")}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            New Category
                        </button>
                    </div>
                </header>

                <main style={{ padding: "36px 40px", maxWidth: 960, margin: "0 auto" }}>
                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                        {stats.map((stat) => (
                            <div key={stat.label} style={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-lg)",
                                padding: "20px 24px",
                                boxShadow: "var(--shadow-card)",
                            }}>
                                <p style={{ margin: 0, fontSize: 12, color: "var(--color-subtle)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{stat.label}</p>
                                <p style={{ margin: "6px 0 0", fontSize: 30, fontFamily: "var(--font-display)", color: stat.color }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                            <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--color-subtle)", pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search categories…"
                                style={{ ...inputStyle(false), paddingLeft: 38, height: 40, padding: "0 14px 0 38px" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {filterOptions.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilterActive(f)}
                                    style={{
                                        padding: "7px 16px",
                                        border: filterActive === f ? "1.5px solid var(--color-ink)" : "1.5px solid var(--color-border)",
                                        borderRadius: "var(--radius-pill)",
                                        background: filterActive === f ? "var(--color-ink)" : "var(--color-surface)",
                                        color: filterActive === f ? "var(--color-header-text)" : "var(--color-muted)",
                                        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                                        cursor: "pointer", transition: "all var(--transition-fast)",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-card)",
                        overflow: "hidden",
                    }}>
                        {/* Head */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 110px 100px 88px",
                            padding: "12px 20px",
                            background: "var(--color-surface-alt)",
                            borderBottom: "1px solid var(--color-border)",
                        }}>
                            {["Name", "Slug", "Status", "Created", ""].map((h) => (
                                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                            ))}
                        </div>

                        {/* Body */}
                        {loading ? (
                            <div style={{ padding: 60, textAlign: "center", color: "var(--color-subtle)", fontSize: 14 }}>
                                Loading…
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: 60, textAlign: "center" }}>
                                <p style={{ color: "var(--color-subtle)", fontSize: 14, margin: 0 }}>
                                    {search ? `No categories match "${search}"` : "No categories yet — create your first one."}
                                </p>
                            </div>
                        ) : (
                            filtered.map((cat, i) => (
                                <div
                                    key={cat._id}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr 110px 100px 88px",
                                        padding: "14px 20px",
                                        alignItems: "center",
                                        borderBottom: i < filtered.length - 1 ? "1px solid var(--color-divider)" : "none",
                                        transition: "background var(--transition-fast)",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-alt)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--color-ink)" }}>{cat.name}</p>
                                        {cat.description && (
                                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-subtle)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                                                {cat.description}
                                            </p>
                                        )}
                                    </div>

                                    <span style={{
                                        fontFamily: "monospace", fontSize: 12,
                                        color: "var(--color-accent-dark)",
                                        background: "rgba(200,169,126,0.1)",
                                        padding: "3px 8px", borderRadius: "var(--radius-sm)",
                                        display: "inline-block", maxWidth: "90%",
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>
                                        {cat.slug}
                                    </span>

                                    <div style={{ cursor: "pointer" }} onClick={() => toggleActive(cat)} title="Click to toggle">
                                        <Badge active={cat.isActive} />
                                    </div>

                                    <span style={{ fontSize: 12, color: "var(--color-subtle)" }}>
                                        {new Date(cat.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>

                                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                        <button onClick={() => setEditTarget(cat)} style={iconBtnStyle} title="Edit">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setDeleteTarget(cat)} style={{ ...iconBtnStyle, color: "var(--color-red)" }} title="Delete">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14H6L5 6" />
                                                <path d="M10 11v6M14 11v6" />
                                                <path d="M9 6V4h6v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {!loading && filtered.length > 0 && (
                        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--color-subtle)", textAlign: "right" }}>
                            Showing {filtered.length} of {categories.length} categories
                        </p>
                    )}
                </main>
            </div>

            {/* Modals */}
            <Modal open={createOpen} title="New Category" onClose={() => setCreateOpen(false)}>
                <CategoryForm onSubmit={handleCreate} loading={formLoading} />
            </Modal>

            <Modal open={!!editTarget} title="Edit Category" onClose={() => setEditTarget(null)}>
                {editTarget && (
                    <CategoryForm initial={editTarget} onSubmit={handleUpdate} loading={formLoading} />
                )}
            </Modal>

            <Modal open={!!deleteTarget} title="Confirm Deletion" onClose={() => setDeleteTarget(null)}>
                {deleteTarget && (
                    <DeleteConfirm
                        category={deleteTarget}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteTarget(null)}
                        loading={deleteLoading}
                    />
                )}
            </Modal>
        </>
    );
}

/* ─────────────────────── shared styles ─────────────────────── */

const inputStyle = (focused: boolean): CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: "var(--radius-md)",
    border: `1.5px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
    background: focused ? "var(--color-input-focus)" : "var(--color-input-bg)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "var(--color-ink)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color var(--transition-fast), background var(--transition-fast)",
    boxShadow: focused ? "0 0 0 3px rgba(200,169,126,0.18)" : "none",
});

const labelStyle: CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--color-subtle)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 7,
    fontFamily: "var(--font-body)",
};

const iconBtnStyle: CSSProperties = {
    width: 32, height: 32,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    color: "var(--color-muted)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    transition: "background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)",
};

const secondaryBtnStyle: CSSProperties = {
    padding: "12px 0",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  :root {
    --color-bg:           #F7F4EF;
    --color-surface:      #FFFFFF;
    --color-surface-alt:  #F0EDE7;
    --color-input-bg:     #F7F4EF;
    --color-input-focus:  #FFFDF9;
    --color-ink:          #1A1814;
    --color-ink-hover:    #2E2A24;
    --color-muted:        #6B6660;
    --color-subtle:       #9C9589;
    --color-ghost:        #BDB8AF;
    --color-border:       #E8E4DC;
    --color-divider:      #F0EDE7;
    --color-border-dashed:#D4CFC6;
    --color-accent:       #C8A97E;
    --color-accent-dark:  #A07840;
    --color-accent-hover: #B8945E;
    --color-green:        #2C6B4F;
    --color-green-bg:     #F0FAF5;
    --color-green-muted:  rgba(44, 107, 79, 0.12);
    --color-red:          #C0392B;
    --color-red-bg:       #FFE8E8;
    --color-red-surface:  #FFF5F5;
    --color-header-text:  #F7F4EF;
    --font-display: 'DM Serif Display', serif;
    --font-body:    'DM Sans', sans-serif;
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   12px;
    --radius-xl:   16px;
    --radius-pill: 20px;
    --shadow-card:  0 4px 24px rgba(26, 24, 20, 0.06);
    --shadow-card-hover: 0 8px 32px rgba(26, 24, 20, 0.10);
    --shadow-drop:  0 8px 32px rgba(26, 24, 20, 0.12);
    --transition-fast: 0.15s;
    --transition-base: 0.2s;
    --transition-slow: 0.25s;
  }

  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 0; }

  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.96) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  input::placeholder, textarea::placeholder { color: var(--color-ghost); }
  input, textarea, button { font-family: var(--font-body); }
  button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
`;