"use client";

import { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, subtitle, action, children, className = "" }: SectionProps) {
  return (
    <div className={`rounded-[var(--bw-radius-lg)] bg-[var(--bw-surface)] border border-[var(--bw-border)] overflow-hidden ${className}`} style={{ boxShadow: "var(--bw-shadow-sm)" }}>
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--bw-divider)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--bw-ink)]">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--bw-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}