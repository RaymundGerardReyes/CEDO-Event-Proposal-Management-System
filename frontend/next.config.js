/** @type {import('next').NextConfig} */

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

const nextConfig = {
  // React strict mode - disabled for faster development builds
  reactStrictMode: false,

  // FIXED: Turbopack configuration for Next.js 15.3.2 (Stable)
  turbopack: {
    // CORRECTED: Proper Turbopack rules for Next.js 15.3.2
    rules: {
      // Remove css-loader references - Turbopack handles CSS natively
      "*.module.css": {
        loaders: ["css"],
        as: "*.module.css",
      },
    },
    // CORRECTED: Resolve alias format for stable Turbopack
    resolveAlias: {
      "@": "./src",
      "@components": "./src/components",
      "@hooks": "./src/hooks",
      "@utils": "./src/utils",
      "@lib": "./src/lib",
      "@contexts": "./src/contexts",
    },
  },

  // Experimental features (reduced for stability)
  experimental: {
    // Optimize package imports (critical for your heavy dependencies)

    optimizePackageImports: [
      // Radix UI components
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

    // FIXED: Disable CSS optimization to prevent critters error
    optimizeCss: false,

    // Enable scroll restoration
    scrollRestoration: true,

    // FIXED: Disable parallel processing to prevent build worker errors
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },

  // CORRECTED: SWC Compiler options for Next.js 15.3.2
  compiler: {
    // Remove console.log in production only
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
          exclude: ["error", "warn", "info"],
        }
        : false,

    // Enable styled-components for faster CSS-in-JS
    styledComponents: true,

    // FIXED: Correct property name and structure
    reactRemoveProperties:
      process.env.NODE_ENV === "production"
        ? {
          properties: ["^data-testid$", "^data-test$", "^data-cy$"],
        }
        : false,

    // Enable emotion for faster CSS-in-JS (if using emotion)
    emotion: true,
  },

  // CORRECTED: External packages moved to correct location
  serverExternalPackages: ["axios", "jose", "react-google-recaptcha"],

  // Image optimization
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

  // Page extensions (optimized for JavaScript)
  pageExtensions: ["js", "jsx"],

  // Build output optimization - reverted for compatibility with dynamic features
  output: "standalone",

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ["src", "pages", "components"],
  },

  // TypeScript configuration (for mixed projects)
  typescript: {
    ignoreBuildErrors: true,
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

  // FIXED: Development indicators for Next.js 15.3.2
  devIndicators: {
    position: "bottom-right",
  },

  // Enhanced HMR and Fast Refresh configuration
  webpack: (config, { dev, isServer }) => {
    // Windows-specific optimizations
    if (process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 500,
        ignored: ['**/node_modules/**', '**/.next/**'],
      };

      // Prevent permission issues on Windows
      config.output = {
        ...config.output,
        clean: false, // Disable auto-clean to prevent permission issues
      };
    }

    if (dev && !isServer) {
      // Improve HMR performance and fix timing issues
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };

      // Fix Fast Refresh timing calculations
      config.optimization = {
        ...config.optimization,
        providedExports: false,
        usedExports: false,
      };
    }

    return config;
  },
}

// Export configuration with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig);
