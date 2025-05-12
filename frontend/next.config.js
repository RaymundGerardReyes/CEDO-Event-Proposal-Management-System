/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode helps identify potential problems in an application
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    domains: ["localhost"],
    unoptimized: true, // Set to false in production for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Responsive image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Image sizes for srcset
    formats: ['image/webp', 'image/avif'], // Modern image formats
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
  },

  // API route rewrites
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : "http://localhost:5000/api/:path*",
      },
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Optimize webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Only apply in development mode
    if (dev && !isServer) {
      // Optimize module resolution
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
        ignored: /node_modules/, // Don't watch node_modules
      };
    }

    // Optimize for production
    if (!dev) {
      // Reduce bundle size by excluding certain packages from client bundles
      // config.externals = [...(config.externals || []),
      // { 'react': 'React', 'react-dom': 'ReactDOM' }
      // ];
    }

    // Add support for SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Optimize page loading
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],

  // Optimize build output
  output: 'standalone', // Creates a standalone build that's easier to deploy

  // Optimize module imports
  experimental: {
    // Optimize package imports (reduces bundle size)
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@mui/icons-material',
      '@mui/material',
      'date-fns',
      'lodash',
    ],

    // Enable server components features
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '2mb'
    },

    // Configure Turbopack for faster development
    turbo: process.env.NEXT_USE_TURBO === 'true' ? {
      rules: {
        // Add any custom Turbopack rules here
      },
    } : undefined,

    // Optimize client-side navigation
    optimisticClientCache: true,
  },

  // Configure compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,

    // Enable styled-components
    styledComponents: true,
  },

  // Configure internationalization (if needed)
  i18n: process.env.NEXT_ENABLE_I18N === 'true' ? {
    locales: ['en', 'fr', 'es'],
    defaultLocale: 'en',
  } : undefined,

  // TypeScript and ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['pages', 'app', 'components', 'lib', 'src'],
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },

  // Configure redirects (if needed)
  async redirects() {
    return [
      // Add your redirects here
      // Example:
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ]
  },

  // Configure powered by header
  poweredByHeader: false,

  // Configure trailing slash
  trailingSlash: false,

  // Configure environment variables
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || 'development',
  },

  // Configure build directory
  distDir: '.next',
}

// Conditionally apply configurations based on environment
if (process.env.ANALYZE === 'true') {
  // Enable bundle analyzer in special builds
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  })
  module.exports = withBundleAnalyzer(nextConfig)
} else {
  module.exports = nextConfig
}