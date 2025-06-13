// frontend/tests/setupTests.js
// In frontend/jest.setup.js

import '@testing-library/jest-dom';

// Mock ResizeObserver
const ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

window.ResizeObserver = ResizeObserver;