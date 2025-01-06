/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/api/:path*',
            },
        ]
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, path: false };
        return config;
    },
}

module.exports = nextConfig 
