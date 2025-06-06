// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
  },

  reporters: [
    "default", // Default reporter
    "jest-summary-reporter" // Add the summary reporter
  ],

  testEnvironment: "jest-environment-jsdom",
  moduleFileExtensions: ["js", "jsx", "json"],
  // Cache configuration for faster testing
  cache: true,
  cacheDirectory: ".next/cache/jest",
  // Performance optimizations
  maxWorkers: "50%",
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/**/*.test.{js,jsx}", "!src/**/*.spec.{js,jsx}"],
}

module.exports = createJestConfig(customJestConfig)