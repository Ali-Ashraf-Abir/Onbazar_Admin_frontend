"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { ApiError } from "@/lib/api";

import {
  adminGetMagazineOrder,
  adminListMagazineOrders,
  bulkUpdateMagazineOrderStatus,
  patchMagazineOrder,
  type MagazineOrder,
  type MagazineOrderStatus,
} from "@/lib/magazineOrderApi";
import { OrderDrawer } from "@/components/magazine-order/OrderDrawer";

function errorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function money(
  currency: string,
  value: number
) {
  return `${currency} ${value.toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-BD",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const STATUS_OPTIONS: MagazineOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const statusClass: Record<
  MagazineOrderStatus,
  string
> = {
  pending:
    "border-amber-300 text-amber-700",
  confirmed:
    "border-blue-300 text-blue-700",
  processing:
    "border-violet-300 text-violet-700",
  shipped:
    "border-cyan-300 text-cyan-700",
  delivered:
    "border-green-600 text-green-700",
  cancelled:
    "border-red-300 text-red-600",
  refunded:
    "border-neutral-300 text-neutral-500",
};

export default function MagazineOrdersPage() {
  const [orders, setOrders] = useState<
    MagazineOrder[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] =
    useState("");

  const [status, setStatus] =
    useState<MagazineOrderStatus | "">("");

  const [method, setMethod] =
    useState("");

  const [sort, setSort] = useState<
    "newest" |
    "oldest" |
    "total_desc" |
    "total_asc"
  >("newest");

  const [selected, setSelected] =
    useState<string[]>([]);

  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] =
    useState<MagazineOrder | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [bulkStatus, setBulkStatus] =
    useState<MagazineOrderStatus | "">("");

  const [bulkSaving, setBulkSaving] =
    useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const result =
        await adminListMagazineOrders({
          page,
          limit: 20,
          q: search || undefined,
          status,
          method,
          sort,
        });

      setOrders(result.data);
      setMeta(result.meta);
      setSelected([]);
    } catch (error) {
      setLoadError(
        errorMessage(
          error,
          "Could not load magazine orders."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [
    page,
    search,
    status,
    method,
    sort,
  ]);

  const openOrder = async (
    order: MagazineOrder
  ) => {
    setSelectedOrderId(order._id);
    setDetailLoading(true);

    try {
      const fullOrder =
        await adminGetMagazineOrder(
          order._id
        );

      setSelectedOrder(fullOrder);
    } catch (error) {
      setLoadError(
        errorMessage(
          error,
          "Could not load order details."
        )
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrder = () => {
    if (detailLoading) return;

    setSelectedOrderId(null);
    setSelectedOrder(null);
  };

  const submitSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggleSelected = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    if (
      selected.length === orders.length &&
      orders.length > 0
    ) {
      setSelected([]);
      return;
    }

    setSelected(
      orders.map((order) => order._id)
    );
  };

  const applyBulkStatus = async () => {
    if (
      !bulkStatus ||
      selected.length === 0
    ) {
      return;
    }

    setBulkSaving(true);

    try {
      await bulkUpdateMagazineOrderStatus(
        selected,
        bulkStatus
      );

      setBulkStatus("");
      await loadOrders();
    } catch (error) {
      setLoadError(
        errorMessage(
          error,
          "Could not update orders."
        )
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const handleOrderUpdated = (
    updated: MagazineOrder
  ) => {
    setSelectedOrder(updated);

    setOrders((current) =>
      current.map((order) =>
        order._id === updated._id
          ? updated
          : order
      )
    );
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-neutral-900 font-sans lg:px-12">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-medium tracking-[-0.02em]">
              Magazine Orders
            </h1>

            <p className="mt-1 text-[13px] text-neutral-500">
              Manage magazine orders, payments,
              printing, and delivery.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="flex h-10 items-center gap-2 border border-neutral-300 px-4 text-[13px] font-medium transition hover:bg-neutral-100"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-5 border border-neutral-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitSearch();
                  }
                }}
                placeholder="Search order, customer, phone, email..."
                className="h-10 w-full border border-neutral-300 pl-9 pr-3 text-[13px] outline-none focus:border-neutral-900"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(
                  e.target.value as
                    | MagazineOrderStatus
                    | ""
                );
                setPage(1);
              }}
              className="h-10 border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
            >
              <option value="">
                All statuses
              </option>

              {STATUS_OPTIONS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {formatStatus(item)}
                  </option>
                )
              )}
            </select>

            <select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setPage(1);
              }}
              className="h-10 border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
            >
              <option value="">
                All payments
              </option>
              <option value="COD">
                COD
              </option>
              <option value="Bkash">
                bKash
              </option>
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(
                  e.target.value as typeof sort
                );
                setPage(1);
              }}
              className="h-10 border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
            >
              <option value="newest">
                Newest
              </option>
              <option value="oldest">
                Oldest
              </option>
              <option value="total_desc">
                Highest total
              </option>
              <option value="total_asc">
                Lowest total
              </option>
            </select>

            <button
              type="button"
              onClick={submitSearch}
              className="h-10 bg-neutral-900 px-5 text-[13px] font-medium text-white hover:bg-neutral-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Bulk toolbar */}
        {selected.length > 0 && (
          <div className="mb-4 flex items-center justify-between border border-neutral-200 bg-neutral-50 px-4 py-3">
            <span className="text-[13px] text-neutral-600">
              {selected.length} selected
            </span>

            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) =>
                  setBulkStatus(
                    e.target.value as
                      | MagazineOrderStatus
                      | ""
                  )
                }
                className="h-9 border border-neutral-300 bg-white px-3 text-[12px] outline-none focus:border-neutral-900"
              >
                <option value="">
                  Change status
                </option>

                {STATUS_OPTIONS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {formatStatus(item)}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                disabled={
                  !bulkStatus ||
                  bulkSaving
                }
                onClick={applyBulkStatus}
                className="h-9 bg-neutral-900 px-4 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkSaving
                  ? "Updating…"
                  : "Apply"}
              </button>
            </div>
          </div>
        )}

        {loadError && (
          <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {loadError}

            <button
              type="button"
              onClick={loadOrders}
              className="ml-3 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-[13px] text-neutral-500">
            Loading orders…
          </p>
        ) : orders.length === 0 ? (
          <div className="border border-neutral-200 px-4 py-10 text-center text-[13px] text-neutral-500">
            No magazine orders found.
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-200">
            <table className="w-full min-w-[1050px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        orders.length > 0 &&
                        selected.length ===
                          orders.length
                      }
                      onChange={toggleAll}
                    />
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Order
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Customer
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Magazine
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Qty
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Payment
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Total
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Date
                  </th>

                  <th className="px-4 py-3 font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(
                          order._id
                        )}
                        onChange={() =>
                          toggleSelected(
                            order._id
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {order.orderNumber}
                      </div>

                      <div className="text-[11px] text-neutral-400">
                        {order.publicId}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {order.delivery.fullName}
                      </div>

                      <div className="text-neutral-400">
                        {order.delivery.phone}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {order.snapshot
                          .thumbnail ? (
                          <img
                            src={
                              order.snapshot
                                .thumbnail
                            }
                            alt=""
                            className="h-9 w-9 object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center bg-neutral-100 text-[9px] text-neutral-400">
                            MAG
                          </div>
                        )}

                        <div>
                          <div className="font-medium">
                            {
                              order.snapshot
                                .name
                            }
                          </div>

                          <div className="text-neutral-400">
                            {
                              order.snapshot
                                .pageCount
                            }{" "}
                            pages
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      ×{order.quantity}
                    </td>

                    <td className="px-4 py-3">
                      <div>
                        {order.payment.method}
                      </div>

                      {isPaid(order) && (
                        <div className="text-[11px] text-green-600">
                          Paid
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {money(
                        order.pricing
                          .currency,
                        order.pricing
                          .grandTotal
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block border px-2 py-1 text-[11px] font-medium ${
                          statusClass[
                            order.status
                          ]
                        }`}
                      >
                        {formatStatus(
                          order.status
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(
                        order.createdAt
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            openOrder(
                              order
                            )
                          }
                          title="View order"
                          className="flex h-8 w-8 items-center justify-center text-neutral-600 hover:bg-neutral-100"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading &&
          orders.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-[13px] text-neutral-500">
              <span>
                Showing page {meta.page} of{" "}
                {meta.totalPages} ·{" "}
                {meta.total} orders
              </span>

              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((p) =>
                      Math.max(1, p - 1)
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center border border-neutral-300 disabled:opacity-40"
                >
                  <ChevronLeft
                    size={15}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    page >= meta.totalPages
                  }
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        meta.totalPages,
                        p + 1
                      )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center border border-neutral-300 disabled:opacity-40"
                >
                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Details drawer */}
      {selectedOrderId && (
        <OrderDrawer
          order={selectedOrder}
          loading={detailLoading}
          onClose={closeOrder}
          onUpdated={handleOrderUpdated}
        />
      )}
    </main>
  );
}

function isPaid(order: MagazineOrder) {
  return Boolean(
    order.payment.paidAt ||
      order.payment.cod?.confirmed
  );
}