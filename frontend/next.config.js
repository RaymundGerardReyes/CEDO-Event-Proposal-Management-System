// File: next.config.js
// Purpose: Next.js configuration for CEDO partnership management frontend with stable development setup.
// Key approaches: Simplified configuration, Windows compatibility, fallback options for Turbopack issues.
// Refactor: Fixed font loading issues, disabled problematic Turbopack features, added stable font handling.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode - enabled for production optimization
  reactStrictMode: true,

  // Enable compression for better performance
  compress: true,

  // Server external packages
  serverExternalPackages: ["axios", "jose", "react-google-recaptcha"],

  // PRODUCTION OPTIMIZATIONS
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateEtags: true,

  // ✅ FIXED: Simplified experimental features - removed problematic font handling
  experimental: {
    // Only enable stable features
    scrollRestoration: true,

    // ✅ CRITICAL: Disable problematic features that cause font loading issues
    optimizeCss: false,
    cssChunking: false,
  },

  // ✅ FIXED: Moved Turbopack configuration to the correct location
  turbopack: {
    // Minimal Turbopack configuration without font handling
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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
      // ✅ ADDED: Allow Google Fonts domains
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fonts.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox; frame-ancestors 'self' https://www.google.com;",
  },

  // Page extensions
  pageExtensions: ["js", "jsx"],

  // ESLint configuration
  eslint: { ignoreDuringBuilds: true },

  // TypeScript configuration
  typescript: { ignoreBuildErrors: true },

  // Environment variables
  env: {
    APP_ENV: process.env.NODE_ENV || "development",
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:5000",
    API_URL: process.env.API_URL || "http://localhost:5000/api",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
    JWT_SECRET_DEV: process.env.JWT_SECRET_DEV,
    JWT_SECRET: process.env.JWT_SECRET,
    SESSION_TIMEOUT_MINUTES: (() => {
      const raw = process.env.SESSION_TIMEOUT_MINUTES;
      const parsed = parseInt(raw, 10);
      return String(
        Number.isInteger(parsed) && parsed > 0
          ? parsed
          : 30
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

  // ✅ ENHANCED: Headers for performance, security, and font loading
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
          value: 'CEDO'
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
    // ✅ ADDED: Font preload headers for better performance
    {
      source: '/_next/static/fonts/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
      ],
    },
  ],

  // ✅ ENHANCED: Webpack configuration with font handling
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Handle SVG files properly
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // ✅ ADDED: Font file handling
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]',
      },
    });

    return config;
  },
};

module.exports = nextConfig;
