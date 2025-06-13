"use client";

import { useEffect, useRef } from 'react';

/**
 * DOM Error Monitor - Prevents and handles removeChild errors
 * Based on research from:
 * - https://github.com/remix-run/remix/issues/4822
 * - https://stackoverflow.com/questions/54880669/react-domexception-failed-to-execute-removechild-on-node
 * - https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild
 */
const DOMErrorMonitor = () => {
    const errorCountRef = useRef(0);
    const maxErrors = 3;

    useEffect(() => {
        // 1. Override removeChild to catch and handle errors gracefully
        const originalRemoveChild = Node.prototype.removeChild;

        Node.prototype.removeChild = function (child) {
            try {
                // Verify the child is actually a child of this node before removing
                if (!this.contains(child)) {
                    console.warn('🛡️ DOM Error Prevention: Attempted to remove a node that is not a child');
                    return child; // Return the child without error
                }

                // Verify the child has a parent node
                if (!child.parentNode) {
                    console.warn('🛡️ DOM Error Prevention: Attempted to remove a node with no parent');
                    return child;
                }

                // Verify this node is actually the parent
                if (child.parentNode !== this) {
                    console.warn('🛡️ DOM Error Prevention: Attempted to remove a node from the wrong parent');
                    return child;
                }

                return originalRemoveChild.call(this, child);
            } catch (error) {
                errorCountRef.current++;

                console.group('🛡️ DOM Error Monitor - removeChild Error Caught');
                console.error('Error:', error);
                console.error('Parent:', this);
                console.error('Child:', child);
                console.error('Child parent:', child?.parentNode);
                console.error('Contains child:', this.contains?.(child));
                console.groupEnd();

                // If we're hitting too many errors, reload the page
                if (errorCountRef.current >= maxErrors) {
                    console.warn(`🛡️ DOM Error Monitor: ${maxErrors} errors detected, reloading page...`);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }

                // Return the child to prevent further errors
                return child;
            }
        };

        // 2. Monitor for DOM mutations that might indicate extension interference
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Check for nodes being removed that might cause issues
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if this looks like an extension-injected element
                        // Fix: Safely handle className which might not be a string
                        const classNameStr = typeof node.className === 'string'
                            ? node.className
                            : node.className?.toString?.() || '';
                        const nodeId = node.id || '';

                        const isExtensionElement =
                            node.hasAttribute?.('data-extension-id') ||
                            node.hasAttribute?.('data-ext-id') ||
                            classNameStr.includes('extension') ||
                            classNameStr.includes('grammarly') ||
                            classNameStr.includes('translate') ||
                            nodeId.includes('google') ||
                            nodeId.includes('lastpass');

                        if (isExtensionElement) {
                            console.warn('🔍 DOM Monitor: Extension element removed from DOM:', node);
                        }
                    }
                });

                // Check for nodes being added that might cause conflicts
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check for potentially problematic injections
                        // Fix: Safely handle className which might not be a string
                        const classNameStr = typeof node.className === 'string'
                            ? node.className
                            : node.className?.toString?.() || '';

                        const isPotentiallyProblematic =
                            node.tagName === 'IFRAME' ||
                            node.tagName === 'SCRIPT' ||
                            node.hasAttribute?.('data-extension-id') ||
                            classNameStr.includes('extension');

                        if (isPotentiallyProblematic) {
                            console.info('🔍 DOM Monitor: Potentially problematic element added:', node);
                        }
                    }
                });
            });
        });

        // Start observing DOM changes
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: false // Don't monitor attribute changes to avoid performance issues
        });

        // 3. Global error handler for uncaught DOM errors
        const handleGlobalError = (event) => {
            const error = event.error || event.reason;

            if (error?.message?.includes('removeChild') ||
                error?.message?.includes('removeChild on Node') ||
                error?.name === 'NotFoundError') {

                console.warn('🛡️ DOM Error Monitor: Global removeChild error caught:', error);

                // Prevent the error from bubbling up and crashing the app
                event.preventDefault();
                event.stopPropagation();

                errorCountRef.current++;

                // Reload if too many errors
                if (errorCountRef.current >= maxErrors) {
                    console.warn(`🛡️ DOM Error Monitor: ${maxErrors} global errors detected, reloading page...`);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }

                return false;
            }
        };

        // Add global error listeners
        window.addEventListener('error', handleGlobalError, true);
        window.addEventListener('unhandledrejection', handleGlobalError, true);

        // 4. React-specific error boundary simulation for DOM errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const message = args.join(' ');

            if (message.includes('removeChild') ||
                message.includes('Hydration failed') ||
                message.includes('Text content does not match')) {

                console.warn('🛡️ DOM Error Monitor: React hydration/DOM error detected');
                errorCountRef.current++;

                if (errorCountRef.current >= maxErrors) {
                    console.warn(`🛡️ DOM Error Monitor: ${maxErrors} React errors detected, reloading page...`);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            }

            // Call original console.error
            originalConsoleError(...args);
        };

        // 5. Preventive measures for common extension conflicts
        const preventExtensionConflicts = () => {
            // Disable problematic browser features that extensions might interfere with
            if (typeof document !== 'undefined') {
                // Prevent extensions from modifying the title
                let originalTitle = document.title;
                Object.defineProperty(document, 'title', {
                    get: () => originalTitle,
                    set: (value) => {
                        // Only allow our app to change the title
                        if (document.readyState === 'loading' ||
                            value.includes('CEDO') ||
                            document.hasFocus()) {
                            originalTitle = value;
                        }
                    }
                });
            }
        };

        preventExtensionConflicts();

        // Cleanup function
        return () => {
            // Restore original methods
            Node.prototype.removeChild = originalRemoveChild;
            console.error = originalConsoleError;

            // Remove event listeners
            window.removeEventListener('error', handleGlobalError, true);
            window.removeEventListener('unhandledrejection', handleGlobalError, true);

            // Disconnect observer
            observer.disconnect();
        };
    }, []);

    // This component doesn't render anything, it just monitors
    return null;
};

export default DOMErrorMonitor; 