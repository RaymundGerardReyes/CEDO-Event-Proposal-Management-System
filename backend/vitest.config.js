import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./tests/setup.js'],
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 10000
    },
    esbuild: {
        target: 'node18'
    }
});