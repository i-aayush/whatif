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
    webpack: (config, { isServer }) => {
        config.resolve.fallback = { fs: false, path: false };
        config.optimization = {
            ...config.optimization,
            splitChunks: {
                chunks: 'all',
                minSize: 20000,
                maxSize: 244000,
                cacheGroups: {
                    spline: {
                        test: /[\\/]node_modules[\\/](@splinetool)[\\/]/,
                        name: 'spline-vendor',
                        priority: 10,
                        reuseExistingChunk: true,
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                },
            },
        };
        return config;
    },
    experimental: {
        optimizeCss: true,
    },
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

// Combine the configurations
module.exports = withBundleAnalyzer(nextConfig); 


