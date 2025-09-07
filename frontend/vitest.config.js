// vitest.config.js
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Define aliases in a single place for consistency
const alias = {
  '@': path.resolve(__dirname, 'src'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@lib': path.resolve(__dirname, 'src/lib'),
  '@contexts': path.resolve(__dirname, 'src/contexts'),
  '@reporting': path.resolve(__dirname, 'src/app/main/student-dashboard/submit-event/draftId/reporting'),
  '@community-event': path.resolve(__dirname, 'src/app/main/student-dashboard/submit-event/draftId/community-event'),
  // Explicit aliases for bracketed Next.js routes to avoid resolver issues in tests
  '@/app/student-dashboard/submit-event/[draftId]/utils': path.resolve(__dirname, 'src/app/student-dashboard/submit-event/[draftId]/utils/index.js'),
  '@/app/student-dashboard/submit-event/[draftId]/reporting/services/proposalService': path.resolve(__dirname, 'src/app/student-dashboard/submit-event/[draftId]/reporting/services/proposalService.js'),
};

export default defineConfig({
  // The React plugin is necessary for processing JSX in your tests.
  // It should be defined at the top level.
  plugins: [react()],

  resolve: {
    alias,
  },

  // ✅ FIXED: Add esbuild configuration to handle path issues
  esbuild: {
    // Handle spaces in file paths
    keepNames: true,
    // Increase memory limit for complex builds
    target: 'es2020',
    // Disable source maps for better performance
    sourcemap: false,
  },

  test: {
    // Vitest inherits top-level plugins and aliases, so you don't need to redeclare them here.
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['tests/**/*.{test,spec}.{js,jsx}', 'src/**/*.{test,spec}.{js,jsx}'], // Include both tests and src directories

    // ✅ ENHANCED: Add test-specific esbuild config
    esbuild: {
      // Handle path encoding issues
      keepNames: true,
      target: 'es2020',
      sourcemap: false,
    },

    // Disable CSS processing for better performance in tests
    css: false,

    // ✅ ENHANCED: Increase timeouts for complex tests
    testTimeout: 30000,
    hookTimeout: 30000,

    // ✅ ADDED: Pool configuration to prevent service crashes
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.config.js',
        'vitest.setup.js', // Exclude setup file from coverage
      ],
    },
  },
});
