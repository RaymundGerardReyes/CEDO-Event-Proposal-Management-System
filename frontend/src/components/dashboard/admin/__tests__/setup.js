/**
 * Test Setup for ProposalTable Component Tests
 * Configures mocks and test environment
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.URL for file downloads
global.URL = {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
};

// Mock document.createElement for download functionality
const mockAnchor = {
    href: '',
    download: '',
    click: vi.fn()
};

const originalCreateElement = document.createElement;
vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'a') {
        return mockAnchor;
    }
    return originalCreateElement.call(document, tagName);
});

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
};

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
global.sessionStorage = sessionStorageMock;
