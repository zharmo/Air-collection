/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: 'http://localhost:5000/uploads/:path*',
            },
        ];
    },
    images: {
        domains: ['localhost'],
    },
};

module.exports = nextConfig;