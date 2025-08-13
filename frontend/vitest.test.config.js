// vitest.test.config.js - Test-specific configuration
import path from 'path';
import { defineConfig } from 'vitest/config';

const alias = {
    '@': path.resolve(__dirname, 'src'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@hooks': path.resolve(__dirname, 'src/hooks'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@lib': path.resolve(__dirname, 'src/lib'),
    '@contexts': path.resolve(__dirname, 'src/contexts'),
    '@reporting': path.resolve(__dirname, 'src/app/main/student-dashboard/submit-event/draftId/reporting'),
    '@community-event': path.resolve(__dirname, 'src/app/main/student-dashboard/submit-event/draftId/community-event'),
};

export default defineConfig({
    root: '.',

    // No plugins for tests to avoid vite:client-inject issues
    plugins: [],

    resolve: { alias },

    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.js'],
        include: ['tests/**/*.{test,spec}.{js,jsx,mjs,cjs}'],
        css: false,

        // Test-specific configuration
        testTimeout: 10000,
        hookTimeout: 10000,

        // Disable all server features for tests
        server: {
            hmr: false,
        },

        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '.next/',
                'coverage/',
                '**/*.config.js',
            ],
        },
    },
}); 