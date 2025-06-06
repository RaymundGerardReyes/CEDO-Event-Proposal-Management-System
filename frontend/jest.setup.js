// frontend/jest.setup.js

import '@testing-library/jest-dom';
import 'cross-fetch/polyfill';

/**
 * Mocks for Browser-Specific APIs in JSDOM
 * -----------------------------------------
 * JSDOM, the testing environment used by Jest, does not implement certain
 * browser APIs. We need to provide basic mocks for these to prevent tests
 * from crashing when rendering components from modern UI libraries.
 */

// 1. Mock for ResizeObserver
const ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));
window.ResizeObserver = ResizeObserver;


// 2. Mock for window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});


// 3. Mock for requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    // A simple polyfill that executes the callback immediately.
    value: (callback) => {
        const id = setTimeout(() => callback(Date.now()), 0);
        return id;
    },
});

Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    value: (id) => {
        clearTimeout(id);
    },
});


// Optional: If you use MSW, you can set it up here.
// import { server } from "./tests/server";
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());