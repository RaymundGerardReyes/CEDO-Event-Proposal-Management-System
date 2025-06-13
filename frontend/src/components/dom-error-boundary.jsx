"use client";

import { AlertCircle, ExternalLink, RotateCcw, Shield } from 'lucide-react';
import React from 'react';

class DOMErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Enhanced error logging with specific removeChild detection
        console.group("🛡️ DOM Error Boundary Caught Error");
        console.error("Error:", error);
        console.error("Error Info:", errorInfo);
        console.error("Component Stack:", errorInfo.componentStack);

        // Check if this is a removeChild error
        const isRemoveChildError = error?.message?.includes('removeChild') ||
            error?.message?.includes('removeChild on Node') ||
            error?.name === 'NotFoundError';

        if (isRemoveChildError) {
            console.warn("🔍 Detected removeChild error - likely browser extension interference");
            console.warn("📝 Suggested solutions:");
            console.warn("   1. Disable browser extensions");
            console.warn("   2. Use incognito/private mode");
            console.warn("   3. Try a different browser");
        }

        console.groupEnd();

        this.setState({ errorInfo });

        // Report to error tracking service in production
        if (process.env.NODE_ENV === 'production' && window.gtag) {
            window.gtag('event', 'exception', {
                description: error.toString(),
                fatal: false,
                custom_map: {
                    error_boundary: 'DOMErrorBoundary',
                    is_remove_child: isRemoveChildError
                }
            });
        }
    }

    handleRetry = () => {
        // Increment retry count and clear error state
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1
        }));

        // Force a full page reload if too many retries
        if (this.state.retryCount >= 2) {
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    }

    handleIncognitoMode = () => {
        // Provide guidance for incognito mode
        if (navigator.userAgent.includes('Chrome')) {
            alert('To open in incognito mode:\n1. Press Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)\n2. Navigate to this page again');
        } else if (navigator.userAgent.includes('Firefox')) {
            alert('To open in private mode:\n1. Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)\n2. Navigate to this page again');
        } else {
            alert('Please try opening this page in your browser\'s private/incognito mode');
        }
    }

    render() {
        if (this.state.hasError) {
            const isRemoveChildError = this.state.error?.message?.includes('removeChild') ||
                this.state.error?.message?.includes('removeChild on Node') ||
                this.state.error?.name === 'NotFoundError';

            return (
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200">
                        {/* Header */}
                        <div className="bg-red-50 border-b border-red-100 p-6 rounded-t-lg">
                            <div className="flex items-center">
                                <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Something went wrong</h1>
                                    <p className="text-red-600 font-medium">
                                        {isRemoveChildError
                                            ? "Browser Extension Conflict Detected"
                                            : "Unexpected Application Error"
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Error Description */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <Shield className="h-5 w-5 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-yellow-800 mb-2">
                                            {isRemoveChildError ? "Browser Extension Interference" : "Application Error"}
                                        </h3>
                                        <p className="text-yellow-700 text-sm">
                                            {isRemoveChildError
                                                ? "A browser extension is modifying the page structure, causing conflicts with the application. This is a common issue with extensions like Google Translate, Grammarly, LastPass, or ad blockers."
                                                : "An unexpected error occurred while rendering the application. This might be temporary."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Solutions */}
                            {isRemoveChildError && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-800 mb-3">💡 Quick Solutions</h3>
                                    <div className="space-y-2 text-sm text-blue-700">
                                        <div className="flex items-center">
                                            <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-3 font-bold">1</span>
                                            <span>Disable browser extensions temporarily</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-3 font-bold">2</span>
                                            <span>Try using incognito/private browsing mode</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-3 font-bold">3</span>
                                            <span>Refresh the page or try a different browser</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Details */}
                            <details className="bg-gray-50 border border-gray-200 rounded-lg">
                                <summary className="cursor-pointer p-4 font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                    Technical Error Details
                                </summary>
                                <div className="p-4 border-t border-gray-200">
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-medium text-gray-800 mb-1">Error Message:</h4>
                                            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded border overflow-auto">
                                                {this.state.error?.toString()}
                                            </pre>
                                        </div>
                                        {this.state.errorInfo?.componentStack && (
                                            <div>
                                                <h4 className="font-medium text-gray-800 mb-1">Component Stack:</h4>
                                                <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded border overflow-auto max-h-32">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </details>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={this.handleRetry}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Try to Recover {this.state.retryCount > 0 && `(${this.state.retryCount + 1}/3)`}
                                </button>

                                {isRemoveChildError && (
                                    <button
                                        onClick={this.handleIncognitoMode}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Open in Incognito
                                    </button>
                                )}

                                <button
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default DOMErrorBoundary; 