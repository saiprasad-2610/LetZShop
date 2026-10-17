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
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
