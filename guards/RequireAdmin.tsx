"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth }   from "../context/AuthContext";

interface RequireAdminProps {
    children: ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
    const { user, isLoading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;                              // wait — don't redirect yet

        if (!user) {
            router.replace("/login");
            return;
        }

        if (!isAdmin) {
            router.replace("/login?reason=unauthorized");
        }
    }, [user, isLoading, isAdmin, router]);

    /* Session still restoring → spinner */
    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: "var(--color-bg)" }}
            >
                <svg
                    className="animate-spin"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ color: "var(--color-accent)" }}
                >
                    <circle
                        cx="12" cy="12" r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="32"
                        strokeDashoffset="12"
                    />
                </svg>
            </div>
        );
    }

    /* Not confirmed as admin yet → render nothing while redirect fires */
    if (!user || !isAdmin) return null;

    return <>{children}</>;
}