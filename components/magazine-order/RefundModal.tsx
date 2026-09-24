
import { MagazineOrder, patchMagazineOrder } from "@/lib/magazineOrderApi";
import { errorMessage, money } from "@/utils/adminUtils";
import { X } from "lucide-react";
import { useState } from "react";

interface RefundModalProps {
  order: MagazineOrder;
  onClose: () => void;
  onUpdated: (order: MagazineOrder) => void;
}

export function RefundModal({
  order,
  onClose,
  onUpdated,
}: RefundModalProps) {
  const maxRefund =
    order.pricing.subtotal;

  const [type, setType] = useState<
    "partial" | "full"
  >("full");

  const [amount, setAmount] =
    useState(String(maxRefund));

  const [note, setNote] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const submit = async () => {
    const refundAmount =
      type === "full"
        ? maxRefund
        : Number(amount);

    if (
      !Number.isFinite(refundAmount) ||
      refundAmount <= 0 ||
      refundAmount > maxRefund
    ) {
      return;
    }

    setSaving(true);

    try {
      const updated =
        await patchMagazineOrder(
          order._id,
          {
            refund: {
              amount: refundAmount,
              type,
              note:
                note.trim() || undefined,
            },
          }
        );

      onUpdated(updated);
      onClose();
    } catch (error) {
      alert(
        errorMessage(
          error,
          "Could not refund order."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm border border-neutral-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">
            Refund order
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-neutral-500 hover:text-neutral-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-neutral-100 pb-3 text-[13px]">
            <span className="text-neutral-500">
              Refundable subtotal
            </span>

            <span className="font-medium">
              {money(
                order.pricing.currency,
                maxRefund
              )}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium">
              Refund type
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as
                    | "partial"
                    | "full"
                )
              }
              className="h-10 w-full border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
            >
              <option value="full">
                Full refund
              </option>

              <option value="partial">
                Partial refund
              </option>
            </select>
          </div>

          {type === "partial" && (
            <div>
              <label className="mb-1 block text-[12px] font-medium">
                Amount
              </label>

              <input
                type="number"
                min={0}
                max={maxRefund}
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                className="h-10 w-full border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
              />

              <p className="mt-1 text-[11px] text-neutral-400">
                Delivery charge is
                non-refundable.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-[12px] font-medium">
              Note
            </label>

            <textarea
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              rows={3}
              className="w-full border border-neutral-300 px-3 py-2 text-[13px] outline-none focus:border-neutral-900"
              placeholder="Reason for refund..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 border border-neutral-300 px-4 text-[13px] font-medium hover:bg-neutral-100"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="h-10 bg-red-600 px-4 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saving
              ? "Refunding…"
              : "Refund order"}
          </button>
        </div>
      </div>
    </div>
  );
}