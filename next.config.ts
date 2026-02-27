// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source:      "/api/:path*",
                destination: "https://on-bazar-backend.vercel.app/api/:path*",
            },
        ];
    },
};

export default nextConfig;