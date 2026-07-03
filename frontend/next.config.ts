import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Allow production builds to complete only if there are no TypeScript errors
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
