import { getAccessToken, setAccessToken, clearAccessToken, ApiError } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/* ── shared refresh queue (mirrors lib/api.ts so concurrent 401s
   across the app don't fire multiple refresh requests) ────────────── */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeToRefresh(cb: (token: string | null) => void) {
    refreshSubscribers.push(cb);
}
function notifySubscribers(token: string | null) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
    if (!isRefreshing) {
        isRefreshing = true;
        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) throw new Error("Refresh failed");

            const newToken = data.accessToken as string;
            setAccessToken(newToken);
            notifySubscribers(newToken);
        } catch {
            clearAccessToken();
            notifySubscribers(null);

            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        } finally {
            isRefreshing = false;
        }
    }

    return new Promise<string | null>((resolve) => {
        subscribeToRefresh(resolve);
    });
}

async function fetchWithAuth(url: string): Promise<Response> {
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers,
    });

    if (response.status === 401) {
        const newToken = await refreshAccessToken();

        if (!newToken) {
            throw new ApiError("Session expired. Please log in again.", 401, null);
        }

        response = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: { Authorization: `Bearer ${newToken}` },
        });
    }

    return response;
}

export async function downloadGiftCardPdf(
    orderId: string,
    itemIndex: number,
    filename: string,
): Promise<void> {
    const url = `${API_URL}/admin/orders/${orderId}/items/${itemIndex}/giftcard-pdf`;

    const response = await fetchWithAuth(url);

    if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await response.json().catch(() => null)
            : await response.text().catch(() => null);

        const message =
            typeof data === "object" && data !== null && "message" in data
                ? String((data as Record<string, unknown>).message)
                : `HTTP ${response.status}`;

        throw new ApiError(message, response.status, data);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(blobUrl);
}