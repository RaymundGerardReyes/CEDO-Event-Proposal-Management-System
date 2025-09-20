/**
 * useRememberMe Hook
 * 
 * Custom hook for managing Remember Me functionality with:
 * - Auto-login on page load
 * - Secure token management
 * - User preference storage
 * - Session state management
 * 
 * Key approaches: Security-first design, automatic token refresh, user experience optimization
 */

import { useAuth } from '@/contexts/auth-context';
import {
    attemptAutoLogin,
    clearAllRememberMeData,
    getUserPreferences,
    isRememberMeEnabled,
    setAuthCookie,
    storeUserPreferences
} from '@/lib/remember-me';
import { useCallback, useEffect, useState } from 'react';

export const useRememberMe = () => {
    const { login, user, isLoading } = useAuth();
    const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
    const [isRememberMeSupported, setIsRememberMeSupported] = useState(false);
    const [rememberMeStatus, setRememberMeStatus] = useState({
        isEnabled: false,
        hasToken: false,
        isSupported: false
    });

    // Check if Remember Me is supported
    useEffect(() => {
        const checkSupport = () => {
            const supported = typeof window !== 'undefined' &&
                'localStorage' in window &&
                'cookie' in document;
            setIsRememberMeSupported(supported);
        };

        checkSupport();
    }, []);

    // Attempt auto-login on component mount
    useEffect(() => {
        const performAutoLogin = async () => {
            if (isAutoLoginAttempted || user || isLoading) return;

            try {
                setIsAutoLoginAttempted(true);
                const autoLoginUser = await attemptAutoLogin();

                if (autoLoginUser) {
                    await login(autoLoginUser);
                    console.log('Auto-login successful');
                }
            } catch (error) {
                console.warn('Auto-login failed:', error);
                // Clear invalid tokens
                clearAllRememberMeData();
            }
        };

        performAutoLogin();
    }, [isAutoLoginAttempted, user, isLoading, login]);

    // Update Remember Me status
    useEffect(() => {
        const updateStatus = () => {
            setRememberMeStatus({
                isEnabled: isRememberMeEnabled(),
                hasToken: !!document.cookie.includes('cedo_auth_token'),
                isSupported: isRememberMeSupported
            });
        };

        updateStatus();

        // Update status periodically
        const interval = setInterval(updateStatus, 5000);
        return () => clearInterval(interval);
    }, [isRememberMeSupported]);

    // Handle Remember Me login
    const handleRememberMeLogin = useCallback(async (userData, rememberMe) => {
        try {
            if (rememberMe && userData.token) {
                setAuthCookie(userData.token, true);
                storeUserPreferences({
                    email: userData.user.email,
                    lastLogin: Date.now(),
                    rememberMe: true
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to set Remember Me:', error);
            return false;
        }
    }, []);

    // Handle logout with Remember Me cleanup
    const handleRememberMeLogout = useCallback(async () => {
        try {
            clearAllRememberMeData();
            return true;
        } catch (error) {
            console.error('Failed to clear Remember Me data:', error);
            return false;
        }
    }, []);

    // Get stored user preferences
    const getStoredPreferences = useCallback(() => {
        return getUserPreferences();
    }, []);

    // Update user preferences
    const updateUserPreferences = useCallback((preferences) => {
        try {
            storeUserPreferences(preferences);
            return true;
        } catch (error) {
            console.error('Failed to update user preferences:', error);
            return false;
        }
    }, []);

    // Check if user has Remember Me enabled
    const hasRememberMeEnabled = useCallback(() => {
        return isRememberMeEnabled();
    }, []);

    // Get Remember Me status for debugging
    const getRememberMeStatus = useCallback(() => {
        return {
            ...rememberMeStatus,
            preferences: getStoredPreferences(),
            isAutoLoginAttempted
        };
    }, [rememberMeStatus, getStoredPreferences, isAutoLoginAttempted]);

    return {
        // State
        isRememberMeSupported,
        rememberMeStatus,
        isAutoLoginAttempted,

        // Actions
        handleRememberMeLogin,
        handleRememberMeLogout,
        getStoredPreferences,
        updateUserPreferences,
        hasRememberMeEnabled,
        getRememberMeStatus,

        // Utilities
        clearAllRememberMeData
    };
};

