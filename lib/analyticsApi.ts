import api from "./api";

/* ── Query helpers ─────────────────────────────── */
export type Period = "today" | "7d" | "30d" | "90d" | "12m" | "ytd" | "all";

export interface DateRange {
  period?: Period;
  from?:   string;
  to?:     string;
}

function buildQuery(range: DateRange, extra?: Record<string, string | number>): string {
  const params = new URLSearchParams();
  if (range.from && range.to) {
    params.set("from", range.from);
    params.set("to",   range.to);
  } else if (range.period) {
    params.set("period", range.period);
  }
  if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, String(v)));
  return params.toString() ? `?${params.toString()}` : "";
}

/* ═══════════════════════════════════════════════
   Response Types
   ═══════════════════════════════════════════════ */

export interface OverviewData {
  period: { start: string; end: string };
  data: {
    orders: {
      total:    number;          // all orders in period
      active:   number;          // excludes truly lost (full/damaged/cancelled)
      change:   string | null;
      byStatus: Record<string, number>;
    };
    revenue: {
      gross:  number;            // net revenue from all contributing orders (partial refunds already deducted)
      lost:   number;            // revenue lost to full/damaged/cancelled orders
      change: string | null;
    };
    profit: {
      total:      number | null; // null if cost data missing on any order
      change:     string | null;
      incomplete: boolean;       // true if some orders are missing cost data
      lost:       number | null; // profit lost to damaged orders (0 for full refunds — product returned)
    };
    delivered: {
      orders:     number;
      revenue:    number;
      profit:     number | null; // null if cost data incomplete
      incomplete: boolean;
      change:     string | null;
    };
    // Partial refunds: orders that kept their status but returned some money to the customer.
    // These are NOT in CLOSED status — they stay active (pending/delivered/etc).
    partialRefunds: {
      count:         number;     // how many orders had a partial refund applied
      totalRefunded: number;     // total ৳ returned to customers across all partial refunds
      marginLost:    number;     // estimatedProfit - netProfit summed — profit sacrificed in partial refunds
    };
    aov:     { total: number; change: string | null };
    items:   { total: number };
    addons:  { total: number };
    payment: { cod: number; bkash: number };
  };
}

export interface TimeseriesPoint {
  label:            string;
  orders:           number;
  activeOrders:     number;
  grossRevenue:     number;   // net revenue from active orders (partial refunds deducted)
  lostRevenue:      number;   // revenue lost to closed orders
  profit:           number;   // net profit from active orders
  items:            number;
  deliveredRevenue: number;
  deliveredProfit:  number;
}

export interface TimeseriesData {
  granularity: string;
  period:      { start: string; end: string };
  data:        TimeseriesPoint[];
}

export interface StatusBreakdownItem {
  status:       string;
  count:        number;
  grossRevenue: number;   // original totalRevenue for orders in this status
  netRevenue:   number;   // post-refund netRevenue (same as grossRevenue for non-refunded)
}

export interface PaymentBreakdownItem {
  method:  string;
  count:   number;
  revenue: number;        // net revenue for this payment method (partial refunds deducted)
}

export interface TopProduct {
  _id:          string;
  name:         string;
  slug:         string;
  imageUrl:     string | null;
  totalSold:    number;
  totalRevenue: number;
  totalOrders:  number;
  avgUnitPrice: number;
}

export interface TopAddon {
  _id:          string;
  name:         string;
  imageUrl:     string | null;
  totalSold:    number;
  totalRevenue: number;
}

export interface LocationData {
  period: { start: string; end: string };
  data: {
    byZilla: Array<{ zilla: string; orders: number; revenue: number }>;
    byThana: Array<{ zilla: string; thana: string; orders: number; revenue: number }>;
  };
}

export interface RefundByType {
  refundType:  string;    // "full" | "partial" | "damaged" | "unknown"
  count:       number;
  lostRevenue: number;    // for full/damaged: originalRevenue. for partial: refundedAmount.
  lostProfit:  number;    // for full: 0 (product returned). for damaged: cost of goods.
}

export interface RefundSummary {
  totalOrders:      number;
  refundedOrders:   number;   // orders with status "refunded"
  cancelledOrders:  number;   // orders with status "cancelled"
  refundRate:       number;   // (refunded + cancelled) / total * 100
  lostRevenue:      number;   // revenue lost to fully-closed orders
  lostProfit:       number | null;  // profit lost (0 for full, positive for damaged)
  partialRefundAmt: number;   // total ৳ returned on partial refund orders
  partialCount:     number;   // count of partial refund orders
  avgLostPerOrder:  number;   // average revenue lost per closed order
}

export interface RefundData {
  period: { start: string; end: string };
  data: {
    summary:    RefundSummary;
    byType:     RefundByType[];
    timeseries: Array<{
      label:       string;
      count:       number;
      lostRevenue: number;
      partialAmt:  number;
    }>;
    byNote: Array<{
      note:        string;
      count:       number;
      lostRevenue: number;
      partialAmt:  number;
    }>;
  };
}

export interface ProfitPoint {
  label:              string;
  grossRevenue:       number;   // net revenue from active orders
  lostRevenue:        number;   // revenue lost to closed orders
  lostProfit:         number;   // profit lost (0 for full refunds, positive for damaged)
  itemCost:           number;
  profit:             number;   // net profit from active orders
  netMargin:          number | null;
  orders:             number;
  activeOrders:       number;
  hasMissingCostData: boolean;
  deliveredRevenue:   number;
  deliveredProfit:    number;
}

export interface InventoryProduct {
  _id:          string;
  name:         string;
  slug:         string;
  imageUrl:     string | null;
  price:        number;
  hasSize:      boolean;
  stockBySize:  Record<string, number> | null;
  totalStock:   number;
  isLow:        boolean;
  isOutOfStock: boolean;
}

export interface RepeatOrderData {
  period: { start: string; end: string };
  data: {
    uniqueCustomers:      number;
    repeatCustomers:      number;
    singleOrderCustomers: number;
    repeatRate:           number;
    repeatRevenue:        number;
    singleOrderRevenue:   number;
  };
}

export interface ComparisonData {
  granularity: string;
  current: {
    period: { start: string; end: string };
    data:   Array<{
      label:        string;
      orders:       number;
      activeOrders: number;
      grossRevenue: number;
      lostRevenue:  number;
      profit:       number;
    }>;
  };
  previous: {
    period: { start: string; end: string };
    data:   Array<{
      label:        string;
      orders:       number;
      activeOrders: number;
      grossRevenue: number;
      lostRevenue:  number;
      profit:       number;
    }>;
  };
}

/* ═══════════════════════════════════════════════
   API Functions
   ═══════════════════════════════════════════════ */
const BASE = "/admin/analytics";

export const analyticsApi = {
  getOverview:        (r: DateRange) => api.get<{ success: boolean } & OverviewData>(`${BASE}/overview${buildQuery(r)}`),
  getTimeseries:      (r: DateRange) => api.get<{ success: boolean } & TimeseriesData>(`${BASE}/timeseries${buildQuery(r)}`),
  getStatusBreakdown: (r: DateRange) => api.get<{ success: boolean; data: StatusBreakdownItem[] }>(`${BASE}/orders/status${buildQuery(r)}`),
  getPaymentBreakdown:(r: DateRange) => api.get<{ success: boolean; data: PaymentBreakdownItem[] }>(`${BASE}/orders/payment${buildQuery(r)}`),
  getLocations:       (r: DateRange) => api.get<{ success: boolean } & LocationData>(`${BASE}/orders/locations${buildQuery(r)}`),
  getRepeatOrders:    (r: DateRange) => api.get<{ success: boolean } & RepeatOrderData>(`${BASE}/orders/repeat${buildQuery(r)}`),
  getTopProducts:     (r: DateRange, limit = 10) => api.get<{ success: boolean; data: TopProduct[] }>(`${BASE}/products/top${buildQuery(r, { limit })}`),
  getTopAddons:       (r: DateRange, limit = 8)  => api.get<{ success: boolean; data: TopAddon[]  }>(`${BASE}/addons/top${buildQuery(r, { limit })}`),
  getInventory: (
  page = 1,
  threshold = 5,
  limit = 20
) =>
  api.get<{
    success: boolean;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    data: {
      summary: {
        total: number;
        outOfStock: number;
        lowStock: number;
        threshold: number;
      };
      products: InventoryProduct[];
    };
  }>(
    `${BASE}/products/inventory?page=${page}&limit=${limit}&lowStockThreshold=${threshold}`
  ),
  getProfitAnalytics: (r: DateRange) => api.get<{ success: boolean; granularity: string; data: ProfitPoint[] }>(`${BASE}/profit${buildQuery(r)}`),
  getRefundAnalytics: (r: DateRange) => api.get<{ success: boolean } & RefundData>(`${BASE}/refunds${buildQuery(r)}`),
  getComparison:      (year?: number, month?: string) => {
    const q = month ? `?month=${month}` : `?year=${year || new Date().getFullYear()}`;
    return api.get<{ success: boolean } & ComparisonData>(`${BASE}/compare${q}`);
  },
};