import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Only run ESLint on specific directories during build
    dirs: ['app', 'components', 'lib'],
    // Allow production builds to complete even with ESLint warnings
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
