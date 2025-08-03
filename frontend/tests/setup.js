// frontend/tests/setup.js
import '@testing-library/jest-dom';

// Mock ResizeObserver (for React Testing Library + browser API emulation)
class ResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserver;

// Optional: Polyfill fetch if needed
if (!global.fetch) {
    global.fetch = (...args) =>
        import('node-fetch').then(({ default: fetch }) => fetch(...args));
}
