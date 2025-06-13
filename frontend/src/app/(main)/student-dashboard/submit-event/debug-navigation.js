// 🛡️ DEBUG UTILITY: Navigation and Re-render Tracker
// Use this to debug double-render issues in Section3_SchoolEvent
// Import and call these functions in your parent component

let navigationHistory = [];
let renderCounts = new Map();

export const debugNavigation = {
    // Track navigation events
    logNavigation: (from, to, data = {}) => {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            from,
            to,
            data: JSON.stringify(data, null, 2),
            userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
        };

        navigationHistory.push(entry);
        console.log(`🧭 NAVIGATION [${timestamp}]: ${from} → ${to}`);
        console.log(`📦 Data:`, data);

        // Keep only last 10 entries
        if (navigationHistory.length > 10) {
            navigationHistory = navigationHistory.slice(-10);
        }
    },

    // Track component renders
    logRender: (componentName, props = {}) => {
        const count = renderCounts.get(componentName) || 0;
        renderCounts.set(componentName, count + 1);

        const timestamp = new Date().toISOString();
        console.log(`🔄 RENDER [${timestamp}]: ${componentName} (${count + 1})`);

        // Show the StrictMode tip **once** (after the 2nd render) in development
        if (process.env.NODE_ENV === 'development' && count === 1) {
            console.info(`💡 TIP: React StrictMode intentionally double-renders components in development.`);
            console.info(`💡 This will not happen in production builds.`);
        }

        // Only warn when the component renders more than twice –
        // i.e. beyond the normal StrictMode double render.
        if (count > 1) {
            console.warn(`⚠️ MULTIPLE RENDERS: ${componentName} has rendered ${count + 1} times`);
        }

        // Log props changes if this is a re-render
        if (count > 0 && Object.keys(props).length > 0) {
            console.log(`📊 Props for render ${count + 1}:`, props);
        }
    },

    // Get full history
    getHistory: () => ({
        navigation: navigationHistory,
        renderCounts: Object.fromEntries(renderCounts)
    }),

    // Reset tracking
    reset: () => {
        navigationHistory = [];
        renderCounts.clear();
        console.log('🔄 Debug tracking reset');
    },

    // Check for StrictMode
    detectStrictMode: () => {
        const strictModeIndicators = [
            document.querySelector('body [data-reactroot]'),
            window.React?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
            process.env.NODE_ENV === 'development'
        ];

        const likelyStrictMode = strictModeIndicators.some(indicator => !!indicator);

        console.log('🔍 StrictMode Detection:', {
            isDevelopment: process.env.NODE_ENV === 'development',
            likelyStrictMode,
            recommendation: likelyStrictMode
                ? 'Double renders in development are normal with StrictMode'
                : 'Check for other causes of double renders'
        });

        return likelyStrictMode;
    }
};

// Auto-detect StrictMode on import
if (typeof window !== 'undefined') {
    setTimeout(() => {
        debugNavigation.detectStrictMode();
    }, 100);
}

export default debugNavigation; 