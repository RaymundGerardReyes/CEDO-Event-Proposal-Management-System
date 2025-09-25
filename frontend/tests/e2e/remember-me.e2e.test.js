/**
 * End-to-End Tests for Remember Me Functionality
 * 
 * Comprehensive E2E testing of Remember Me flow including:
 * - User login with Remember Me
 * - Auto-login on page reload
 * - Cookie persistence
 * - Error scenarios
 * - Cross-browser compatibility
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_USER = {
    email: 'test@example.com',
    password: 'testpassword123'
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Remember Me Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Clear all storage and cookies before each test
        await page.context().clearCookies();
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // Navigate to sign-in page
        await page.goto(`${BASE_URL}/sign-in`);
        await page.waitForLoadState('networkidle');
    });

    test('should save login credentials when Remember Me is checked', async ({ page }) => {
        // Fill in login form
        await page.fill('[data-testid="email-input"]', TEST_USER.email);
        await page.fill('[data-testid="password-input"]', TEST_USER.password);

        // Check Remember Me checkbox
        await page.check('[data-testid="remember-me-checkbox"]');

        // Verify Remember Me is checked
        const isChecked = await page.isChecked('[data-testid="remember-me-checkbox"]');
        expect(isChecked).toBe(true);

        // Submit form (this would normally redirect to dashboard)
        await page.click('[data-testid="sign-in-button"]');

        // Wait for navigation or success state
        await page.waitForTimeout(2000);

        // Check that cookies were set
        const cookies = await page.context().cookies();
        const authCookie = cookies.find(cookie => cookie.name === 'cedo_auth_token');
        const rememberMeCookie = cookies.find(cookie => cookie.name === 'cedo_remember_me');

        expect(authCookie).toBeTruthy();
        expect(rememberMeCookie?.value).toBe('true');

        // Check localStorage for preferences
        const preferences = await page.evaluate(() => {
            const stored = localStorage.getItem('cedo_user_preferences');
            return stored ? JSON.parse(stored) : null;
        });

        expect(preferences).toBeTruthy();
        expect(preferences.value.email).toBe(TEST_USER.email);
        expect(preferences.value.rememberMe).toBe(true);
    });

    test('should not save credentials when Remember Me is unchecked', async ({ page }) => {
        // Fill in login form
        await page.fill('[data-testid="email-input"]', TEST_USER.email);
        await page.fill('[data-testid="password-input"]', TEST_USER.password);

        // Ensure Remember Me is unchecked
        await page.uncheck('[data-testid="remember-me-checkbox"]');

        // Submit form
        await page.click('[data-testid="sign-in-button"]');
        await page.waitForTimeout(2000);

        // Check that Remember Me cookie is not set
        const cookies = await page.context().cookies();
        const rememberMeCookie = cookies.find(cookie => cookie.name === 'cedo_remember_me');

        expect(rememberMeCookie).toBeFalsy();
    });

    test('should show security status indicator', async ({ page }) => {
        // Check Remember Me checkbox
        await page.check('[data-testid="remember-me-checkbox"]');

        // Look for security indicator
        const securityIndicator = page.locator('[data-testid="security-status"]');
        await expect(securityIndicator).toBeVisible();

        // Check that it shows "Standard" status initially
        await expect(securityIndicator).toContainText('Standard');
    });

    test('should display saved login information when available', async ({ page }) => {
        // Pre-populate localStorage with saved preferences
        await page.evaluate(() => {
            const preferences = {
                value: {
                    email: 'saved@example.com',
                    lastLogin: Date.now(),
                    rememberMe: true
                },
                timestamp: Date.now(),
                expires: Date.now() + 30 * 24 * 60 * 60 * 1000
            };
            localStorage.setItem('cedo_user_preferences', JSON.stringify(preferences));
        });

        // Set Remember Me cookie
        await page.context().addCookies([
            {
                name: 'cedo_remember_me',
                value: 'true',
                domain: 'localhost',
                path: '/',
                expires: Date.now() / 1000 + 30 * 24 * 60 * 60
            }
        ]);

        // Reload page to trigger auto-loading
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check that saved information is displayed
        const savedInfo = page.locator('[data-testid="saved-login-info"]');
        await expect(savedInfo).toBeVisible();
        await expect(savedInfo).toContainText('saved@example.com');
    });

    test('should clear saved data when Clear button is clicked', async ({ page }) => {
        // Pre-populate with saved data
        await page.evaluate(() => {
            const preferences = {
                value: {
                    email: 'saved@example.com',
                    lastLogin: Date.now(),
                    rememberMe: true
                },
                timestamp: Date.now(),
                expires: Date.now() + 30 * 24 * 60 * 60 * 1000
            };
            localStorage.setItem('cedo_user_preferences', JSON.stringify(preferences));
        });

        await page.context().addCookies([
            {
                name: 'cedo_remember_me',
                value: 'true',
                domain: 'localhost',
                path: '/'
            }
        ]);

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Click clear button
        await page.click('[data-testid="clear-saved-data"]');

        // Verify data is cleared
        const preferences = await page.evaluate(() => {
            return localStorage.getItem('cedo_user_preferences');
        });
        expect(preferences).toBeNull();

        // Verify toast notification
        const toast = page.locator('[data-testid="toast-notification"]');
        await expect(toast).toBeVisible();
        await expect(toast).toContainText('Data Cleared');
    });

    test('should handle localStorage quota exceeded gracefully', async ({ page }) => {
        // Mock localStorage quota exceeded
        await page.evaluate(() => {
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function (key, value) {
                if (key === 'cedo_user_preferences') {
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                return originalSetItem.call(this, key, value);
            };
        });

        // Try to save Remember Me data
        await page.fill('[data-testid="email-input"]', TEST_USER.email);
        await page.fill('[data-testid="password-input"]', TEST_USER.password);
        await page.check('[data-testid="remember-me-checkbox"]');

        await page.click('[data-testid="sign-in-button"]');
        await page.waitForTimeout(2000);

        // Should show error toast
        const errorToast = page.locator('[data-testid="error-toast"]');
        await expect(errorToast).toBeVisible();
        await expect(errorToast).toContainText('Remember Me Failed');
    });

    test('should show browser support warning for unsupported browsers', async ({ page }) => {
        // Mock unsupported browser (no localStorage)
        await page.evaluate(() => {
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: () => null,
                    setItem: () => { throw new Error('Not supported'); },
                    removeItem: () => { },
                    clear: () => { }
                }
            });
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check for browser support warning
        const warning = page.locator('[data-testid="browser-support-warning"]');
        await expect(warning).toBeVisible();
        await expect(warning).toContainText('Limited Browser Support');

        // Remember Me checkbox should be disabled
        const checkbox = page.locator('[data-testid="remember-me-checkbox"]');
        await expect(checkbox).toBeDisabled();
    });

    test('should auto-login on page reload when Remember Me is enabled', async ({ page }) => {
        // Set up Remember Me state
        await page.evaluate(() => {
            const preferences = {
                value: {
                    email: 'auto@example.com',
                    lastLogin: Date.now(),
                    rememberMe: true
                },
                timestamp: Date.now(),
                expires: Date.now() + 30 * 24 * 60 * 60 * 1000
            };
            localStorage.setItem('cedo_user_preferences', JSON.stringify(preferences));
        });

        await page.context().addCookies([
            {
                name: 'cedo_auth_token',
                value: 'valid-token',
                domain: 'localhost',
                path: '/',
                expires: Date.now() / 1000 + 30 * 24 * 60 * 60
            },
            {
                name: 'cedo_remember_me',
                value: 'true',
                domain: 'localhost',
                path: '/'
            }
        ]);

        // Mock successful token validation
        await page.route('**/api/auth/validate-token', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        email: 'auto@example.com',
                        name: 'Auto User'
                    }
                })
            });
        });

        // Navigate to sign-in page
        await page.goto(`${BASE_URL}/sign-in`);

        // Should automatically redirect to dashboard or show welcome message
        await page.waitForTimeout(3000);

        // Check for welcome toast
        const welcomeToast = page.locator('[data-testid="welcome-toast"]');
        await expect(welcomeToast).toBeVisible();
        await expect(welcomeToast).toContainText('Welcome back!');
    });

    test('should handle expired tokens gracefully', async ({ page }) => {
        // Set up expired token
        await page.context().addCookies([
            {
                name: 'cedo_auth_token',
                value: 'expired-token',
                domain: 'localhost',
                path: '/'
            },
            {
                name: 'cedo_remember_me',
                value: 'true',
                domain: 'localhost',
                path: '/'
            }
        ]);

        // Mock failed token validation
        await page.route('**/api/auth/validate-token', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Token expired'
                })
            });
        });

        await page.goto(`${BASE_URL}/sign-in`);
        await page.waitForTimeout(3000);

        // Should clear invalid cookies
        const cookies = await page.context().cookies();
        const authCookie = cookies.find(cookie => cookie.name === 'cedo_auth_token');
        expect(authCookie).toBeFalsy();

        // Should show sign-in form normally
        const signInForm = page.locator('[data-testid="sign-in-form"]');
        await expect(signInForm).toBeVisible();
    });

    test('should persist Remember Me state across browser sessions', async ({ page, context }) => {
        // First session: Enable Remember Me
        await page.fill('[data-testid="email-input"]', TEST_USER.email);
        await page.fill('[data-testid="password-input"]', TEST_USER.password);
        await page.check('[data-testid="remember-me-checkbox"]');

        await page.click('[data-testid="sign-in-button"]');
        await page.waitForTimeout(2000);

        // Get cookies from first session
        const firstSessionCookies = await context.cookies();
        const authCookie = firstSessionCookies.find(c => c.name === 'cedo_auth_token');
        const rememberMeCookie = firstSessionCookies.find(c => c.name === 'cedo_remember_me');

        expect(authCookie).toBeTruthy();
        expect(rememberMeCookie?.value).toBe('true');

        // Second session: Create new context with same cookies
        const newContext = await context.browser().newContext();
        await newContext.addCookies(firstSessionCookies);

        const newPage = await newContext.newPage();
        await newPage.goto(`${BASE_URL}/sign-in`);
        await newPage.waitForLoadState('networkidle');

        // Should still have Remember Me enabled
        const checkbox = newPage.locator('[data-testid="remember-me-checkbox"]');
        await expect(checkbox).toBeChecked();

        await newContext.close();
    });

    test('should show security information panel', async ({ page }) => {
        await page.check('[data-testid="remember-me-checkbox"]');

        // Look for security information
        const securityPanel = page.locator('[data-testid="security-info"]');
        await expect(securityPanel).toBeVisible();

        // Check security features list
        await expect(securityPanel).toContainText('Your password is never stored');
        await expect(securityPanel).toContainText('Only your email is saved');
        await expect(securityPanel).toContainText('Secure HTTP-only cookies');
        await expect(securityPanel).toContainText('Data expires after 30 days');
    });
});
