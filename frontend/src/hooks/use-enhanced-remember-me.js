/**
 * Enhanced Remember Me Hook
 * 
 * Improved implementation with:
 * - Better UX feedback
 * - Robust error handling
 * - Security best practices
 * - Comprehensive testing support
 * 
 * Based on React best practices and modern authentication patterns
 */

import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useCallback, useEffect, useRef, useState } from 'react';

// Enhanced Remember Me Configuration
const REMEMBER_ME_CONFIG = {
    // Storage keys
    AUTH_TOKEN: 'cedo_auth_token',
    REMEMBER_ME: 'cedo_remember_me',
    USER_PREFS: 'cedo_user_preferences',

    // Expiration times (in milliseconds)
    STANDARD_SESSION: 24 * 60 * 60 * 1000, // 24 hours
    REMEMBER_ME_SESSION: 30 * 24 * 60 * 60 * 1000, // 30 days
    MAX_STORAGE_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days

    // Security settings
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};

export const useEnhancedRememberMe = () => {
    const { signIn, user, isLoading, isInitialized } = useAuth();
    const { toast } = useToast();

    // State management
    const [rememberMeStatus, setRememberMeStatus] = useState({
        isEnabled: false,
        hasToken: false,
        isSupported: false,
        isLoading: false,
        lastError: null
    });

    const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
    const [storedPreferences, setStoredPreferences] = useState(null);

    // Refs for cleanup
    const statusCheckInterval = useRef(null);
    const autoLoginTimeout = useRef(null);

    // Check if Remember Me is supported
    const checkSupport = useCallback(() => {
        if (typeof window === 'undefined') return false;

        try {
            // Test localStorage support
            const testKey = '__remember_me_test__';
            localStorage.setItem(testKey, 'test');
            const localStorageSupported = localStorage.getItem(testKey) === 'test';
            localStorage.removeItem(testKey);

            // Test cookie support
            document.cookie = 'cedo_test=1; path=/';
            const cookieSupported = document.cookie.includes('cedo_test');
            document.cookie = 'cedo_test=; expires=' + new Date(0).toUTCString();

            return localStorageSupported && cookieSupported;
        } catch (error) {
            console.warn('Remember Me support check failed:', error);
            return false;
        }
    }, []);

    // Enhanced cookie management
    const setSecureCookie = useCallback((name, value, expirationTime) => {
        if (typeof window === 'undefined') return false;

        try {
            const expires = new Date(Date.now() + expirationTime);
            const cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/; secure=${REMEMBER_ME_CONFIG.SECURE}; samesite=${REMEMBER_ME_CONFIG.SAME_SITE}`;

            document.cookie = cookieString;
            return true;
        } catch (error) {
            console.error('Failed to set cookie:', error);
            return false;
        }
    }, []);

    const getCookieValue = useCallback((name) => {
        if (typeof window === 'undefined') return null;

        try {
            const cookies = document.cookie.split(';');
            const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
            return cookie ? cookie.split('=')[1] : null;
        } catch (error) {
            console.error('Failed to get cookie:', error);
            return null;
        }
    }, []);

    const clearCookie = useCallback((name) => {
        if (typeof window === 'undefined') return;

        try {
            const expiredDate = new Date(0).toUTCString();
            document.cookie = `${name}=; expires=${expiredDate}; path=/; secure=${REMEMBER_ME_CONFIG.SECURE}; samesite=${REMEMBER_ME_CONFIG.SAME_SITE}`;
        } catch (error) {
            console.error('Failed to clear cookie:', error);
        }
    }, []);

    // Enhanced localStorage management with quota handling
    const setStorageItem = useCallback((key, value) => {
        if (typeof window === 'undefined') return false;

        try {
            const data = {
                value,
                timestamp: Date.now(),
                expires: Date.now() + REMEMBER_ME_CONFIG.MAX_STORAGE_AGE
            };

            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                // Clear old data and retry
                try {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('cedo_') && key !== 'cedo_user_preferences') {
                            keysToRemove.push(key);
                        }
                    }

                    keysToRemove.forEach(key => localStorage.removeItem(key));

                    // Retry with smaller data
                    const compactData = {
                        value: typeof value === 'string' ? value : JSON.stringify(value),
                        timestamp: Date.now(),
                        expires: Date.now() + REMEMBER_ME_CONFIG.MAX_STORAGE_AGE
                    };

                    localStorage.setItem(key, JSON.stringify(compactData));
                    return true;
                } catch (retryError) {
                    console.error('Storage quota exceeded even after cleanup:', retryError);
                    return false;
                }
            }

            console.error('Failed to set storage item:', error);
            return false;
        }
    }, []);

    const getStorageItem = useCallback((key) => {
        if (typeof window === 'undefined') return null;

        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const parsed = JSON.parse(stored);

            // Check expiration
            if (parsed.expires && Date.now() > parsed.expires) {
                localStorage.removeItem(key);
                return null;
            }

            return parsed.value;
        } catch (error) {
            console.error('Failed to get storage item:', error);
            localStorage.removeItem(key); // Remove corrupted data
            return null;
        }
    }, []);

    // Update Remember Me status
    const updateStatus = useCallback(() => {
        const isEnabled = getCookieValue(REMEMBER_ME_CONFIG.REMEMBER_ME) === 'true';
        const hasToken = !!getCookieValue(REMEMBER_ME_CONFIG.AUTH_TOKEN);
        const isSupported = checkSupport();

        setRememberMeStatus(prev => ({
            ...prev,
            isEnabled,
            hasToken,
            isSupported,
            isLoading: false
        }));
    }, [getCookieValue, checkSupport]);

    // Load stored preferences
    const loadStoredPreferences = useCallback(() => {
        try {
            const preferences = getStorageItem(REMEMBER_ME_CONFIG.USER_PREFS);
            setStoredPreferences(preferences);
            return preferences;
        } catch (error) {
            console.error('Failed to load stored preferences:', error);
            return null;
        }
    }, [getStorageItem]);

    // Validate token with backend
    const validateToken = useCallback(async () => {
        const token = getCookieValue(REMEMBER_ME_CONFIG.AUTH_TOKEN);
        if (!token) return null;

        try {
            setRememberMeStatus(prev => ({ ...prev, isLoading: true }));

            // Make API call to validate token
            const response = await fetch('/api/auth/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                return data.user;
            } else {
                // Token is invalid, clear it
                clearCookie(REMEMBER_ME_CONFIG.AUTH_TOKEN);
                clearCookie(REMEMBER_ME_CONFIG.REMEMBER_ME);
                return null;
            }
        } catch (error) {
            console.warn('Token validation failed:', error);
            return null;
        } finally {
            setRememberMeStatus(prev => ({ ...prev, isLoading: false }));
        }
    }, [getCookieValue, clearCookie]);

    // Attempt auto-login
    const attemptAutoLogin = useCallback(async () => {
        if (isAutoLoginAttempted || user || isLoading || !isInitialized) {
            return;
        }

        try {
            setIsAutoLoginAttempted(true);
            setRememberMeStatus(prev => ({ ...prev, isLoading: true }));

            const validatedUser = await validateToken();

            if (validatedUser) {
                // Use the existing signIn method from auth context
                await signIn(validatedUser.email, '', true); // Empty password for auto-login

                toast({
                    title: "Welcome back!",
                    description: "You've been automatically signed in.",
                    variant: "default"
                });

                console.log('✅ Auto-login successful');
                return true;
            }
        } catch (error) {
            console.warn('Auto-login failed:', error);
            setRememberMeStatus(prev => ({
                ...prev,
                lastError: error.message,
                isLoading: false
            }));
        } finally {
            setRememberMeStatus(prev => ({ ...prev, isLoading: false }));
        }

        return false;
    }, [isAutoLoginAttempted, user, isLoading, isInitialized, validateToken, signIn, toast]);

    // Handle Remember Me login
    const handleRememberMeLogin = useCallback(async (userData, rememberMe) => {
        try {
            if (rememberMe && userData.token) {
                // Set secure cookies
                const expirationTime = REMEMBER_ME_CONFIG.REMEMBER_ME_SESSION;
                setSecureCookie(REMEMBER_ME_CONFIG.AUTH_TOKEN, userData.token, expirationTime);
                setSecureCookie(REMEMBER_ME_CONFIG.REMEMBER_ME, 'true', expirationTime);

                // Store user preferences
                const preferences = {
                    email: userData.email || userData.user?.email,
                    lastLogin: Date.now(),
                    rememberMe: true
                };

                setStorageItem(REMEMBER_ME_CONFIG.USER_PREFS, preferences);
                setStoredPreferences(preferences);

                updateStatus();

                toast({
                    title: "Remember Me Enabled",
                    description: "Your login information has been saved securely.",
                    variant: "default"
                });

                return true;
            } else {
                // Clear Remember Me data if not requested
                await handleRememberMeLogout();
                return true;
            }
        } catch (error) {
            console.error('Failed to handle Remember Me login:', error);
            setRememberMeStatus(prev => ({
                ...prev,
                lastError: error.message
            }));

            toast({
                title: "Remember Me Failed",
                description: "Could not save your login preferences. Please try again.",
                variant: "destructive"
            });

            return false;
        }
    }, [setSecureCookie, setStorageItem, updateStatus, toast]);

    // Handle logout with cleanup
    const handleRememberMeLogout = useCallback(async () => {
        try {
            clearCookie(REMEMBER_ME_CONFIG.AUTH_TOKEN);
            clearCookie(REMEMBER_ME_CONFIG.REMEMBER_ME);
            localStorage.removeItem(REMEMBER_ME_CONFIG.USER_PREFS);

            setStoredPreferences(null);
            updateStatus();

            console.log('✅ Remember Me data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear Remember Me data:', error);
            return false;
        }
    }, [clearCookie, updateStatus]);

    // Get stored preferences
    const getStoredPreferences = useCallback(() => {
        return storedPreferences || loadStoredPreferences();
    }, [storedPreferences, loadStoredPreferences]);

    // Check if Remember Me is enabled
    const hasRememberMeEnabled = useCallback(() => {
        return rememberMeStatus.isEnabled;
    }, [rememberMeStatus.isEnabled]);

    // Get comprehensive status
    const getRememberMeStatus = useCallback(() => {
        return {
            ...rememberMeStatus,
            preferences: getStoredPreferences(),
            isAutoLoginAttempted,
            isInitialized
        };
    }, [rememberMeStatus, getStoredPreferences, isAutoLoginAttempted, isInitialized]);

    // Initialize Remember Me system
    useEffect(() => {
        const isSupported = checkSupport();
        setRememberMeStatus(prev => ({ ...prev, isSupported }));

        if (isSupported) {
            loadStoredPreferences();
            updateStatus();

            // Set up periodic status checks
            statusCheckInterval.current = setInterval(updateStatus, 30000); // Every 30 seconds
        }

        return () => {
            if (statusCheckInterval.current) {
                clearInterval(statusCheckInterval.current);
            }
        };
    }, [checkSupport, loadStoredPreferences, updateStatus]);

    // Attempt auto-login when conditions are met
    useEffect(() => {
        if (isInitialized && !user && !isLoading && rememberMeStatus.isEnabled && !isAutoLoginAttempted) {
            autoLoginTimeout.current = setTimeout(() => {
                attemptAutoLogin();
            }, 1000); // Delay to ensure auth context is ready
        }

        return () => {
            if (autoLoginTimeout.current) {
                clearTimeout(autoLoginTimeout.current);
            }
        };
    }, [isInitialized, user, isLoading, rememberMeStatus.isEnabled, isAutoLoginAttempted, attemptAutoLogin]);

    return {
        // State
        rememberMeStatus,
        isRememberMeSupported: rememberMeStatus.isSupported,
        isAutoLoginAttempted,
        storedPreferences,

        // Actions
        handleRememberMeLogin,
        handleRememberMeLogout,
        attemptAutoLogin,
        updateStatus,

        // Utilities
        getStoredPreferences,
        hasRememberMeEnabled,
        getRememberMeStatus,

        // Manual controls
        clearRememberMeData: handleRememberMeLogout,
        refreshStatus: updateStatus
    };
};
