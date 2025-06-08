import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
