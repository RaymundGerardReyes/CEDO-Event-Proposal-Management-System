'use client'

import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { Component } from 'react'

class ReportingErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('🚨 ReportingErrorBoundary caught an error:', error)
        console.error('🚨 Error Info:', errorInfo)

        this.setState({
            error,
            errorInfo,
            hasError: true
        })

        // Log specific React 18/Next.js 15 promise errors
        if (error.message?.includes('uncached promise') ||
            error.message?.includes('suspended by') ||
            error.message?.includes('Creating promises inside a Client Component')) {
            console.error('🚨 React 18/Next.js 15 Suspense Promise Error detected')
            console.error('🚨 This is likely caused by async operations in client components')
        }
    }

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1
        }))
    }

    handleRefresh = () => {
        window.location.reload()
    }

    handleGoHome = () => {
        window.location.href = '/student-dashboard'
    }

    render() {
        if (this.state.hasError) {
            const { error, retryCount } = this.state
            const isPromiseError = error?.message?.includes('uncached promise') ||
                error?.message?.includes('suspended by') ||
                error?.message?.includes('Creating promises inside a Client Component')

            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-gray-900">
                                {isPromiseError ? 'Loading Error' : 'Something went wrong!'}
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                {isPromiseError
                                    ? 'There was an issue loading the reporting page. This is usually temporary.'
                                    : 'We encountered an unexpected error while processing your request.'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Error details for development */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="p-3 bg-gray-100 rounded-md text-sm text-gray-700 font-mono">
                                    <p className="font-semibold mb-1">Error Details:</p>
                                    <p className="break-words">{error?.message}</p>
                                    <p className="text-xs mt-1 text-gray-500">
                                        Retry Count: {retryCount}
                                    </p>
                                    {isPromiseError && (
                                        <p className="text-xs mt-1 text-orange-600">
                                            ⚠️ React 18/Next.js 15 Promise Error - Check Suspense boundaries
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                {retryCount < 3 && (
                                    <Button
                                        onClick={this.handleRetry}
                                        className="w-full"
                                        variant="default"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Try again {retryCount > 0 && `(${retryCount + 1}/3)`}
                                    </Button>
                                )}

                                <Button
                                    onClick={this.handleRefresh}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh page
                                </Button>

                                <Button
                                    onClick={this.handleGoHome}
                                    className="w-full"
                                    variant="ghost"
                                >
                                    <Home className="h-4 w-4 mr-2" />
                                    Go to Dashboard
                                </Button>
                            </div>

                            <div className="text-center text-sm text-gray-500">
                                <p>
                                    {isPromiseError
                                        ? 'If this persists, try refreshing the page or going back to the dashboard.'
                                        : 'If the problem persists, please contact support.'
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}

export default ReportingErrorBoundary 