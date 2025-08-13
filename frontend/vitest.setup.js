// vitest.setup.js
// Purpose: Sets up the global test environment for Vitest, including DOM, browser APIs, and utility mocks for consistent, isolated frontend testing.
// Approach: Mocks browser APIs (localStorage, matchMedia, IntersectionObserver, etc.), ensures clean state after each test, and uses Vitest's vi for all mocks. All mocks are clearly commented for maintainability.

import '@testing-library/jest-dom'; // Ensure both variants for compatibility
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Clean up DOM and mocks after each test
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

// Use Vitest's global 'vi' for mocks
const viFn = typeof vi !== 'undefined' ? vi.fn : () => { };

// Mock localStorage API
global.localStorage = {
    getItem: viFn(),
    setItem: viFn(),
    clear: viFn(),
    removeItem: viFn(),
    length: 0,
    key: viFn(),
};

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: viFn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: viFn(),
        removeListener: viFn(),
        addEventListener: viFn(),
        removeEventListener: viFn(),
        dispatchEvent: viFn(),
    }))
});

// Mock window.scrollTo to prevent errors in tests
window.scrollTo = viFn();

// Mock IntersectionObserver for component visibility tests
class IntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe = viFn();
    unobserve = viFn();
    disconnect = viFn();
}
window.IntersectionObserver = IntersectionObserver;

// Mock ResizeObserver for layout tests
class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe = viFn();
    unobserve = viFn();
    disconnect = viFn();
}
window.ResizeObserver = ResizeObserver;

// Mock window.navigator for clipboard and user agent
Object.defineProperty(window, 'navigator', {
    writable: true,
    value: {
        clipboard: {
            writeText: viFn(),
            readText: viFn(),
        },
        userAgent: 'test-user-agent',
        language: 'en-US',
    },
});

// Mock document.cookie for tests that use cookies
Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '',
});

// Mock console methods to suppress output and allow assertions
if (typeof global.console !== 'undefined') {
    global.console = {
        ...console,
        error: viFn(),
        warn: viFn(),
        log: viFn(),
        info: viFn(),
        debug: viFn(),
    };
} 