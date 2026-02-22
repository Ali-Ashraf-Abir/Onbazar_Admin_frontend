"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get("reason") === "unauthorized";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(
    unauthorized ? "You don't have permission to access that page." : ""
  );
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  /* Already logged in → skip to dashboard */
  useEffect(() => {
    if (isLoading) return;
    if (user) router.replace("/admin/products");
  }, [user, isLoading, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/admin/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  /* Loading spinner while session restores */
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bw-bg)" }}
      >
        <span
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "var(--bw-ink)" }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bw-bg)", fontFamily: "var(--bw-font-body)" }}
    >
      {/* ── Left decorative panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-12 relative overflow-hidden"
        style={{ background: "var(--bw-ink)" }}
      >
        {/* Subtle grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
            opacity: 0.5,
          }}
        />

        {/* Decorative large circle */}
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        />
        <div
          className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <span
            className="text-2xl tracking-tight"
            style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-bg)" }}
          >
            OnBazar
          </span>
          <span
            className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Admin
          </span>
        </div>

        {/* Stat cards */}
        <div className="relative z-10 flex flex-col gap-4">
          {([
            { label: "Total Orders",    value: "2,847", sub: "+12% this month"      },
            { label: "Active Products", value: "364",   sub: "across 18 categories" },
            { label: "Revenue (BDT)",   value: "৳4.2M", sub: "last 30 days"         },
          ] as const).map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-xl px-5 py-4 flex items-center justify-between"
              style={{
                background: `rgba(255,255,255,${0.04 + i * 0.02})`,
                border: "1px solid rgba(255,255,255,0.08)",
                transform: `translateX(${i * 10}px)`,
                transition: "transform 0.2s",
              }}
            >
              <div>
                <p
                  className="text-[10px] uppercase tracking-widest mb-1.5"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: "var(--bw-bg)", fontFamily: "var(--bw-font-display)" }}
                >
                  {stat.value}
                </p>
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {stat.sub}
              </span>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} OnBazar. All rights reserved.
        </p>
      </div>

      {/* ── Right: login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <span
              className="text-3xl"
              style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
            >
              OnBazar
            </span>
          </div>

          {/* Heading */}
          <div className="mb-9">
            <h1
              className="text-4xl mb-2 tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "var(--bw-muted)" }}>
              Sign in to your admin account
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              style={{
                background: "var(--bw-red-bg)",
                color: "var(--bw-red)",
                border: "1px solid rgba(220,38,38,0.15)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--bw-muted)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@onbazar.com"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--bw-input-bg)",
                  border: "1.5px solid var(--bw-border)",
                  color: "var(--bw-ink)",
                  fontFamily: "var(--bw-font-body)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background  = "var(--bw-input-focus)";
                  e.currentTarget.style.borderColor = "var(--bw-ink)";
                  e.currentTarget.style.boxShadow   = "0 0 0 3px var(--bw-focus-ring)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background  = "var(--bw-input-bg)";
                  e.currentTarget.style.borderColor = "var(--bw-border)";
                  e.currentTarget.style.boxShadow   = "none";
                }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--bw-muted)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "var(--bw-input-bg)",
                    border: "1.5px solid var(--bw-border)",
                    color: "var(--bw-ink)",
                    fontFamily: "var(--bw-font-body)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background  = "var(--bw-input-focus)";
                    e.currentTarget.style.borderColor = "var(--bw-ink)";
                    e.currentTarget.style.boxShadow   = "0 0 0 3px var(--bw-focus-ring)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background  = "var(--bw-input-bg)";
                    e.currentTarget.style.borderColor = "var(--bw-border)";
                    e.currentTarget.style.boxShadow   = "none";
                  }}
                />
                {/* Show/hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
                  style={{ color: "var(--bw-ghost)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bw-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bw-ghost)")}
                >
                  {showPass ? (
                    /* Eye-off icon */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: loading ? "var(--bw-ghost)" : "var(--bw-ink)",
                color: "var(--bw-bg)",
                fontFamily: "var(--bw-font-body)",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget).style.background = "var(--bw-ink-hover)";
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget).style.background = "var(--bw-ink)";
              }}
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: "var(--bw-bg)" }}
                  />
                  Signing in…
                </>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs" style={{ color: "var(--bw-ghost)" }}>
            This portal is restricted to authorised personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}