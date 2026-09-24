import {
  MagazineOrder,
  MagazineOrderStatus,
  patchMagazineOrder,
} from "@/lib/magazineOrderApi";
import { ApiError } from "@/lib/api";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { DetailRow, DrawerSection, DrawerShell, PriceRow } from "./DrawerShell";
import { errorMessage, money } from "@/utils/adminUtils";
import { RefundModal } from "./RefundModal";


function formatDate(value: string) {
  return new Date(value).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status: MagazineOrderStatus) {
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

const statusClass: Record<MagazineOrderStatus, string> = {
  pending: "border-neutral-300",
  confirmed: "border-neutral-300",
  processing: "border-neutral-300",
  shipped: "border-neutral-300",
  delivered: "border-neutral-300",
  cancelled: "border-red-200 text-red-600",
  refunded: "border-red-200 text-red-600",
};
export function OrderDrawer({
  order,
  loading,
  onClose,
  onUpdated,
}: {
  order: MagazineOrder | null;
  loading: boolean;
  onClose: () => void;
  onUpdated: (
    order: MagazineOrder
  ) => void;
}) {
  const [status, setStatus] =
    useState<MagazineOrderStatus>(
      order?.status || "pending"
    );

  const [adminNote, setAdminNote] =
    useState(order?.adminNote || "");

  const [codConfirmed, setCodConfirmed] =
    useState(
      order?.payment.cod?.confirmed || false
    );

  const [saving, setSaving] =
    useState(false);

  const [refundOpen, setRefundOpen] =
    useState(false);

  useEffect(() => {
    if (!order) return;

    setStatus(order.status);
    setAdminNote(order.adminNote || "");
    setCodConfirmed(
      order.payment.cod?.confirmed || false
    );
  }, [order]);

  if (!order && loading) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="p-6 text-[13px] text-neutral-500">
          Loading order…
        </div>
      </DrawerShell>
    );
  }

  if (!order) return null;

  const closed =
    order.status === "cancelled" ||
    order.status === "refunded";

  const save = async () => {
    setSaving(true);

    try {
      const updated =
        await patchMagazineOrder(
          order._id,
          {
            status:
              status !== order.status
                ? status
                : undefined,

            adminNote,

            ...(order.payment.method ===
              "COD"
              ? {
                  payment: {
                    cod: {
                      confirmed:
                        codConfirmed,
                    },
                  },
                }
              : {}),
          }
        );

      onUpdated(updated);
    } catch (error) {
      alert(
        errorMessage(
          error,
          "Could not update order."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DrawerShell onClose={onClose}>
        <div className="flex h-full flex-col">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
            <div>
              <h2 className="text-[16px] font-medium">
                {order.orderNumber}
              </h2>

              <p className="mt-1 text-[11px] text-neutral-400">
                {formatDate(
                  order.createdAt
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-900"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6">

            <DrawerSection title="Magazine">
              <div className="flex gap-3">
                {order.snapshot
                  .thumbnail ? (
                  <img
                    src={
                      order.snapshot
                        .thumbnail
                    }
                    alt=""
                    className="h-16 w-16 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center bg-neutral-100 text-[9px] text-neutral-400">
                    MAG
                  </div>
                )}

                <div>
                  <div className="font-medium text-[13px]">
                    {
                      order.snapshot
                        .name
                    }
                  </div>

                  <div className="mt-1 text-[12px] text-neutral-500">
                    {
                      order.snapshot
                        .pageCount
                    }{" "}
                    pages
                  </div>

                  <div className="text-[12px] text-neutral-500">
                    Quantity:{" "}
                    {order.quantity}
                  </div>
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="Customer">
              <DetailRow
                label="Name"
                value={
                  order.delivery
                    .fullName
                }
              />

              <DetailRow
                label="Phone"
                value={
                  order.delivery.phone
                }
              />

              <DetailRow
                label="Email"
                value={
                  order.delivery.email
                }
              />

              <DetailRow
                label="Address"
                value={
                  order.delivery.address
                }
              />

              <DetailRow
                label="Location"
                value={`${order.delivery.thana}, ${order.delivery.zilla}`}
              />

              {order.delivery.note && (
                <DetailRow
                  label="Note"
                  value={
                    order.delivery.note
                  }
                />
              )}
            </DrawerSection>

            <DrawerSection title="Payment">
              <DetailRow
                label="Method"
                value={
                  order.payment.method
                }
              />

              {order.payment
                .bkash
                ?.transactionId && (
                <DetailRow
                  label="Transaction"
                  value={
                    order.payment
                      .bkash
                      .transactionId
                  }
                />
              )}

              {order.payment.method ===
                "COD" && (
                <label className="mt-2 flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={
                      codConfirmed
                    }
                    disabled={closed}
                    onChange={(e) =>
                      setCodConfirmed(
                        e.target.checked
                      )
                    }
                  />

                  COD payment confirmed
                </label>
              )}
            </DrawerSection>

            <DrawerSection title="Order Summary">
              <PriceRow
                label="Items"
                value={
                  order.pricing
                    .itemsSubtotal
                }
                currency={
                  order.pricing.currency
                }
              />

              {order.pricing
                .promoDiscount > 0 && (
                <PriceRow
                  label="Discount"
                  value={
                    -order.pricing
                      .promoDiscount
                  }
                  currency={
                    order.pricing
                      .currency
                  }
                />
              )}

              <PriceRow
                label="Subtotal"
                value={
                  order.pricing.subtotal
                }
                currency={
                  order.pricing.currency
                }
              />

              <PriceRow
                label="Delivery"
                value={
                  order.pricing
                    .deliveryCharge
                }
                currency={
                  order.pricing.currency
                }
              />

              <div className="my-2 border-t border-neutral-200" />

              <div className="flex justify-between text-[13px] font-medium">
                <span>Total</span>

                <span>
                  {money(
                    order.pricing
                      .currency,
                    order.pricing
                      .grandTotal
                  )}
                </span>
              </div>
            </DrawerSection>

            <DrawerSection title="Status">
              <select
                value={status}
                disabled={closed}
                onChange={(e) =>
                  setStatus(
                    e.target.value as MagazineOrderStatus
                  )
                }
                className={`h-10 w-full border px-3 text-[13px] outline-none focus:border-neutral-900 ${
                  statusClass[status]
                }`}
              >
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
            </DrawerSection>

            <DrawerSection title="Admin Note">
              <textarea
                value={adminNote}
                disabled={closed}
                onChange={(e) =>
                  setAdminNote(
                    e.target.value
                  )
                }
                rows={4}
                className="w-full border border-neutral-300 px-3 py-2 text-[13px] outline-none focus:border-neutral-900 disabled:bg-neutral-50"
                placeholder="Internal note..."
              />
            </DrawerSection>

            {!closed && (
              <div className="py-5">
                <button
                  type="button"
                  onClick={() =>
                    setRefundOpen(true)
                  }
                  className="text-[12px] text-red-600 underline underline-offset-2"
                >
                  Refund order
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {!closed && (
            <div className="border-t border-neutral-200 bg-white px-6 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="h-10 w-full bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving…"
                  : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </DrawerShell>

      {refundOpen && (
        <RefundModal
          order={order}
          onClose={() =>
            setRefundOpen(false)
          }
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}