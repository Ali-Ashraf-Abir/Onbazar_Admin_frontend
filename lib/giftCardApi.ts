import api from "@/lib/api";

export async function downloadGiftCardPdf(
    orderId: string,
    itemIndex: number,
    filename: string,
): Promise<void> {
    const blob = await api.getBlob(
        `/admin/orders/${orderId}/items/${itemIndex}/giftcard-pdf`
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}