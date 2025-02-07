const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: [
        'hebbkx1anhila5yf.public.blob.vercel-storage.com', 
        'whatif-genai.s3.amazonaws.com',
        'whatif-genai.s3.us-east-1.amazonaws.com',
        'replicate.delivery'
      ],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'whatif-genai.s3.amazonaws.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'whatif-genai.s3.us-east-1.amazonaws.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'replicate.delivery',
          port: '',
          pathname: '/**',
        }
      ]
    },
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/api/:path*' // Development API URL
            : '/api/:path*' // Production API URL (handled by Vercel)
        }
      ]
    },
 
    experimental: {
      optimizeCss: true,
    },
    webpack: (config, { isServer }) => {
      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.map((plugin) => {
          if (plugin.constructor.name === 'TerserPlugin') {
            return new plugin.constructor({
              ...plugin.options,
              terserOptions: {
                keep_classnames: true, // Prevents mangling of class names
                keep_fnames: true, // Prevents mangling of function names
                mangle: false, // Disables mangling altogether
              },
            });
          }
          return plugin;
        });
      }
  
      // Ensure proper handling of `@splinetool/react-spline` and `@splinetool/runtime`
      config.resolve.alias = {
        ...config.resolve.alias,
        '@splinetool/runtime': require.resolve('@splinetool/runtime'),
      };
  
      if (isServer) {
        config.externals = [
          ...config.externals,
          '@splinetool/react-spline',
          '@splinetool/runtime',
        ];
      }
  
      return config;
    },
    transpilePackages: ['@splinetool/react-spline', '@splinetool/runtime'],
  };
  
  module.exports = nextConfig;
  


