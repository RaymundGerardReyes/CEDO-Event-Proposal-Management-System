/**
 * Unified Date Utility Functions
 * Purpose: Centralized date formatting and manipulation utilities
 * Key approaches: Intl.DateTimeFormat for localization, consistent error handling
 */

/**
 * Format date to ISO string with timezone support
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
function formatISO(date, options = {}) {
    try {
        if (!date) return '';

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date provided');
        }

        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            ...options
        };

        return new Intl.DateTimeFormat('en-CA', defaultOptions).format(dateObj);
    } catch (error) {
        console.error('❌ Error formatting date to ISO:', error);
        return '';
    }
}

/**
 * Format date for display with customizable locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
function formatDisplay(date, locale = 'en-US', options = {}) {
    try {
        if (!date) return '';

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date provided');
        }

        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        };

        return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
    } catch (error) {
        console.error('❌ Error formatting date for display:', error);
        return '';
    }
}

/**
 * Format time for display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Time formatting options
 * @returns {string} Formatted time string
 */
function formatTime(date, options = {}) {
    try {
        if (!date) return '';

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date provided');
        }

        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            ...options
        };

        return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
    } catch (error) {
        console.error('❌ Error formatting time:', error);
        return '';
    }
}

/**
 * Format datetime for database storage
 * @param {Date|string} date - Date to format
 * @returns {string} ISO datetime string
 */
function formatForDatabase(date) {
    try {
        if (!date) return null;

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date provided');
        }

        return dateObj.toISOString();
    } catch (error) {
        console.error('❌ Error formatting date for database:', error);
        return null;
    }
}

/**
 * Parse date string to Date object with validation
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed Date object or null if invalid
 */
function parseDate(dateString) {
    try {
        if (!dateString) return null;

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            throw new Error('Invalid date string provided');
        }

        return date;
    } catch (error) {
        console.error('❌ Error parsing date:', error);
        return null;
    }
}

/**
 * Validate date range (start date before end date)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {boolean} True if valid range
 */
function validateDateRange(startDate, endDate) {
    try {
        const start = parseDate(startDate);
        const end = parseDate(endDate);

        if (!start || !end) {
            return false;
        }

        return start <= end;
    } catch (error) {
        console.error('❌ Error validating date range:', error);
        return false;
    }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to get relative time for
 * @returns {string} Relative time string
 */
function getRelativeTime(date) {
    try {
        if (!date) return '';

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date provided');
        }

        const now = new Date();
        const diffInSeconds = Math.floor((now - dateObj) / 1000);

        if (diffInSeconds < 60) {
            return 'just now';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
        }

        return formatDisplay(dateObj);
    } catch (error) {
        console.error('❌ Error getting relative time:', error);
        return '';
    }
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
function isToday(date) {
    try {
        if (!date) return false;

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            return false;
        }

        const today = new Date();
        return dateObj.toDateString() === today.toDateString();
    } catch (error) {
        console.error('❌ Error checking if date is today:', error);
        return false;
    }
}

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the future
 */
function isFuture(date) {
    try {
        if (!date) return false;

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            return false;
        }

        return dateObj > new Date();
    } catch (error) {
        console.error('❌ Error checking if date is in future:', error);
        return false;
    }
}

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
function isPast(date) {
    try {
        if (!date) return false;

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            return false;
        }

        return dateObj < new Date();
    } catch (error) {
        console.error('❌ Error checking if date is in past:', error);
        return false;
    }
}

// ===================================================================
// EXPORTS
// ===================================================================

module.exports = {
    formatISO,
    formatDisplay,
    formatTime,
    formatForDatabase,
    parseDate,
    validateDateRange,
    getRelativeTime,
    isToday,
    isFuture,
    isPast
}; 