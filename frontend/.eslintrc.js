module.exports = {
    extends: ["next/core-web-vitals"],
    rules: {
        // Disable rules that slow down linting
        "react/no-unescaped-entities": "off",
        "@next/next/no-page-custom-font": "off",
        // Performance-focused rules
        "react-hooks/exhaustive-deps": "warn",
        "react/jsx-key": "error",
        // Disable expensive rules during development
        ...(process.env.NODE_ENV === "development" && {
            "react/prop-types": "off",
            "react/display-name": "off",
        }),
    },
    // Cache configuration for faster linting
    cache: true,
    cacheLocation: ".next/cache/eslint",
    // Ignore patterns for faster linting
    ignorePatterns: [".next/**", "out/**", "dist/**", "node_modules/**", "*.config.js"],
}
