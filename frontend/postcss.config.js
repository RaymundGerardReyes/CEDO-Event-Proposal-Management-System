/** @type {import('postcss').ProcessOptions} */

// ✅ PostCSS configuration optimized for Turbopack + Fast Refresh
// Turbopack automatically processes postcss.config.js in a Node.js worker pool
export default {
  plugins: {
    // ✅ Tailwind CSS - fully supported by Turbopack
    tailwindcss: {},

    // ✅ Autoprefixer - works seamlessly with Lightning CSS
    autoprefixer: {},

    // ✅ PostCSS Preset Env for modern CSS features (optional)
    // Uncomment if you need additional CSS transformations
    // 'postcss-preset-env': {
    //   stage: 3,
    //   features: {
    //     'custom-properties': false, // Let Lightning CSS handle this
    //     'nesting-rules': false,     // Let Lightning CSS handle this
    //   },
    // },
  },
};