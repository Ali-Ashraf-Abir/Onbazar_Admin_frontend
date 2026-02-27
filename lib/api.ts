/**
 * lib/api.ts
 * Central API client for the OnBazar Next.js admin panel.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/* ── in-memory token (never localStorage) ──────────────────────────── */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void { accessToken = token; }
export function getAccessToken(): string | null            { return accessToken;   }
export function clearAccessToken(): void                   { accessToken = null;   }

/* ── refresh queue ──────────────────────────────────────────────────── */
let isRefreshing       = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeToRefresh(cb: (token: string | null) => void) {
    refreshSubscribers.push(cb);
}
function notifySubscribers(token: string | null) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

/* ── error class ────────────────────────────────────────────────────── */
export class ApiError extends Error {
    status: number;
    data:   unknown;
    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.name   = "ApiError";
        this.status = status;
        this.data   = data;
    }
}

/* ── types ──────────────────────────────────────────────────────────── */
interface RequestOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
}

/* ── raw fetch wrapper (no retry logic) ─────────────────────────────── */
async function rawFetch(endpoint: string, options: RequestOptions = {}): Promise<Response> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };

    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    return fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
}

/* ── parse response ─────────────────────────────────────────────────── */
async function parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message =
            (typeof data === "object" && data !== null && "message" in data
                ? String((data as Record<string, unknown>).message)
                : null) ||
            `HTTP ${response.status}`;
        throw new ApiError(message, response.status, data);
    }

    return data as T;
}

/* ── core request (with 401 retry — but NOT for /auth/* endpoints) ─── */
async function request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let response = await rawFetch(endpoint, options);

    // Never retry refresh/login/register — would cause infinite loops
    const isAuthEndpoint = endpoint.startsWith("/auth/");

    if (response.status === 401 && !isAuthEndpoint) {
        if (!isRefreshing) {
            isRefreshing = true;
            try {
                const res      = await rawFetch("/auth/refresh", { method: "POST" });
                const data     = await res.json();
                if (!res.ok) throw new Error("Refresh failed");
                const newToken = data.accessToken as string;
                setAccessToken(newToken);
                notifySubscribers(newToken);
            } catch {
                clearAccessToken();
                notifySubscribers(null);
                if (typeof window !== "undefined") window.location.href = "/login";
                throw new ApiError("Session expired. Please log in again.", 401, null);
            } finally {
                isRefreshing = false;
            }
        }

        // Queue this request until refresh resolves
        const retryToken = await new Promise<string | null>((resolve) => {
            subscribeToRefresh(resolve);
        });

        if (!retryToken) throw new ApiError("Session expired", 401, null);

        // Retry with new token
        response = await rawFetch(endpoint, options);
    }

    return parseResponse<T>(response);
}

/* ── upload (no Content-Type — let browser set boundary) ────────────── */
async function upload<T = unknown>(
    endpoint: string,
    formData: FormData,
    method: "POST" | "PATCH" = "POST"
): Promise<T> {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        credentials: "include",
        headers,
        body: formData,
    });

    return parseResponse<T>(response);
}

/* ── public API ─────────────────────────────────────────────────────── */
const api = {
    get:    <T = unknown>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "GET" }),

    post:   <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "POST", body }),

    patch:  <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "PATCH", body }),

    delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "DELETE" }),

    upload: <T = unknown>(endpoint: string, formData: FormData) =>
        upload<T>(endpoint, formData, "POST"),

    uploadPatch: <T = unknown>(endpoint: string, formData: FormData) =>
        upload<T>(endpoint, formData, "PATCH"),
};

export default api;