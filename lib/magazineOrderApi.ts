import api from "@/lib/api";

export type MagazineOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type MagazineOrder = {
  _id: string;
  orderNumber: string;
  publicId: string;

  status: MagazineOrderStatus;

  snapshot: {
    name: string;
    thumbnail: string | null;
    pageCount: number;
    unitPrice: number;
    effectiveUnitPrice: number;
    unitCost: number | null;
    additionalCosts?: Record<string, number>;
    currency: string;
  };

  quantity: number;

  pricing: {
    itemsSubtotal: number;
    promoDiscount: number;
    subtotal: number;
    deliveryCharge: number;
    grandTotal: number;
    currency: string;
  };

  promo: {
    code: string;
    discountAmount: number;
    discountType?: string;
    discountValue?: number;
  } | null;

  delivery: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    zilla: string;
    thana: string;
    note?: string;
  };

  billing?: {
    sameAsDelivery?: boolean;
    fullName: string;
    email: string;
    phone: string;
  };

  payment: {
    method: string;
    paidAt?: string | null;
    cod?: {
      confirmed: boolean;
    };
    bkash?: {
      customerPhone: string | null;
      transactionId: string | null;
    };
  };

  adminNote?: string;

  refund?: {
    refundedAt: string;
    refundedAmount: number;
    refundType: "partial" | "full";
    note: string | null;
  };

  analytics?: {
    totalRevenue: number;
    totalItemCost: number | null;
    totalAdditionalCosts: Record<string, number>;
    estimatedProfit: number | null;
    refundedAmount: number | null;
    refundType: string | null;
    netRevenue: number | null;
    netProfit: number | null;
  };

  createdAt: string;
  updatedAt: string;

  userMagazine?: {
    publicId: string;
    status: string;
    publishedAt?: string;
  };

  magazine?: {
    name: string;
    thumbnail: string | null;
  };
};

export type MagazineOrderListResponse = {
  success: boolean;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: MagazineOrder[];
};

export type MagazineOrderFilters = {
  page?: number;
  limit?: number;
  q?: string;
  status?: MagazineOrderStatus | "";
  method?: string;
  sort?: "newest" | "oldest" | "total_desc" | "total_asc";
  date?: string;
  from?: string;
  to?: string;
  publicId?: string;
};

export async function adminListMagazineOrders(
  filters: MagazineOrderFilters = {}
) {
  const params = new URLSearchParams();

  params.set("page", String(filters.page || 1));
  params.set("limit", String(filters.limit || 20));

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.method) params.set("method", filters.method);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.date) params.set("date", filters.date);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.publicId) {
    params.set("publicId", filters.publicId);
  }

  return api.get<MagazineOrderListResponse>(
    `/admin/magazine-orders?${params.toString()}`
  );
}

export async function adminGetMagazineOrder(id: string) {
  const result = await api.get<{
    success: boolean;
    data: MagazineOrder;
  }>(`/admin/magazine-orders/${id}`);

  return result.data;
}

export async function patchMagazineOrder(
  id: string,
  payload: {
    status?: MagazineOrderStatus;
    adminNote?: string;
    payment?: {
      cod?: {
        confirmed?: boolean;
      };
      paidAt?: string | null;
    };
    refund?: {
      amount?: number;
      type?: "partial" | "full";
      note?: string;
    };
  }
) {
  const result = await api.patch<{
    success: boolean;
    data: MagazineOrder;
  }>(`/admin/magazine-orders/${id}`, payload);

  return result.data;
}

export async function bulkUpdateMagazineOrderStatus(
  orderIds: string[],
  newStatus: MagazineOrderStatus,
  fromStatus?: MagazineOrderStatus
) {
  return api.post<{
    success: boolean;
    updated: number;
    total: number;
    skipped: number;
  }>("/admin/magazine-orders/bulk-status", {
    orderIds,
    newStatus,
    ...(fromStatus ? { fromStatus } : {}),
  });
}