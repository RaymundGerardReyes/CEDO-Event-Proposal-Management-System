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

  // Experimental features (optimized for production)
  experimental: {
    // Enable scroll restoration
    scrollRestoration: true,

    // CRITICAL: Optimize package imports for faster builds and smaller bundles
    optimizePackageImports: [
      // Radix UI components (your heavy dependencies)
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      // Icon libraries
      "lucide-react",
      "react-icons",
      // Heavy libraries
      "framer-motion",
      "date-fns",
      "react-hook-form",
      "@hookform/resolvers",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      // State management
      "@xstate/react",
      "xstate",
      // Other utilities
      "zod",
    ],

    // Server Actions optimization
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
      bodySizeLimit: "2mb",
    },

    // Enable optimistic client cache for faster navigation
    optimisticClientCache: true,

    // PRODUCTION: Enable CSS optimization
    optimizeCss: process.env.NODE_ENV === "production",

    // Enable build workers first (required for parallel builds)
    webpackBuildWorker: true,

    // Enable parallel processing in production
    parallelServerBuildTraces: process.env.NODE_ENV === "production",
    parallelServerCompiles: process.env.NODE_ENV === "production",

    // PERFORMANCE: Partial prerendering disabled for stable production
    // ppr: "incremental", // Only available in Next.js canary versions

    // PERFORMANCE: Enable server components HMR cache
    serverComponentsHmrCache: true,

    // PERFORMANCE: Enable CSS chunking for better caching
    cssChunking: 'strict',
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
  output: "standalone",

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
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || "development",
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
    JWT_SECRET_DEV: process.env.JWT_SECRET_DEV,
    JWT_SECRET: process.env.JWT_SECRET,
    // Session timeout mapping
    NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES: (() => {
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

// Simplified compiler configuration to prevent RSC conflicts
if (!isTurbopack && process.env.NODE_ENV !== "production") {
  baseConfig.compiler = {
    styledComponents: true,
  }
}

// Bundle analyzer configuration
if (process.env.ANALYZE === "true") {
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
    openAnalyzer: true,
  })
  module.exports = withBundleAnalyzer(baseConfig)
} else {
  module.exports = baseConfig
}
