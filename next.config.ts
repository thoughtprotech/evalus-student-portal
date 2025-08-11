import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['ui-avatars.com'],
  },
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type-checking during build to reduce memory/time
  typescript: {
    ignoreBuildErrors: true,
  },
  // Reduce bundle graph size and build memory by splitting large package imports
  experimental: {
    optimizePackageImports: [
      'date-fns',
      'lucide-react',
      'recharts',
    ],
  },
  // Disable source maps in production to reduce memory usage during build
  productionBrowserSourceMaps: false,
  devIndicators: false
};

export default nextConfig;
