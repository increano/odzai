/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['fs', 'path']
  },
  reactStrictMode: true,
  swcMinify: true,
  // Disable typechecking in Next.js (we'll handle it separately with tsc)
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Configure code splitting
  output: 'standalone',
  poweredByHeader: false,
  // Optimize production builds further
  productionBrowserSourceMaps: false,
  // Configure when to use granular chunks
  compiler: {
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  }
}

// Add bundle analyzer if requested
if (process.env.ANALYZE === 'true' || process.env.BUNDLE_ANALYZE) {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
    openAnalyzer: true,
  });
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
} 