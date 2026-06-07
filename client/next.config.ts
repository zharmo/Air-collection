import type { NextConfig } from 'next';
 
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
      },
    ];
  },
 
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
};
 
export default nextConfig;
