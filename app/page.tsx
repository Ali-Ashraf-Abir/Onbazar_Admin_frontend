"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: "∞",    label: "Products managed"   },
  { value: "24/7", label: "Always available"    },
  { value: "1",    label: "Source of truth"     },
  { value: "0",    label: "Compromises made"    },
];

const FEATURES = [
  {
    icon: "◈",
    title: "Product Studio",
    desc: "Create, edit, and manage your entire catalogue. Rich pricing controls, size charts, stock tracking — everything in one place.",
  },
  {
    icon: "◉",
    title: "Order Control",
    desc: "Review and manage every order end-to-end. Delivery tracking, billing, payment status — full visibility at a glance.",
  },
  {
    icon: "◎",
    title: "Analytics & Margins",
    desc: "Know your true profit on every product. Cost breakdown, margin %, purchase counters — no spreadsheets needed.",
  },
  {
    icon: "◐",
    title: "Inventory Engine",
    desc: "Per-size stock management with automatic oversell protection. Know what's in stock before your customers do.",
  },
];

export default function AdminLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [tick, setTick]         = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Subtle marquee tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "var(--bw-bg)",
        color: "var(--bw-ink)",
        fontFamily: "var(--bw-font-body)",
      }}
    >
      {/* ── Noise texture overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px",
        }}
      />

      {/* ─────────────────────── NAV ─────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.88)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--bw-border)" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
            >
              oB
            </div>
            <span
              className="text-lg tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
            >
              onBazar
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ml-1"
              style={{
                background: "var(--bw-surface-alt)",
                color: "var(--bw-muted)",
                border: "1px solid var(--bw-border)",
              }}
            >
              Admin
            </span>
          </div>

          <a
            href="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-[var(--bw-radius-md)] text-sm font-semibold transition-all duration-200 hover:opacity-80"
            style={{
              background: "var(--bw-ink)",
              color: "var(--bw-bg)",
              boxShadow: "var(--bw-shadow-sm)",
            }}
          >
            Sign in
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </nav>

      {/* ─────────────────────── HERO ─────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16"
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(var(--bw-border) 1px, transparent 1px),
              linear-gradient(90deg, var(--bw-border) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        {/* Floating orb */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle, rgba(10,10,10,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
            style={{
              background: "var(--bw-surface)",
              borderColor: "var(--bw-border)",
              color: "var(--bw-muted)",
              boxShadow: "var(--bw-shadow-sm)",
              animation: "fadeUp 0.6s ease both",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--bw-green)", animation: "blink 2s ease-in-out infinite" }}
            />
            Merchant Operations Platform
          </div>

          {/* Headline */}
          <h1
            className="text-6xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-8"
            style={{
              fontFamily: "var(--bw-font-display)",
              animation: "fadeUp 0.7s 0.1s ease both",
            }}
          >
            Run your store.
            <br />
            <span className="italic" style={{ color: "var(--bw-muted)" }}>
              With clarity.
            </span>
          </h1>

          {/* Sub */}
          <p
            className="text-lg sm:text-xl max-w-xl mx-auto mb-12 leading-relaxed"
            style={{
              color: "var(--bw-muted)",
              fontWeight: 300,
              animation: "fadeUp 0.7s 0.2s ease both",
            }}
          >
            The command centre for onBazar — products, orders, inventory and margins, all in one sharp interface.
          </p>

          {/* CTA */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animation: "fadeUp 0.7s 0.3s ease both" }}
          >
            <a
              href="/login"
              className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-[var(--bw-radius-lg)] text-base font-semibold transition-all duration-200 overflow-hidden"
              style={{
                background: "var(--bw-ink)",
                color: "var(--bw-bg)",
                boxShadow: "var(--bw-shadow-md)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--bw-shadow-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--bw-shadow-md)"; }}
            >
              Enter Admin Panel
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <span className="text-sm" style={{ color: "var(--bw-ghost)" }}>
              Authorised personnel only
            </span>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ animation: "fadeUp 1s 0.8s ease both" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--bw-ghost)" }}>
            Scroll
          </span>
          <div
            className="w-px h-10"
            style={{
              background: "linear-gradient(to bottom, var(--bw-border), transparent)",
              animation: "grow 1.5s ease-in-out infinite alternate",
            }}
          />
        </div>
      </section>

      {/* ─────────────────────── MARQUEE ─────────────────────── */}
      <div
        className="border-y py-4 overflow-hidden"
        style={{ borderColor: "var(--bw-border)", background: "var(--bw-surface-alt)" }}
      >
        <div
          className="flex gap-12 whitespace-nowrap text-sm font-semibold uppercase tracking-widest"
          style={{
            color: "var(--bw-ghost)",
            transform: `translateX(-${(tick * 0.4) % 600}px)`,
            transition: "none",
          }}
        >
          {Array.from({ length: 6 }).flatMap(() => [
            "Products", "·", "Orders", "·", "Inventory", "·", "Margins", "·", "Categories", "·", "Analytics", "·",
          ]).map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      {/* ─────────────────────── STATS ─────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ border: "1px solid var(--bw-border)" }}>
          {STATS.map(({ value, label }, i) => (
            <div
              key={i}
              className="p-8 flex flex-col gap-2"
              style={{
                background: "var(--bw-surface)",
                borderRight: i < 3 ? "1px solid var(--bw-border)" : "none",
              }}
            >
              <span
                className="text-4xl sm:text-5xl tracking-tight"
                style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
              >
                {value}
              </span>
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--bw-ghost)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── FEATURES ─────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">

          {/* Section header */}
          <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2
              className="text-4xl sm:text-5xl leading-tight tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)" }}
            >
              Everything you need.
              <br />
              <em style={{ color: "var(--bw-muted)" }}>Nothing you don't.</em>
            </h2>
            <p className="text-sm max-w-xs sm:text-right" style={{ color: "var(--bw-muted)", fontWeight: 300 }}>
              Built for speed. Designed for merchants who know what they're doing.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ border: "1px solid var(--bw-border)" }}>
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div
                key={i}
                className="p-8 flex flex-col gap-4 group transition-colors duration-200"
                style={{
                  background: "var(--bw-surface)",
                  borderRight: i % 2 === 0 ? "1px solid var(--bw-border)" : "none",
                  borderBottom: i < 2 ? "1px solid var(--bw-border)" : "none",
                  cursor: "default",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bw-surface-alt)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bw-surface)"; }}
              >
                <span
                  className="text-2xl leading-none"
                  style={{ color: "var(--bw-ink)", fontFamily: "monospace" }}
                >
                  {icon}
                </span>
                <div>
                  <h3
                    className="text-lg mb-2 tracking-tight"
                    style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--bw-muted)", fontWeight: 300 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── CTA STRIP ─────────────────────── */}
      <section className="py-8 px-6">
        <div
          className="max-w-4xl mx-auto rounded-[var(--bw-radius-xl)] p-12 sm:p-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 relative overflow-hidden"
          style={{
            background: "var(--bw-ink)",
            color: "var(--bw-bg)",
          }}
        >
          {/* Decorative grid inside CTA */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `
                linear-gradient(white 1px, transparent 1px),
                linear-gradient(90deg, white 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10">
            <p
              className="text-3xl sm:text-4xl leading-tight tracking-tight mb-3"
              style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-bg)" }}
            >
              Ready to take control?
            </p>
            <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.5)" }}>
              Log in and get back to business.
            </p>
          </div>

          <a
            href="/login"
            className="relative z-10 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-[var(--bw-radius-md)] text-sm font-bold flex-shrink-0 transition-all duration-200"
            style={{
              background: "var(--bw-bg)",
              color: "var(--bw-ink)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bw-bg-alt)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--bw-bg)"; e.currentTarget.style.transform = ""; }}
          >
            Login to onBazar Admin
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* ─────────────────────── FOOTER ─────────────────────── */}
      <footer
        className="border-t mt-8 py-8 px-6"
        style={{ borderColor: "var(--bw-border)" }}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
              style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
            >
              oB
            </div>
            <span
              className="text-sm tracking-tight"
              style={{ fontFamily: "var(--bw-font-display)", color: "var(--bw-ink)" }}
            >
              onBazar Admin
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--bw-ghost)" }}>
            Internal use only · Unauthorised access is prohibited
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes grow {
          from { transform: scaleY(0.6); opacity: 0.4; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}