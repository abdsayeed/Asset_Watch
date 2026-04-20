import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    turbopack: {
        root: __dirname,
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'www.gravatar.com' },
            { protocol: 'https', hostname: 'ui-avatars.com' },
            { protocol: 'https', hostname: 'ik.imagekit.io' },
        ],
    },
};

export default nextConfig;
