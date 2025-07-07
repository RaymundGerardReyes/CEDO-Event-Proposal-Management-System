// jest.config.js (ES Module version for Next.js projects)
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/**
 * Custom Jest configuration for Next.js + Testing Library
 * - Uses next/jest for Next.js compatibility
 * - Maps @/* and other aliases to src/
 * - Looks for tests in src/ and tests/ folders
 * - Uses babel-jest for JS/TS/JSX/TSX
 * - JS DOM environment for React
 */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*.(test|spec).[jt]s?(x)',
    '<rootDir>/tests/**/*.(test|spec).[jt]s?(x)',
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['js', 'jsx', 'json'],
  cache: true,
  cacheDirectory: '.next/cache/jest',
  maxWorkers: '50%',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.next/standalone'],
};

export default createJestConfig(customJestConfig);
