import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['@actual-app/api'],
  },
  webpack: (config) => {
    // Add node-specific polyfills for fs, path, etc.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: require.resolve('path-browserify'),
    };
    return config;
  },
};

export default nextConfig;
