/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ["localhost", "placekitten.com", "picsum.photos"],
    },
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:5050/api/:path*",
            },
        ];
    },
    async headers() {
        // ... your existing headers ...
        return [ /* your existing headers array */];
    },
    webpack: (config, { dev }) => {
        // ... your existing webpack config ...
        return config;
    },
    pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
    output: "standalone",
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "@radix-ui/react-icons",
            "@mui/icons-material",
            "@mui/material",
            "date-fns",
            "lodash",
        ],
        serverActions: {
            allowedOrigins: ["localhost:3000"], // This is for Server Actions
            bodySizeLimit: "2mb",
        },
        turbo:
            process.env.NEXT_USE_TURBO === "true"
                ? { rules: { /* ... */ } }
                : undefined,
        optimisticClientCache: true,
        optimizeCss: false,
        scrollRestoration: true,
        // Add allowedDevOrigins here:
        allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"], // Added 127.0.0.1 as well
    },
    compiler: {
        removeConsole:
            process.env.NODE_ENV === "production"
                ? { exclude: ["error", "warn"] }
                : false,
        styledComponents: true,
    },
    // ... rest of your config (i18n, eslint, typescript, redirects, etc.) ...
    env: {
        NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || "development",
    },
    distDir: ".next",
};

// Your conditional bundle analyzer logic
if (process.env.ANALYZE === "true") {
    const withBundleAnalyzer = require("@next/bundle-analyzer")({
        enabled: true,
    });
    module.exports = withBundleAnalyzer(nextConfig);
} else {
    module.exports = nextConfig;
}