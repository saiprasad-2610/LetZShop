/** @type {import('next').NextConfig} */
const rawApiUrl = process.env.ADMIN_API_URL || process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const apiUrl = rawApiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined,
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
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${apiUrl}/media/:path*`,
      },
      {
        source: '/api/admin/invoices/:path*',
        destination: `${apiUrl}/admin/invoices/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
