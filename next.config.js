/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    // Disable source maps in development to prevent source map errors
    if (dev && !isServer) {
      config.devtool = false;
    }
    return config;
  },
};

module.exports = nextConfig;