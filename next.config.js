/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable source maps in both production and development
  productionBrowserSourceMaps: false,
  // This disables source maps in development without using webpack config
  experimental: {
    // This is compatible with both webpack and Turbopack
    sourceMaps: false
  }
};

module.exports = nextConfig;