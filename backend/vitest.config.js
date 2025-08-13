import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'coverage/',
                'logs/',
                'uploads/',
                '*.config.js',
                '*.config.mjs'
            ]
        },
        testMatch: [
            '**/tests/**/*.test.js',
            '**/tests/**/*.spec.js',
            '**/__tests__/**/*.js'
        ],
        verbose: true,
        clearMocks: true,
        restoreMocks: true
    },
    esbuild: {
        target: 'node18'
    }
});
