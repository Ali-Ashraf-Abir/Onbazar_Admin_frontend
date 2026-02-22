"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    ReactNode,
} from "react";
import api, { setAccessToken, clearAccessToken } from "../lib/api";

/* ── types ──────────────────────────────────────────────────────────── */
export interface AdminUser {
    _id:           string;
    fullName:      string;
    email:         string;
    phone:         string | null;
    role:          "customer" | "admin" | "superadmin";
    tags:          string[];
    loyaltyPoints: number;
    isActive:      boolean;
    emailVerified: boolean;
    createdAt:     string;
    updatedAt:     string;
}

interface AuthContextValue {
    user:         AdminUser | null;
    isLoading:    boolean;
    isAdmin:      boolean;
    isSuperAdmin: boolean;
    login:        (email: string, password: string) => Promise<AdminUser>;
    logout:       () => Promise<void>;
}

interface LoginResponse {
    success:     boolean;
    accessToken: string;
    data:        AdminUser;
}

interface MeResponse {
    success: boolean;
    data:    AdminUser;
}

interface RefreshResponse {
    success:     boolean;
    accessToken: string;
}

/* ── context ────────────────────────────────────────────────────────── */
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user,      setUser]      = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const didRestore                = useRef(false);

    /* ── restore session once on mount ───────────────────────────────── */
    useEffect(() => {
        if (didRestore.current) return;
        didRestore.current = true;

        (async () => {
            try {
                const refresh = await api.post<RefreshResponse>("/auth/refresh");
                setAccessToken(refresh.accessToken);

                const me = await api.get<MeResponse>("/auth/me");
                setUser(me.data);
            } catch {
                // No valid session — stay logged out, don't redirect here
                clearAccessToken();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    /* ── login ────────────────────────────────────────────────────────── */
    const login = useCallback(async (email: string, password: string): Promise<AdminUser> => {
        const res = await api.post<LoginResponse>("/auth/login", { email, password });
        setAccessToken(res.accessToken);
        setUser(res.data);
        return res.data;
    }, []);

    /* ── logout ───────────────────────────────────────────────────────── */
    const logout = useCallback(async (): Promise<void> => {
        try {
            await api.post("/auth/logout");
        } catch {
            // swallow — log out locally regardless
        }
        clearAccessToken();
        setUser(null);
    }, []);

    const value: AuthContextValue = {
        user,
        isLoading,
        login,
        logout,
        isAdmin:      user?.role === "admin" || user?.role === "superadmin",
        isSuperAdmin: user?.role === "superadmin",
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}