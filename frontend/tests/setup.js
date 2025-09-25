/**
 * Test Setup Configuration
 * Global test configuration for the CEDO frontend tests
 * Using Vitest for fast, modern testing
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    useParams: () => ({}),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '/',
}));

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
    __esModule: true,
    default: (importFunc) => {
        const Component = importFunc();
        Component.displayName = 'DynamicComponent';
        return Component;
    },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock window.alert
global.alert = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
};

// Setup test environment
beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Reset localStorage
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Reset sessionStorage
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();

    // Reset fetch
    fetch.mockClear();

    // Reset alert
    global.alert.mockClear();
});

afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
});