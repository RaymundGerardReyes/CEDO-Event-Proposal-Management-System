import React from 'react';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * Key approaches: Error isolation, graceful degradation, user experience preservation
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state to display fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Update state with error details
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log to external service in production
        if (process.env.NODE_ENV === 'production') {
            // Here you would send to error monitoring service like Sentry
            console.error('Production error:', {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack
            });
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                            Something went wrong
                        </h2>

                        <p className="text-gray-600 text-center mb-6">
                            We're sorry, but something unexpected happened. Please try refreshing the page.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 bg-cedo-blue text-white px-4 py-2 rounded-lg hover:bg-cedo-blue-dark transition-colors duration-200"
                            >
                                Try Again
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                            >
                                Refresh Page
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                                    Error Details (Development)
                                </summary>
                                <div className="mt-2 text-xs text-gray-600">
                                    <pre className="whitespace-pre-wrap overflow-auto">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

