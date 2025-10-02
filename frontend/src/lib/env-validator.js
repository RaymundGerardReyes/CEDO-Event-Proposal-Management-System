/**
 * Environment Variable Validator
 * Validates and provides fallbacks for environment variables
 */

/**
 * Validate and get API URL with fallbacks
 * @returns {string} Valid API URL
 */
export function getApiUrl() {
    const apiUrl = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:5000';

    // Remove trailing /api if present to prevent double /api/ in URLs
    const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace(/\/api$/, '') : apiUrl;

    return cleanUrl;
}

/**
 * Validate and get reCAPTCHA site key with fallbacks
 * @returns {string} reCAPTCHA site key or empty string
 */
export function getRecaptchaSiteKey() {
    return process.env.RECAPTCHA_SITE_KEY ||
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
        '';
}

/**
 * Validate environment variables and return status
 * @returns {Object} Environment validation status
 */
export function validateEnvironment() {
    const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        variables: {}
    };

    // Check API URL
    const apiUrl = getApiUrl();
    validation.variables.API_URL = apiUrl;

    if (!process.env.API_URL && !process.env.BACKEND_URL) {
        validation.warnings.push('No API_URL or BACKEND_URL set, using default localhost:5000');
    }

    // Check reCAPTCHA configuration
    const recaptchaKey = getRecaptchaSiteKey();
    validation.variables.RECAPTCHA_SITE_KEY = recaptchaKey ? 'SET' : 'NOT SET';

    if (!recaptchaKey) {
        validation.errors.push('reCAPTCHA_SITE_KEY not configured');
        validation.isValid = false;
    }

    // Check Node environment
    validation.variables.NODE_ENV = process.env.NODE_ENV || 'development';

    if (process.env.NODE_ENV === 'production' && !recaptchaKey) {
        validation.errors.push('reCAPTCHA_SITE_KEY is required in production');
        validation.isValid = false;
    }

    return validation;
}

/**
 * Get environment configuration with validation
 * @returns {Object} Environment configuration
 */
export function getEnvironmentConfig() {
    const validation = validateEnvironment();

    return {
        apiUrl: getApiUrl(),
        recaptchaSiteKey: getRecaptchaSiteKey(),
        nodeEnv: process.env.NODE_ENV || 'development',
        validation,
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production'
    };
}

/**
 * Log environment validation results
 */
export function logEnvironmentStatus() {
    const config = getEnvironmentConfig();

    console.group('🔧 Environment Configuration');
    console.log('API URL:', config.apiUrl);
    console.log('reCAPTCHA Key:', config.recaptchaSiteKey ? 'SET' : 'NOT SET');
    console.log('Node Environment:', config.nodeEnv);
    console.log('Is Development:', config.isDevelopment);
    console.log('Is Production:', config.isProduction);

    if (config.validation.errors.length > 0) {
        console.group('❌ Errors');
        config.validation.errors.forEach(error => console.error(error));
        console.groupEnd();
    }

    if (config.validation.warnings.length > 0) {
        console.group('⚠️ Warnings');
        config.validation.warnings.forEach(warning => console.warn(warning));
        console.groupEnd();
    }

    console.groupEnd();

    return config;
}
