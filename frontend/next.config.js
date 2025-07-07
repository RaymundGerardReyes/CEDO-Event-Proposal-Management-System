const isTurbopack = process.env.TURBOPACK === '1' || process.env.NEXT_PRIVATE_TURBOPACK === '1'

/** @type {import('next').NextConfig} */
const baseConfig = {
  // React strict mode - enabled for production optimization
  reactStrictMode: true,

  // Enable compression for better performance
  compress: true,

  // Server external packages (moved from experimental)
  serverExternalPackages: ["axios", "jose", "react-google-recaptcha"],

  // PRODUCTION OPTIMIZATIONS
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  poweredByHeader: false, // Remove X-Powered-By header for security
  generateEtags: true, // Enable ETags for better caching

  // Experimental features (Windows-optimized for stable builds)
  experimental: {
    // WINDOWS FIX: Disable problematic experimental features that cause hangs
    // Only enable essential features for production stability

    // Enable scroll restoration (stable)
    scrollRestoration: true,

    // WINDOWS FIX: Disable package import optimization that causes build hangs
    // optimizePackageImports: [], // Disabled for Windows stability

    // Server Actions optimization (simplified)
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
      bodySizeLimit: "2mb",
    },

    // WINDOWS FIX: Disable optimistic client cache (can cause issues)
    // optimisticClientCache: false,

    // PRODUCTION: Enable CSS optimization only when stable
    optimizeCss: process.env.NODE_ENV === "production",

    // WINDOWS FIX: Disable webpack build worker (causes hangs on Windows)
    // webpackBuildWorker: false,

    // WINDOWS FIX: Disable parallel processing (causes Windows build issues)
    // parallelServerBuildTraces: false,
    // parallelServerCompiles: false,

    // WINDOWS FIX: Disable server components HMR cache
    // serverComponentsHmrCache: false,

    // WINDOWS FIX: Use loose CSS chunking instead of strict
    cssChunking: true,
  },

  // ENHANCED Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year cache for images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Page extensions (optimized for JavaScript)
  pageExtensions: ["js", "jsx"],

  // Build output optimization
  // output: "standalone", // Not needed for simple container

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === "production",
    dirs: ["src", "pages", "components"],
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === "production",
  },

  // Environment variables - Critical for middleware
  env: {
    APP_ENV: process.env.NODE_ENV || "development",
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:5000",
    API_URL: process.env.API_URL || "http://localhost:5000/api",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
    JWT_SECRET_DEV: process.env.JWT_SECRET_DEV,
    JWT_SECRET: process.env.JWT_SECRET,
    // Session timeout mapping
    SESSION_TIMEOUT_MINUTES: (() => {
      const raw = process.env.SESSION_TIMEOUT_MINUTES;
      const parsed = parseInt(raw, 10);
      return String(
        Number.isInteger(parsed) && parsed > 0
          ? parsed
          : 30  // fallback default
      );
    })(),
    DISABLE_GOOGLE_SIGNIN_IN_DEV: process.env.NODE_ENV === 'development' ? 'true' : 'false',
    ENABLE_DOM_ERROR_RECOVERY: 'true',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    SESSION_TIMEOUT_MINUTES: process.env.SESSION_TIMEOUT_MINUTES || '30',
  },

  // Build directory
  distDir: ".next",

  // Trailing slash configuration
  trailingSlash: false,

  // Development indicators
  devIndicators: {
    position: "bottom-right",
  },

  // PRODUCTION: Headers for performance and security
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload'
        },
        {
          key: 'Server',
          value: 'CEDO' // Custom server header
        }
      ]
    },
    {
      source: '/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],

  // PRODUCTION: Webpack optimizations (simplified to fix exports error)
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
}

// ✅ TURBOPACK CONFIGURATION
// Configure Turbopack when it's being used
if (isTurbopack) {
  baseConfig.experimental = {
    ...baseConfig.experimental,
    // Turbopack specific optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  }
}

// Simplified compiler configuration to prevent RSC conflicts
if (!isTurbopack && process.env.NODE_ENV !== "production") {
  baseConfig.compiler = {
    styledComponents: true,
  }
}

export default baseConfig;
