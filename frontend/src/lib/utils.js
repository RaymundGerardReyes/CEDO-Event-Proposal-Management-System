import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getApiUrl, getRecaptchaSiteKey, logEnvironmentStatus } from './env-validator'

/**
 * Combines multiple class names into a single string
 * @param  {...any} classes - Class names to combine
 * @returns {string} - Combined class names
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}) {
    if (!date) return ""
    const dateObj = date instanceof Date ? date : new Date(date)

    const defaultOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
    }

    return dateObj.toLocaleDateString("en-US", { ...defaultOptions, ...options })
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(value, currency = "PHP") {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency,
    }).format(value)
}

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, length = 50) {
    if (!text) return ""
    if (text.length <= length) return text

    return text.substring(0, length) + "..."
}

/**
 * Generate a random ID
 * @returns {string} - Random ID
 */
export function generateId() {
    return Math.random().toString(36).substring(2, 9)
}

// Enhanced responsive utilities
export const breakpoints = {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
}

export function getBreakpoint(width) {
    if (width < breakpoints.sm) return 'xs'
    if (width < breakpoints.md) return 'sm'
    if (width < breakpoints.lg) return 'md'
    if (width < breakpoints.xl) return 'lg'
    if (width < breakpoints['2xl']) return 'xl'
    return '2xl'
}

export function isMobileWidth(width) {
    return width < breakpoints.md
}

// Debounce utility for performance
export function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// Safe JSON parse
export function safeJsonParse(str, fallback = null) {
    try {
        return JSON.parse(str)
    } catch {
        return fallback
    }
}

// Responsive grid column calculator
export function getResponsiveColumns(totalItems, maxColumns = 4) {
    if (totalItems <= 1) return 1
    if (totalItems <= 2) return 2
    if (totalItems <= 3) return 3
    return Math.min(totalItems, maxColumns)
}

// Application configuration management
let appConfig = {};

// Test helper to reset config (for testing only)
export function resetAppConfig() {
    appConfig = {};
}

// Import centralized API configuration

/**
 * Get the current application configuration
 * @returns {Object} - Current configuration with fallbacks
 */
export function getAppConfig() {
    if (!appConfig) {
        // Initialize with fallback values - try multiple environment variables
        let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.API_URL ||
            process.env.BACKEND_URL ||
            'http://localhost:5000';

        // Remove trailing /api if present to prevent double /api/ in URLs
        if (backendUrl.endsWith('/api')) {
            backendUrl = backendUrl.replace(/\/api$/, '');
        }

        console.log('🔧 getAppConfig: Environment variables check:', {
            NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            API_URL: process.env.API_URL,
            BACKEND_URL: process.env.BACKEND_URL,
            finalBackendUrl: backendUrl
        });

        appConfig = {
            backendUrl: backendUrl
        };
    }
    return appConfig;
}

/**
 * Set a configuration value
 * @param {string} key - Configuration key
 * @param {any} value - Configuration value
 */
export function setAppConfig(key, value) {
    if (!appConfig) {
        appConfig = {};
    }
    appConfig[key] = value;
}

/**
 * Load configuration from the backend with enhanced error handling and retry logic
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfig(retries = 3) {
    if (appConfig && Object.keys(appConfig).length > 0) return appConfig;

    // 🔧 SCOPE FIX: Move variable declarations outside try block
    let base = getApiUrl();
    let url = '';

    try {
        // Log environment status for debugging
        if (process.env.NODE_ENV === 'development') {
            logEnvironmentStatus();
        }

        // Ensure no double slash
        url = base.endsWith('/') ? base + 'api/config' : base + '/api/config';

        console.log(`🔧 Attempting to load config from: ${url}`);

        // Enhanced fetch with timeout and retry logic
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        // Retry logic for network requests
        let lastError;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🔄 Config fetch attempt ${attempt}/${retries} to ${url}`);

                const res = await fetch(url, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    mode: 'cors', // Explicitly set CORS mode
                    credentials: 'include', // Include cookies for authentication
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`❌ HTTP ${res.status}: ${res.statusText}`, errorText);
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }

                const configData = await res.json();
                console.log('✅ Received config data:', configData);

                // Validate config data
                if (!configData || typeof configData !== 'object') {
                    throw new Error('Invalid config response format');
                }

                appConfig = {
                    ...configData,
                    // Ensure backendUrl is always set and does NOT end with /api
                    backendUrl: configData.backendUrl || base,
                    timestamp: Date.now()
                };

                // Remove trailing /api if present
                if (appConfig.backendUrl.endsWith('/api')) {
                    appConfig.backendUrl = appConfig.backendUrl.replace(/\/api$/, '');
                }

                console.log('✅ Loaded config successfully:', appConfig);
                return appConfig;

            } catch (fetchError) {
                clearTimeout(timeoutId);
                lastError = fetchError;
                console.error(`❌ Fetch attempt ${attempt} failed:`, {
                    message: fetchError.message,
                    name: fetchError.name,
                    url: url,
                    base: base
                });

                // If this is not the last attempt, wait before retrying
                if (attempt < retries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // If all retries failed, throw the last error
        throw lastError;

    } catch (err) {
        // Enhanced error logging with detailed information
        const errorDetails = {
            message: err.message || 'Unknown error',
            name: err.name || 'Error',
            stack: err.stack,
            url: url,
            baseUrl: base,
            timestamp: new Date().toISOString()
        };

        console.error('❌ Failed to load config:', errorDetails);

        // Create fallback config with environment variables
        let backendUrl = getApiUrl();

        // Try to get reCAPTCHA key from environment as fallback
        const recaptchaSiteKey = getRecaptchaSiteKey();

        appConfig = {
            backendUrl: backendUrl,
            recaptchaSiteKey: recaptchaSiteKey,
            error: errorDetails.message,
            fallback: true,
            timestamp: Date.now()
        };

        console.log('🔄 Using fallback config:', appConfig);

        // Log specific error types for debugging
        if (err.name === 'AbortError') {
            console.error('⏰ Config request timed out - backend may be slow or unresponsive');
        } else if (err.message.includes('Failed to fetch')) {
            console.error('🌐 Network error - check if backend is running and accessible');
        } else if (err.message.includes('CORS')) {
            console.error('🚫 CORS error - check backend CORS configuration');
        }

        return appConfig;
    }
}
