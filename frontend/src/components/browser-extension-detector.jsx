"use client";

import { AlertCircle, Info, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const BrowserExtensionDetector = () => {
    const [showWarning, setShowWarning] = useState(false);
    const [detectedExtensions, setDetectedExtensions] = useState([]);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Don't run detection if already dismissed
        if (isDismissed) return;

        const detected = [];

        // Enhanced detection methods
        const checkExtensions = () => {
            // 1. Google Translate - Multiple detection methods
            if (
                document.body.classList.contains('translated-ltr') ||
                document.body.classList.contains('translated-rtl') ||
                document.querySelector('html.translated-ltr') ||
                document.querySelector('html.translated-rtl') ||
                document.querySelector('.goog-te-banner-frame') ||
                document.querySelector('.skiptranslate') ||
                window.google?.translate
            ) {
                detected.push('Google Translate');
            }

            // 2. Grammarly - Enhanced detection
            if (
                document.querySelector('grammarly-desktop-integration') ||
                document.querySelector('div[data-grammarly-reactid]') ||
                document.querySelector('.gr_-check-id') ||
                window.grammarly ||
                document.querySelector('[data-gr-ext]')
            ) {
                detected.push('Grammarly');
            }

            // 3. LastPass
            if (
                document.body.classList.contains('lastpass-extension') ||
                document.querySelector('#lp-pom-root') ||
                document.querySelector('.lp-dropdown-menu') ||
                window.lpvault
            ) {
                detected.push('LastPass');
            }

            // 4. Honey
            if (
                document.querySelector('[data-honey-extension]') ||
                document.querySelector('.honey-dropdown') ||
                window.honey
            ) {
                detected.push('Honey');
            }

            // 5. AdBlock Plus / AdBlocker
            if (
                window.adblockplus ||
                document.querySelector('.adblockplus') ||
                window.uBlock ||
                document.querySelector('#adblock-detected')
            ) {
                detected.push('AdBlocker');
            }

            // 6. Password Managers (generic detection)
            if (
                document.querySelector('[data-dashpass]') ||
                document.querySelector('[data-keepass]') ||
                document.querySelector('[data-bitwarden]') ||
                document.querySelector('.password-manager-icon')
            ) {
                detected.push('Password Manager');
            }

            // 7. Dark Reader
            if (
                document.querySelector('meta[name="darkreader"]') ||
                document.querySelector('.darkreader') ||
                window.DarkReader
            ) {
                detected.push('Dark Reader');
            }

            // 8. MetaMask / Crypto Wallets
            if (
                window.ethereum ||
                window.web3 ||
                document.querySelector('[data-metamask]')
            ) {
                detected.push('Crypto Wallet (MetaMask/etc)');
            }

            // 9. Social Media Extensions
            if (
                document.querySelector('[data-pinterest]') ||
                document.querySelector('.pinterest-hover-button') ||
                document.querySelector('[data-facebook-share]')
            ) {
                detected.push('Social Media Extension');
            }

            // 10. Generic extension detection - check for injected scripts/styles
            const injectedElements = document.querySelectorAll('[data-extension-id], [data-ext-id], .extension-injected');
            if (injectedElements.length > 0) {
                detected.push('Unknown Extension');
            }

            return detected;
        };

        // Initial check
        const initialDetected = checkExtensions();

        // Delayed check for extensions that load later
        const delayedCheck = setTimeout(() => {
            const laterDetected = checkExtensions();
            const allDetected = [...new Set([...initialDetected, ...laterDetected])];

            if (allDetected.length > 0) {
                setDetectedExtensions(allDetected);
                setShowWarning(true);
            }
        }, 2000);

        // Observer for DOM mutations (to catch extensions that inject later)
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            mutations.forEach((mutation) => {
                // Check if new nodes were added that might be from extensions
                if (mutation.addedNodes.length > 0) {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // Element node
                            // Safe className handling - convert to string before using includes
                            const classNameStr = typeof node.className === 'string'
                                ? node.className
                                : node.className?.toString?.() || '';

                            const hasExtensionAttributes = node.hasAttribute?.('data-extension-id') ||
                                node.hasAttribute?.('data-ext-id') ||
                                classNameStr.includes('extension') ||
                                classNameStr.includes('grammarly') ||
                                classNameStr.includes('translate');
                            if (hasExtensionAttributes) {
                                shouldCheck = true;
                                break;
                            }
                        }
                    }
                }
            });

            if (shouldCheck) {
                const newDetected = checkExtensions();
                if (newDetected.length > detectedExtensions.length) {
                    setDetectedExtensions(newDetected);
                    setShowWarning(true);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-extension-id', 'data-ext-id']
        });

        return () => {
            clearTimeout(delayedCheck);
            observer.disconnect();
        };
    }, [isDismissed, detectedExtensions.length]);

    const handleDismiss = () => {
        setShowWarning(false);
        setIsDismissed(true);
        // Store dismissal in sessionStorage so it doesn't show again this session
        sessionStorage.setItem('extensionWarningDismissed', 'true');
    };

    const openIncognito = () => {
        if (navigator.userAgent.includes('Chrome')) {
            alert('To open in incognito mode:\n• Press Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)\n• Copy this URL and paste it in the incognito window');
        } else if (navigator.userAgent.includes('Firefox')) {
            alert('To open in private mode:\n• Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)\n• Copy this URL and paste it in the private window');
        } else {
            alert('Please open this page in your browser\'s private/incognito mode to avoid extension conflicts');
        }
    };

    // Don't show if dismissed or if running in incognito (extensions usually disabled)
    if (!showWarning || isDismissed || sessionStorage.getItem('extensionWarningDismissed')) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-[9999] w-full max-w-md animate-slide-in">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                            <span className="font-semibold text-yellow-800 text-sm">Extension Conflict Alert</span>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-yellow-600 hover:text-yellow-800 transition-colors"
                            aria-label="Dismiss warning"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start mb-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800 mb-1">
                                Browser Extension Detected
                            </p>
                            <p className="text-xs text-yellow-700">
                                We've detected <strong>{detectedExtensions.join(', ')}</strong> which may cause display issues.
                            </p>
                        </div>
                    </div>

                    {/* Solutions */}
                    <div className="bg-white bg-opacity-50 rounded-md p-3 mb-3">
                        <div className="flex items-center mb-2">
                            <Info className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-xs font-medium text-gray-700">If you experience issues:</span>
                        </div>
                        <ul className="text-xs text-gray-600 space-y-1 ml-6">
                            <li>• Temporarily disable the extension(s)</li>
                            <li>• Use incognito/private browsing mode</li>
                            <li>• Refresh the page</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={openIncognito}
                            className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                            Open Incognito
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-gray-600 text-white text-xs py-2 px-3 rounded-md hover:bg-gray-700 transition-colors font-medium"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrowserExtensionDetector; 