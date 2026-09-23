import api from "@/lib/api";

export async function downloadGiftCardPdf(
    orderId: string,
    itemIndex: number,
    filename: string,
): Promise<void> {
    const blob = await api.getBlob(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/admin/orders/${orderId}/items/${itemIndex}/giftcard-pdf`
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