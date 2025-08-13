// vitest.config.js
import react from '@vitejs/plugin-react';
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
  // Explicit aliases for bracketed Next.js routes to avoid resolver issues in tests
  '@/app/student-dashboard/submit-event/[draftId]/utils': path.resolve(__dirname, 'src/app/student-dashboard/submit-event/[draftId]/utils/index.js'),
  '@/app/student-dashboard/submit-event/[draftId]/reporting/services/proposalService': path.resolve(__dirname, 'src/app/student-dashboard/submit-event/[draftId]/reporting/services/proposalService.js'),
};

export default defineConfig({
  root: '.', // paths are relative to project root

  // Use React plugin for all environments
  plugins: [react()],

  resolve: {
    alias,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['tests/**/*.{test,spec}.{js,jsx,mjs,cjs}'],
    css: false, // Disable CSS processing for tests

    // Disable plugins that cause issues in test environment
    plugins: [],

    alias, // reuses same aliases for Vitest

    // Test-specific configuration
    testTimeout: 10000,
    hookTimeout: 10000,

    // Disable client injection for tests
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
