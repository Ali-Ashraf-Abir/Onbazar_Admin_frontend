'use client'
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const routes = [
  {
    path: "/admin/products",
    label: "Products",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    path: "/admin/orders",
    label: "Orders",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    path: "/admin/categories",
    label: "Categories",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    path: "/admin/addons",
    label: "Add-ons",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
];

/* ── Spinner SVG ── */
const Spinner = ({ size = 15 }: { size?: number }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12"/>
  </svg>
);

const LogoutIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════ */

export default function AdminNavbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut,   setLoggingOut]   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── close drawer on resize ── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── close drawer on route change ── */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  /* ── close dropdown on outside click ── */
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  /* ── logout ── */
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
      setDropdownOpen(false);
    }
  }

  /* ── avatar initials ── */
  const initials = user?.fullName
    ? user.fullName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  /* ── shared nav link styles ── */
  const navLinkBase = "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13.5px] font-medium tracking-[0.01em] whitespace-nowrap transition-all duration-150 no-underline";
  const navLinkIdle = "text-[rgba(250,250,250,0.55)] hover:text-[var(--bw-bg)] hover:bg-[rgba(250,250,250,0.07)]";
  const navLinkActive = "text-[var(--bw-ink)] bg-[var(--bw-ghost)] font-semibold";

  const mobileNavBase = "flex items-center gap-2.5 w-full px-3.5 py-3 rounded-[var(--bw-radius-md)] text-[14px] font-medium tracking-[0.01em] transition-all duration-150 no-underline";

  return (
    <>
      {/* Keyframe for mobile drawer */}
      <style>{`
        .bw-drawer { overflow: hidden; max-height: 0; opacity: 0; transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease; }
        .bw-drawer.open { max-height: 420px; opacity: 1; }
        .bw-ham-line { width: 18px; height: 1.5px; border-radius: 2px; background: var(--bw-bg); transition: transform 0.2s ease, opacity 0.2s ease; transform-origin: center; }
        .bw-ham.open .bw-ham-line:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .bw-ham.open .bw-ham-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .bw-ham.open .bw-ham-line:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
        .bw-dropdown { opacity: 0; transform: translateY(-6px) scale(0.97); pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease; transform-origin: top right; }
        .bw-dropdown.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      `}</style>

      <nav
        className="sticky top-0 z-[100] transition-shadow duration-200"
        style={{
          background: "var(--bw-ink)",
          fontFamily: "var(--bw-font-body)",
          boxShadow:  scrolled ? "0 8px 32px rgba(0,0,0,0.22)" : "none",
        }}
      >
        {/* ── Main bar ── */}
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8 md:px-6 px-4">

          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-2.5 no-underline flex-shrink-0 group">
            <div
              className="w-[34px] h-[34px] rounded-[var(--bw-radius-sm)] flex items-center justify-center transition-colors duration-150"
              style={{ background: "var(--bw-ghost)" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--bw-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-[17px] tracking-[0.01em]"
                style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-bg)" }}
              >
                OnBazar
              </span>
              <span
                className="text-[9px] font-medium tracking-[0.12em] uppercase mt-0.5 hidden sm:block"
                style={{ color: "var(--bw-ghost)" }}
              >
                Admin Console
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-0.5 list-none">
            {routes.map((r) => {
              const active = pathname === r.path;
              return (
                <li key={r.path}>
                  <Link
                    href={r.path}
                    className={`${navLinkBase} ${active ? navLinkActive : navLinkIdle}`}
                  >
                    <span style={{ opacity: active ? 1 : 0.5, flexShrink: 0, transition: "opacity 0.15s" }}>
                      {r.icon}
                    </span>
                    {r.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right: avatar + hamburger */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-150"
                style={{
                  background:  dropdownOpen ? "rgba(250,250,250,0.18)" : "rgba(250,250,250,0.10)",
                  border:      `1.5px solid ${dropdownOpen ? "var(--bw-ghost)" : "rgba(250,250,250,0.2)"}`,
                  cursor:      "pointer",
                }}
              >
                <span
                  className="text-[11px] font-semibold tracking-[0.05em]"
                  style={{ color: "var(--bw-ghost)" }}
                >
                  {initials}
                </span>
              </button>

              {/* Dropdown */}
              <div
                className={`bw-dropdown absolute top-[calc(100%+10px)] right-0 min-w-[200px] rounded-[var(--bw-radius-md)] overflow-hidden z-50 ${dropdownOpen ? "open" : ""}`}
                style={{
                  background: "var(--bw-surface)",
                  border:     "1px solid var(--bw-border)",
                  boxShadow:  "0 8px 32px rgba(0,0,0,0.16)",
                }}
              >
                {/* User info */}
                <div className="px-3.5 pt-3 pb-2.5" style={{ borderBottom: "1px solid var(--bw-border)" }}>
                  <p
                    className="text-[13px] font-semibold truncate"
                    style={{ color: "var(--bw-ink)" }}
                  >
                    {user?.fullName || "Admin"}
                  </p>
                  <p
                    className="text-[11px] mt-0.5 capitalize tracking-[0.03em]"
                    style={{ color: "var(--bw-muted)" }}
                  >
                    {user?.role || "admin"}
                  </p>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] font-medium text-left transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:  "transparent",
                    border:      "none",
                    color:       "var(--bw-red)",
                    fontFamily:  "var(--bw-font-body)",
                    cursor:      loggingOut ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bw-red-bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  {loggingOut ? <Spinner size={15} /> : <LogoutIcon size={15} />}
                  {loggingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className={`bw-ham md:hidden flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-[var(--bw-radius-sm)] transition-colors duration-150 ${menuOpen ? "open" : ""}`}
              style={{
                background: "transparent",
                border:     "none",
                cursor:     "pointer",
                padding:    6,
              }}
            >
              <span className="bw-ham-line" />
              <span className="bw-ham-line" />
              <span className="bw-ham-line" />
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        <div
          className={`bw-drawer md:hidden ${menuOpen ? "open" : ""}`}
          style={{ borderTop: "1px solid rgba(250,250,250,0.07)" }}
        >
          <ul className="list-none px-4 pt-2.5 pb-4 flex flex-col gap-0.5">
            {routes.map((r, i) => {
              const active = pathname === r.path;
              return (
                <li key={r.path}>
                  {i > 0 && (
                    <div className="h-px my-1" style={{ background: "rgba(250,250,250,0.06)" }} />
                  )}
                  <Link
                    href={r.path}
                    onClick={() => setMenuOpen(false)}
                    className={`${mobileNavBase} ${
                      active
                        ? "font-semibold"
                        : "text-[rgba(250,250,250,0.55)] hover:text-[var(--bw-bg)] hover:bg-[rgba(250,250,250,0.06)]"
                    }`}
                    style={active ? { color: "var(--bw-ink)", background: "var(--bw-ghost)" } : {}}
                  >
                    <span style={{ opacity: active ? 1 : 0.5 }}>{r.icon}</span>
                    {r.label}
                  </Link>
                </li>
              );
            })}

            {/* Mobile logout */}
            <li>
              <div className="h-px my-1" style={{ background: "rgba(250,250,250,0.06)" }} />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={`${mobileNavBase} disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  color:      "rgba(220,38,38,0.8)",
                  background: "transparent",
                  border:     "none",
                  cursor:     loggingOut ? "not-allowed" : "pointer",
                  fontFamily: "var(--bw-font-body)",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--bw-red)"; e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(220,38,38,0.8)"; e.currentTarget.style.background = "transparent"; }}
              >
                {loggingOut ? <Spinner size={16} /> : <LogoutIcon size={16} />}
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}