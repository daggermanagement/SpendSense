/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Webpack configuration (for webpack bundler)
  webpack: (config, { dev, isServer }) => {
    // Disable source maps in development to prevent source map errors
    if (dev && !isServer) {
      config.devtool = false;
    }
    return config;
  },
  
  // Turbopack configuration (Next.js 14+)
  config: {
    turbopack: {
      resolveSourceMap: false
    }
  }
};

module.exports = nextConfig;
