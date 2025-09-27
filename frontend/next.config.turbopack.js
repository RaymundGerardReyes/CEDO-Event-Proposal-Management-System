// File: next.config.turbopack.js
// Purpose: Turbopack-optimized Next.js configuration for CEDO partnership management frontend
// Key approaches: Turbopack compatibility, performance optimization, modern Next.js features
// Refactor: Turbopack-specific configuration with fallback support

/** @type {import('next').NextConfig} */
const nextConfig = {
    // React strict mode - enabled for production optimization
    reactStrictMode: true,

    // Enable compression for better performance
    compress: true,

    // PRODUCTION OPTIMIZATIONS
    productionBrowserSourceMaps: false,
    poweredByHeader: false,
    generateEtags: true,

    // ✅ TURBOPACK-OPTIMIZED: Minimal experimental features
    experimental: {
        // Only stable features that work with Turbopack
        scrollRestoration: true,

        // ✅ TURBOPACK: Enable Turbopack-specific optimizations
        turbo: {
            // Turbopack-specific rules
            rules: {
                '*.svg': {
                    loaders: ['@svgr/webpack'],
                    as: '*.js',
                },
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

    // Environment variables - Turbopack compatible
    env: {
        APP_ENV: process.env.NODE_ENV || "development",
        BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000",
        API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:5000/api",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
        JWT_SECRET_DEV: process.env.JWT_SECRET_DEV,
        JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_SECRET_DEV || "dev-secret-key-change-in-production",
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

    // API Proxy Configuration for Independent Development
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/:path*`,
            },
            {
                source: '/auth/:path*',
                destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/auth/:path*`,
            },
            {
                source: '/uploads/:path*',
                destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/uploads/:path*`,
            },
        ];
    },

    // Build directory
    distDir: ".next",

    // Trailing slash configuration
    trailingSlash: false,

    // Development indicators
    devIndicators: {
        position: "bottom-right",
    },

    // ✅ TURBOPACK-OPTIMIZED: Headers for performance and security
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

    // ✅ TURBOPACK-OPTIMIZED: Webpack configuration
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

        // Font file handling
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
