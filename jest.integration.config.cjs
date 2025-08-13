// jest.integration.config.cjs
module.exports = {
    testEnvironment: "jsdom",
    moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

    collectCoverage: true,
    collectCoverageFrom: [
        "src/**/*.{js,jsx,ts,tsx}",
        "!src/**/*.d.ts",
        "!src/**/*.stories.{js,jsx,ts,tsx}",
        "!src/**/index.{js,jsx,ts,tsx}"
    ],

    testMatch: [
        "<rootDir>/tests/**/*.test.[jt]s?(x)"
    ]
}; 