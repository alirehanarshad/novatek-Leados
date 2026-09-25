const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  async rewrites() {
    let rawBackend = process.env.BACKEND_URL || 'http://localhost:8000';
    if (!rawBackend.startsWith('http://') && !rawBackend.startsWith('https://')) {
      rawBackend = `http://${rawBackend}`;
    }
    const backendTarget = rawBackend.endsWith('/api') ? rawBackend : `${rawBackend}/api`;
    return [
      {
        source: '/api/:path*',
        destination: `${backendTarget}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
