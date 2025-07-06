'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component } from 'react';

class ChunkErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Chunk Error Boundary caught an error:', error, errorInfo);

        // Check if it's a chunk loading error
        if (error.message && error.message.includes('Loading chunk')) {
            console.log('Detected chunk loading error, attempting recovery...');
        }
    }

    handleRetry = () => {
        // Clear the error state
        this.setState({ hasError: false, error: null });

        // Force a page reload to retry loading chunks
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                        <Alert variant="destructive" className="shadow-lg">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-base sm:text-lg">Loading Error</AlertTitle>
                            <AlertDescription className="text-sm sm:text-base mt-2">
                                There was an error loading this page. This might be due to a network issue or a temporary problem with the application.
                            </AlertDescription>
                        </Alert>

                        <div className="mt-4 flex flex-col gap-2">
                            <Button
                                onClick={this.handleRetry}
                                className="w-full"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry Loading
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                                className="w-full"
                            >
                                Go to Homepage
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ChunkErrorBoundary; 