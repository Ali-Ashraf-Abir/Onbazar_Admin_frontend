"use client";

import { useState, useEffect, useCallback } from "react";
import {
    analyticsApi, Period, DateRange,
    OverviewData, TimeseriesData, StatusBreakdownItem,
    PaymentBreakdownItem, TopProduct, TopAddon,
    LocationData, ProfitPoint, InventoryProduct,
    RepeatOrderData, ComparisonData,
} from "../../../lib/analyticsApi";

import KpiCard from "../../../components/analytics/KpiCard";
import PeriodSelector from "../../../components/analytics/PeriodSelector";
import Section from "../../../components/analytics/Section";
import RevenueChart from "../../../components/analytics/RevenueChart";
import DonutChart from "../../../components/analytics/DonutCharts";
import TopProductsTable from "../../../components/analytics/TopProductsTable";
import ProfitChart from "../../../components/analytics/ProfitCharts";
import LocationChart from "../../../components/analytics/LocationCharts";
import InventoryTable from "../../../components/analytics/InventoryTable";
import ComparisonChart from "../../../components/analytics/ComparisonChart";
import RefundAnalyticsSection from "../../../components/analytics/RefundAnalyticsSection";

/* ── colour maps ───────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
    pending: "#d97706",
    confirmed: "#2563eb",
    processing: "#7c3aed",
    shipped: "#0891b2",
    delivered: "#16a34a",
    cancelled: "#dc2626",
    refunded: "#6b7280",
    "partial refund": "#f59e0b",
};
const PAYMENT_COLORS: Record<string, string> = {
    COD: "#0a0a0a",
    Bkash: "#e91e63",
};

/* ── icons ──────────────────────────────────── */
const Icon = {
    Revenue: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 1a9 9 0 100 18A9 9 0 0010 1zm0 3.5a1.5 1.5 0 011.5 1.5v.1a3 3 0 011.8 2.8 1 1 0 11-2 0 1 1 0 00-1-.9H10a.5.5 0 000 1h.5a2.5 2.5 0 010 5v.5a1 1 0 11-2 0v-.1A3 3 0 016.7 11.7a1 1 0 112 0 1 1 0 001 .9h.8a.5.5 0 000-1H10a2.5 2.5 0 010-5V6a1.5 1.5 0 011.5-1.5z" /></svg>,
    Orders: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm1 8a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
    Profit: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
    Aov: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" /></svg>,
    Items: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
    Check: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
    Lost: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
    Partial: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>,
    Refresh: () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>,
};

/* ── format ─────────────────────────────────── */
function fmt(n: number): string {
    if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
    return `৳${Math.round(n).toLocaleString()}`;
}

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════ */
export default function AnalyticsDashboard() {
    const [period, setPeriod] = useState<Period>("30d");
    const [customFrom, setCustomFrom] = useState<string>("");
    const [customTo, setCustomTo] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
    const [status, setStatus] = useState<StatusBreakdownItem[]>([]);
    const [payment, setPayment] = useState<PaymentBreakdownItem[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [topAddons, setTopAddons] = useState<TopAddon[]>([]);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [profit, setProfit] = useState<ProfitPoint[]>([]);
    const [inventory, setInventory] = useState<InventoryProduct[]>([]);
    const [repeatData, setRepeatData] = useState<RepeatOrderData | null>(null);
    const [comparison, setComparison] = useState<ComparisonData | null>(null);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [threshold, setThreshold] = useState(5);


    const [summary, setSummary] = useState<any>(null);
    const [meta, setMeta] = useState<any>(null);

    const range: DateRange = customFrom && customTo
        ? { from: customFrom, to: customTo }
        : { period };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const [ov, ts, st, pay, tp, ta, loc, prf, rep, cmp] = await Promise.allSettled([
            analyticsApi.getOverview(range),
            analyticsApi.getTimeseries(range),
            analyticsApi.getStatusBreakdown(range),
            analyticsApi.getPaymentBreakdown(range),
            analyticsApi.getTopProducts(range, 10),
            analyticsApi.getTopAddons(range, 8),
            analyticsApi.getLocations(range),
            analyticsApi.getProfitAnalytics(range),
            analyticsApi.getRepeatOrders(range),
            analyticsApi.getComparison(new Date().getFullYear()),
        ]);
        if (ov.status === "fulfilled") setOverview(ov.value);
        if (ts.status === "fulfilled") setTimeseries(ts.value);
        if (st.status === "fulfilled") setStatus(st.value.data);
        if (pay.status === "fulfilled") setPayment(pay.value.data);
        if (tp.status === "fulfilled") setTopProducts(tp.value.data);
        if (ta.status === "fulfilled") setTopAddons(ta.value.data);
        if (loc.status === "fulfilled") setLocation(loc.value);
        if (prf.status === "fulfilled") setProfit(prf.value.data);
        if (rep.status === "fulfilled") setRepeatData(rep.value);
        if (cmp.status === "fulfilled") setComparison(cmp.value);
        setLastRefresh(new Date());
        setLoading(false);
    }, [period, customFrom, customTo]);

    const fetchInventory = useCallback(async () => {
        setLoadingInventory(true);

        try {
            const r = await analyticsApi.getInventory(page, threshold, limit);

            setInventory(r.data.products);
            setSummary(r.data.summary);
            setMeta(r.meta);
        } finally {
            setLoadingInventory(false);
        }
    }, [page, threshold, limit]);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    function handlePeriodChange(p: Period) { setCustomFrom(""); setCustomTo(""); setPeriod(p); }
    function handleCustomRange(from: string, to: string) { setCustomFrom(from); setCustomTo(to); }
    function handleClearCustom() { setCustomFrom(""); setCustomTo(""); }

    const ov = overview?.data;
    const partial = ov?.partialRefunds;

    // Build status donut data, carving partial refunds out of their status bucket.
    // Partial refund orders keep their original status (e.g. "pending", "delivered"),
    // so without this they'd appear under that bucket — misleading since money was returned.
    const statusChartData = (() => {
        const partialCount = partial?.count ?? 0;
        let remaining = partialCount;

        const adjusted = status.map((s) => {
            if (remaining <= 0) return { label: s.status, value: s.count, color: STATUS_COLORS[s.status] || "#999" };
            const deduct = Math.min(remaining, s.count);
            remaining -= deduct;
            return { label: s.status, value: s.count - deduct, color: STATUS_COLORS[s.status] || "#999" };
        }).filter((s) => s.value > 0);

        if (partialCount > 0) {
            adjusted.push({ label: "partial refund", value: partialCount, color: "#f59e0b" });
        }

        return adjusted;
    })();

    const paymentChartData = payment.map((p) => ({ label: p.method, value: p.count, color: PAYMENT_COLORS[p.method] || "#555" }));

    const closedOrderCount = (ov?.orders?.byStatus?.cancelled || 0) + (ov?.orders?.byStatus?.refunded || 0);

    return (
        <div className="min-h-screen bg-[var(--bw-bg)]" style={{ fontFamily: "var(--bw-font-body)" }}>

            {/* ── Header ── */}
            <header className="sticky top-0 z-30 bg-[var(--bw-bg)]/90 backdrop-blur-md border-b border-[var(--bw-border)]">
                <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-[var(--bw-ink)]" style={{ fontFamily: "var(--bw-font-display)" }}>
                            Analytics
                        </h1>
                        <p className="text-xs text-[var(--bw-ghost)] mt-0.5">Last updated {lastRefresh.toLocaleTimeString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <PeriodSelector
                            value={period}
                            onChange={handlePeriodChange}
                            onCustomRange={handleCustomRange}
                            customFrom={customFrom}
                            customTo={customTo}
                            onClearCustom={handleClearCustom}
                        />
                        <button
                            onClick={fetchAll}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--bw-radius-md)] border border-[var(--bw-border)] text-[var(--bw-muted)] hover:text-[var(--bw-ink)] hover:bg-[var(--bw-surface-alt)] transition-colors disabled:opacity-40 cursor-pointer"
                        >
                            <span className={loading ? "animate-spin" : ""}><Icon.Refresh /></span>
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">

                {/* ── KPI Row 1 — Revenue & orders ── */}
                <div>
                    <p className="text-xs font-medium text-[var(--bw-ghost)] uppercase tracking-widest mb-2 px-0.5">
                        Revenue &amp; Orders · Partial Refunds Already Deducted
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        <KpiCard
                            label="Net Revenue"
                            value={ov?.revenue?.gross != null ? fmt(ov.revenue.gross) : "—"}
                            change={ov?.revenue?.change ?? null}
                            sub={
                                ov?.revenue?.lost
                                    ? `+${fmt(ov.revenue.lost)} lost to cancellations`
                                    : "No cancellations this period"
                            }
                            icon={<Icon.Revenue />}
                            accent="blue"
                            loading={loading}
                        />
                        <KpiCard
                            label="Net Profit"
                            value={ov?.profit?.total != null ? fmt(ov.profit.total) : "—"}
                            change={ov?.profit?.change ?? null}
                            sub={
                                ov?.profit?.incomplete
                                    ? "⚠ Cost data missing on some orders"
                                    : "Full & cancelled orders excluded"
                            }
                            icon={<Icon.Profit />}
                            accent="green"
                            loading={loading}
                        />
                        <KpiCard
                            label="Active Orders"
                            value={ov?.orders?.active?.toLocaleString() ?? "—"}
                            change={ov?.orders?.change ?? null}
                            sub={
                                ov
                                    ? `${ov.orders.byStatus.delivered || 0} delivered · ${closedOrderCount} closed`
                                    : undefined
                            }
                            icon={<Icon.Orders />}
                            accent="indigo"
                            loading={loading}
                        />
                        <KpiCard
                            label="Avg. Order Value"
                            value={ov?.aov?.total != null ? fmt(ov.aov.total) : "—"}
                            change={ov?.aov?.change ?? null}
                            sub="Active orders only"
                            icon={<Icon.Aov />}
                            accent="amber"
                            loading={loading}
                        />
                        <KpiCard
                            label="Lost Revenue"
                            value={ov?.revenue?.lost != null ? fmt(ov.revenue.lost) : "—"}
                            change={null}
                            sub={closedOrderCount ? `${closedOrderCount} orders fully closed` : "No full closures"}
                            icon={<Icon.Lost />}
                            accent="red"
                            loading={loading}
                        />
                        <KpiCard
                            label="Lost Profit"
                            value={ov?.profit?.lost != null ? fmt(ov.profit.lost) : "—"}
                            change={null}
                            sub="Damaged goods cost loss only"
                            icon={<Icon.Lost />}
                            accent="red"
                            loading={loading}
                        />
                    </div>
                </div>

                {/* ── KPI Row 2 — Partial Refunds ── */}
                {/* Only shown when there's at least one partial refund in the period */}
                {(loading || (partial && partial.count > 0)) && (
                    <div>
                        <p className="text-xs font-medium text-[var(--bw-ghost)] uppercase tracking-widest mb-2 px-0.5">
                            Partial Refunds · Orders Stayed Active, Some Money Returned
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* How many orders had a partial refund applied */}
                            <KpiCard
                                label="Partially Refunded Orders"
                                value={partial?.count != null ? partial.count.toLocaleString() : "—"}
                                change={null}
                                sub="Orders that kept their status but returned some money"
                                icon={<Icon.Partial />}
                                accent="amber"
                                loading={loading}
                            />
                            {/* Total ৳ that went back to customers across all partial refunds */}
                            <KpiCard
                                label="Total Refunded to Customers"
                                value={partial?.totalRefunded != null ? fmt(partial.totalRefunded) : "—"}
                                change={null}
                                sub="Sum of all partial amounts returned"
                                icon={<Icon.Lost />}
                                accent="amber"
                                loading={loading}
                            />
                            {/* How much profit margin was sacrificed due to partial refunds */}
                            <KpiCard
                                label="Margin Lost to Partial Refunds"
                                value={partial?.marginLost != null ? fmt(partial.marginLost) : "—"}
                                change={null}
                                sub="Reduction in profit vs original estimates"
                                icon={<Icon.Profit />}
                                accent="amber"
                                loading={loading}
                            />
                        </div>
                    </div>
                )}

                {/* ── KPI Row 3 — Delivered only ── */}
                <div>
                    <p className="text-xs font-medium text-[var(--bw-ghost)] uppercase tracking-widest mb-2 px-0.5">
                        Delivered Only · Confirmed Revenue
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3">
                        <KpiCard
                            label="Delivered Revenue"
                            value={ov?.delivered?.revenue != null ? fmt(ov.delivered.revenue) : "—"}
                            change={null}
                            sub={ov?.delivered?.orders != null ? `${ov.delivered.orders} orders confirmed` : undefined}
                            icon={<Icon.Check />}
                            accent="green"
                            loading={loading}
                        />
                        <KpiCard
                            label="Delivered Profit"
                            value={ov?.delivered?.profit != null ? fmt(ov.delivered.profit) : "—"}
                            change={ov?.delivered?.change ?? null}
                            sub={
                                ov?.delivered?.incomplete
                                    ? "⚠ Cost data missing on some orders"
                                    : "Partial refunds deducted"
                            }
                            icon={<Icon.Profit />}
                            accent="green"
                            loading={loading}
                        />
                        <KpiCard
                            label="Delivered Orders"
                            value={ov?.delivered?.orders?.toLocaleString() ?? "—"}
                            change={null}
                            sub={
                                ov?.delivered?.orders != null && ov?.orders?.total != null
                                    ? `${((ov.delivered.orders / (ov.orders.total || 1)) * 100).toFixed(1)}% of all orders`
                                    : undefined
                            }
                            icon={<Icon.Check />}
                            accent="indigo"
                            loading={loading}
                        />
                    </div>
                </div>

                {/* ── Revenue timeseries ── */}
                <Section
                    title="Revenue Over Time"
                    subtitle={`${timeseries?.granularity || "daily"} · ${customFrom && customTo ? `${customFrom} → ${customTo}` : period.toUpperCase()} · active orders only`}
                >
                    <RevenueChart
                        data={timeseries?.data || []}
                        granularity={timeseries?.granularity || "day"}
                        loading={loading}
                    />
                    {!loading && timeseries?.data?.length ? (
                        <div className="mt-4 pt-4 border-t border-[var(--bw-divider)] grid grid-cols-4 gap-4">
                            {[
                                { label: "Peak Revenue", value: fmt(Math.max(...timeseries.data.map((d) => d.grossRevenue))) },
                                { label: "Total Lost", value: fmt(timeseries.data.reduce((s, d) => s + (d.lostRevenue ?? 0), 0)) },
                                { label: "Peak Profit", value: fmt(Math.max(...timeseries.data.map((d) => d.profit ?? 0))) },
                                { label: "Peak Active Orders", value: String(Math.max(...timeseries.data.map((d) => d.activeOrders ?? 0))) },
                            ].map((m) => (
                                <div key={m.label}>
                                    <p className="text-xs text-[var(--bw-ghost)]">{m.label}</p>
                                    <p className="text-sm font-semibold text-[var(--bw-ink)] mt-0.5">{m.value}</p>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </Section>

                {/* ── Status + Payment ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Section title="Order Status" subtitle="Distribution by fulfilment state">
                        <DonutChart
                            data={statusChartData}
                            loading={loading}
                            centerLabel="Orders"
                            centerValue={(ov?.orders?.total ?? 0).toLocaleString()}
                        />
                        {!loading && ov && (
                            <div className="mt-4 pt-4 border-t border-[var(--bw-divider)] grid grid-cols-2 gap-2">
                                {Object.entries(ov.orders.byStatus).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between bg-[var(--bw-surface-alt)] rounded-[var(--bw-radius-sm)] px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 text-xs text-[var(--bw-muted)] capitalize">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[key] || "#999" }} />
                                            {key}
                                        </span>
                                        <span className="text-xs font-semibold text-[var(--bw-ink)]">{(val as number).toLocaleString()}</span>
                                    </div>
                                ))}
                                {/* Partial refunds badge — shown inline with status breakdown */}
                                {partial && partial.count > 0 && (
                                    <div className="col-span-2 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-[var(--bw-radius-sm)] px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 text-xs text-amber-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            partial refund
                                        </span>
                                        <span className="text-xs font-semibold text-amber-800">{partial.count}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </Section>

                    <Section title="Payment Methods" subtitle="Contributing orders only (partial refunds included)">
                        <DonutChart
                            data={paymentChartData}
                            loading={loading}
                            centerLabel="Payments"
                            centerValue={payment.reduce((s, p) => s + p.count, 0).toLocaleString()}
                        />
                        {!loading && payment.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[var(--bw-divider)] space-y-2">
                                {payment.map((p) => (
                                    <div key={p.method} className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-xs text-[var(--bw-muted)]">
                                            <span className="w-2 h-2 rounded-full" style={{ background: PAYMENT_COLORS[p.method] || "#555" }} />
                                            {p.method}
                                        </span>
                                        <div className="text-right space-y-0.5">
                                            <div className="text-xs">
                                                <span className="font-semibold text-[var(--bw-ink)]">{fmt(p.revenue ?? 0)}</span>
                                                <span className="text-[var(--bw-ghost)] ml-1">net revenue</span>
                                            </div>
                                            <div className="text-xs text-[var(--bw-ghost)]">{p.count} orders</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                </div>

                {/* ── Profit + Comparison ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <Section title="Profit Analysis" subtitle="Active orders only · closed orders excluded · partial refunds deducted">
                        <ProfitChart data={profit} loading={loading} />
                    </Section>
                    <Section title="Year-over-Year" subtitle={`${new Date().getFullYear()} vs ${new Date().getFullYear() - 1} · active orders`}>
                        <ComparisonChart data={comparison} loading={loading} />
                    </Section>
                </div>

                {/* ── Top Products + Addons ── */}
                <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
                    <Section title="Top Products" subtitle="By revenue · active orders only">
                        <TopProductsTable data={topProducts} loading={loading} />
                    </Section>
                    <Section title="Top Addons" subtitle="Most ordered additions · active orders">
                        {loading ? (
                            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-9 bg-[var(--bw-border)] rounded animate-pulse" />)}</div>
                        ) : topAddons.length === 0 ? (
                            <p className="text-center text-[var(--bw-ghost)] text-sm py-6">No addons data</p>
                        ) : (
                            <div className="space-y-1">
                                {topAddons.map((addon, i) => (
                                    <div key={addon._id} className="flex items-center gap-3 px-2 py-2 rounded-[var(--bw-radius-sm)] hover:bg-[var(--bw-surface-alt)] transition-colors">
                                        <span className="w-5 text-center text-xs font-semibold text-[var(--bw-ghost)]">{i + 1}</span>
                                        <div className="w-7 h-7 shrink-0 rounded-[var(--bw-radius-sm)] bg-[var(--bw-surface-alt)] border border-[var(--bw-border)] overflow-hidden">
                                            {addon.imageUrl
                                                ? <img src={addon.imageUrl} alt={addon.name} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-[var(--bw-ghost)] text-xs">+</div>}
                                        </div>
                                        <p className="flex-1 text-xs font-medium text-[var(--bw-ink)] truncate">{addon.name}</p>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-semibold text-[var(--bw-ink)]">{fmt(addon.totalRevenue)}</p>
                                            <p className="text-xs text-[var(--bw-ghost)]">{addon.totalSold}×</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                </div>

                {/* ── Location + Repeat ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <Section title="Orders by District" subtitle="Top zilas · active orders only">
                        <LocationChart data={location?.data.byZilla || []} loading={loading} />
                    </Section>
                    <Section title="Customer Retention" subtitle="Repeat vs one-time buyers · active orders">
                        {loading ? (
                            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-[var(--bw-border)] rounded animate-pulse" />)}</div>
                        ) : repeatData ? (
                            <div className="space-y-4">
                                <div className="text-center py-4">
                                    <div className="text-5xl font-bold text-[var(--bw-ink)]" style={{ fontFamily: "var(--bw-font-display)" }}>
                                        {repeatData.data.repeatRate}%
                                    </div>
                                    <p className="text-sm text-[var(--bw-muted)] mt-1">Repeat customer rate</p>
                                </div>
                                <div className="relative h-2 bg-[var(--bw-border)] rounded-full overflow-hidden">
                                    <div className="absolute left-0 top-0 h-full bg-[var(--bw-ink)] rounded-full transition-all duration-700" style={{ width: `${repeatData.data.repeatRate}%` }} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Unique Customers", value: repeatData.data.uniqueCustomers.toLocaleString(), color: "text-[var(--bw-ink)]" },
                                        { label: "Repeat Buyers", value: repeatData.data.repeatCustomers.toLocaleString(), color: "text-[var(--bw-green)]" },
                                        { label: "Repeat Revenue", value: fmt(repeatData.data.repeatRevenue), color: "text-[var(--bw-green)]" },
                                        { label: "One-time Revenue", value: fmt(repeatData.data.singleOrderRevenue), color: "text-[var(--bw-muted)]" },
                                    ].map((s) => (
                                        <div key={s.label} className="bg-[var(--bw-surface-alt)] rounded-[var(--bw-radius-md)] p-3">
                                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                            <p className="text-xs text-[var(--bw-ghost)] mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <p className="text-center text-[var(--bw-ghost)] text-sm py-8">No retention data</p>}
                    </Section>
                </div>

                {/* ── Inventory ── */}
                <Section title="Inventory Status" subtitle="Managed stock products · real-time">
                    <InventoryTable
                        data={inventory}
                        summary={summary}
                        meta={meta}
                        loading={loadingInventory}
                        onPageChange={setPage}
                    />
                </Section>

                {/* ── Refund Analytics ── */}
                <Section
                    title="Refund &amp; Cancellation Analytics"
                    subtitle="Revenue lost to closed orders · partial refunds tracked as active revenue"
                >
                    <RefundAnalyticsSection range={range} />
                </Section>

                {/* ── Thana breakdown ── */}
                {location?.data.byThana?.length ? (
                    <Section title="Top Upazilas" subtitle="Most active sub-districts · active orders">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                            {location.data.byThana.slice(0, 16).map((t) => (
                                <div key={`${t.zilla}-${t.thana}`} className="flex items-center justify-between bg-[var(--bw-surface-alt)] rounded-[var(--bw-radius-md)] px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-[var(--bw-ink)] truncate">{t.thana}</p>
                                        <p className="text-xs text-[var(--bw-ghost)] truncate">{t.zilla}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="text-xs font-semibold text-[var(--bw-ink)]">{t.orders}</p>
                                        <p className="text-xs text-[var(--bw-ghost)]">orders</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                ) : null}

                {/* ── Footer ── */}
                <div className="pt-4 pb-8 flex items-center justify-between text-xs text-[var(--bw-ghost)] border-t border-[var(--bw-divider)]">
                    <span>OnBazar Analytics · {customFrom && customTo ? `${customFrom} → ${customTo}` : period.toUpperCase()}</span>
                    <span>Updated {lastRefresh.toLocaleTimeString()}</span>
                </div>
            </main>
        </div>
    );
}