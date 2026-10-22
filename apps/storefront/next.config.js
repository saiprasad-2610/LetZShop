/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bound static-generation workers on development/CI machines with limited commit memory.
  experimental: { cpus: 1 },
  transpilePackages: ['@simply/ui', '@simply/api-contracts', '@simply/types', '@simply/config'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
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
