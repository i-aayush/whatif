/** @type {import('next').NextConfig} */
const nextConfig = {
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
    }
}

module.exports = nextConfig 
