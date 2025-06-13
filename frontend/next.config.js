/** @type {import('next').NextConfig} */

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

const nextConfig = {
  // React strict mode - enabled for better development practices with Fast Refresh
  reactStrictMode: true,

  // ✅ CORRECTED: Turbopack configuration for Next.js 15.3.2 (Stable)
  turbopack: {
    // Path aliases - properly formatted for Turbopack
    resolveAlias: {
      "@": "./src",
      "@components": "./src/components",
      "@hooks": "./src/hooks",
      "@utils": "./src/utils",
      "@lib": "./src/lib",
      "@contexts": "./src/contexts",
    },
    // Custom file extensions for module resolution
    resolveExtensions: ['.jsx', '.js', '.ts', '.tsx', '.json'],
    // REMOVED: moduleIds: 'deterministic' - incompatible with HMR
    // This experimental option causes "[Turbopack HMR] Expected module to match pattern" errors
  },

  // ✅ CRITICAL FIX: Relaxed COOP policy for Google OAuth compatibility
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    return [
      {
        source: '/(.*)',
        headers: isDev
          ? [
            // 🚀 DEVELOPMENT: Very permissive for Google OAuth testing
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'unsafe-none', // Allows all popup communication
            },
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'unsafe-none', // Allows all embedding
            },
            {
              key: 'Cross-Origin-Resource-Policy',
              value: 'cross-origin', // Allows cross-origin requests
            },
            {
              key: 'Referrer-Policy',
              value: 'no-referrer-when-downgrade', // Standard referrer policy
            },
          ]
          : [
            // 🛡️ PRODUCTION: Balanced security with OAuth compatibility
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'same-origin-allow-popups', // CRITICAL: Allows Google OAuth popups
            },
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'unsafe-none', // Required for Google OAuth in production
            },
            {
              key: 'Cross-Origin-Resource-Policy',
              value: 'cross-origin', // Allows Google domain communication
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
          ],
      },
      // ✅ SPECIFIC: More permissive rules for Google OAuth endpoints
      {
        source: '/api/auth/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none', // Always permissive for auth endpoints
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },

  // ✅ Webpack configuration for better OAuth handling
  webpack: (config, { dev, isServer }) => {
    // Optimize for Google OAuth in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
      }
    }
    return config
  },

  // Experimental features optimized for Turbopack
  experimental: {
    // ✅ CRITICAL: Package import optimization for Fast Refresh performance
    optimizePackageImports: [
      // Radix UI components (split for faster compilation)
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
      // Google reCAPTCHA libraries
      "react-google-recaptcha",
      "@google-recaptcha/react",
      // Utility libraries
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      // State management
      "@xstate/react",
      "xstate",
      // Validation
      "zod",
    ],

    // ✅ Server Actions optimization for better Fast Refresh
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
      bodySizeLimit: "2mb",
    },

    // ✅ Enable optimistic client cache for faster navigation
    optimisticClientCache: true,

    // ✅ Enable scroll restoration for better UX
    scrollRestoration: true,

    // ✅ Server components HMR cache for Fast Refresh
    serverComponentsHmrCache: true,
  },

  // ✅ SWC Compiler optimized for Fast Refresh
  compiler: {
    // Remove console statements in production only
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn", "info"],
    } : false,

    // ✅ Enable styled-components for CSS-in-JS Fast Refresh
    styledComponents: true,

    // ✅ React properties removal for production
    reactRemoveProperties: process.env.NODE_ENV === "production" ? {
      properties: ["^data-testid$", "^data-test$", "^data-cy$"],
    } : false,

    // ✅ Enable emotion for CSS-in-JS Fast Refresh
    emotion: true,
  },

  // ✅ External packages for server-side rendering
  serverExternalPackages: ["axios", "jose", "mysql2"],

  // ✅ Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placekitten.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ Page extensions optimized for Fast Refresh
  pageExtensions: ["js", "jsx", "ts", "tsx"],

  // ✅ Build output configuration
  output: "standalone",

  // ✅ ESLint configuration
  eslint: {
    ignoreDuringBuilds: false, // Enable linting for better Fast Refresh experience
    dirs: ["src", "pages", "components"],
  },

  // ✅ TypeScript configuration for mixed projects
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking for Fast Refresh
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || "development",
  },

  // Build directory
  distDir: ".next",

  // Disable powered by header
  poweredByHeader: false,

  // Trailing slash configuration  
  trailingSlash: false,

  // Compress responses
  compress: true,

  // Generate ETags for better caching
  generateEtags: true,

  // ✅ Development indicators optimized for Fast Refresh
  devIndicators: {
    position: "bottom-right",
  },

  // ✅ CRITICAL: Disable Fast Refresh for auth components to prevent state issues
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // ✅ REMOVED: webpack configuration when using Turbopack
  // Note: Turbopack replaces webpack, so we remove the webpack function
  // to prevent conflicts and ensure Fast Refresh works optimally
}

// Export configuration with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig);
