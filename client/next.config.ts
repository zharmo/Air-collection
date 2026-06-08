import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const apiOrigin = new URL(apiUrl).origin;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
 
  images: {
    remotePatterns: [
      {
        protocol: new URL(apiOrigin).protocol.replace(':', '') as 'http' | 'https',
        hostname: new URL(apiOrigin).hostname,
        port: new URL(apiOrigin).port,
        pathname: '/uploads/**',
      },
    ],
  },
};
 
export default nextConfig;
