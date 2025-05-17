/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode helps identify potential problems in an application
  reactStrictMode: true,
  // swcMinify is removed as it's enabled by default in Next.js 15.3.2

  // Image optimization configuration
  images: {
    domains: ["localhost", "placekitten.com", "picsum.photos"],
  },

  // API route rewrites
  async rewrites() {
    return [
      {
        source: "/api/:path*",
<<<<<<< HEAD
        destination: "http://localhost:5050/api/:path*",
=======
        destination: "http://localhost:5000/api/:path*",
>>>>>>> 6f38442 (Update Dockerfiles and user-related functionality)
      },
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },

  // Optimize webpack configuration
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,
        ignored: /node_modules/,
      }
    }
    return config
  },

  // Optimize page loading
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],

  // Optimize build output
  output: "standalone", // Creates a standalone build that's easier to deploy

  // Optimize module imports
  experimental: {
    // Optimize package imports (reduces bundle size)
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@mui/icons-material",
      "@mui/material",
      "date-fns",
      "lodash",
    ],

    // Enable server components features
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "2mb",
    },

    // Configure Turbopack for faster development
    turbo:
      process.env.NEXT_USE_TURBO === "true"
        ? {
          rules: {
            // Add any custom Turbopack rules here
          },
        }
        : undefined,

    // Optimize client-side navigation
    optimisticClientCache: true,
    optimizeCss: false,
    scrollRestoration: true,
  },

  // Configure compiler options
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
          exclude: ["error", "warn"],
        }
        : false,

    // Enable styled-components
    styledComponents: true,
  },

  // Configure internationalization (if needed)
  i18n:
    process.env.NEXT_ENABLE_I18N === "true"
      ? {
        locales: ["en", "fr", "es"],
        defaultLocale: "en",
      }
      : undefined,

  // TypeScript and ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ["pages", "app", "components", "lib", "src"],
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: "./tsconfig.json",
  },

  // Configure redirects (if needed)
  async redirects() {
    return []
  },

  // Configure powered by header
  poweredByHeader: false,

  // Configure trailing slash
  trailingSlash: false,

  // Configure environment variables
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || "development",
  },

  // Configure build directory
  distDir: ".next",
}

// Conditionally apply configurations based on environment
if (process.env.ANALYZE === "true") {
  // Enable bundle analyzer in special builds
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  })
  module.exports = withBundleAnalyzer(nextConfig)
} else {
  module.exports = nextConfig
}
