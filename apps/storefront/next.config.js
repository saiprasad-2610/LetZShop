/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined,
  experimental: { cpus: 1 },
  transpilePackages: ['@simply/ui', '@simply/api-contracts', '@simply/types', '@simply/config', '@simply/i18n'],
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  async rewrites() {
    const apiUrl = (process.env.INTERNAL_API_URL || process.env.API_URL || process.env.API_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${apiUrl}/media/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
