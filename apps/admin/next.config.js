/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@simply/ui', '@simply/api-contracts', '@simply/types', '@simply/config'],
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  webpack: (config, { dev }) => {
    if (dev && config.cache && typeof config.cache === 'object') {
      config.cache.compression = false;
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/commerce',
        destination: '/orders',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/:path*',
      },
      {
        source: '/api/admin/invoices/:path*',
        destination: '/api/platform/admin/invoices/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
