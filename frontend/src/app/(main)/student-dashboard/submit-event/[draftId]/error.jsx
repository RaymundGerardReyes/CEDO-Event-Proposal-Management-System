'use client' // Error boundaries must be Client Components

import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('🚨 Submit Event Error:', error)

        // Log additional debugging information
        console.error('Error details:', {
            message: error.message,
            digest: error.digest,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        })
    }, [error])

    const handleGoHome = () => {
        window.location.href = '/student-dashboard'
    }

    const handleRefresh = () => {
        window.location.reload()
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                        Something went wrong!
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        We encountered an unexpected error while processing your request.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Error details for development */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="p-3 bg-gray-100 rounded-md text-sm text-gray-700 font-mono">
                            <p className="font-semibold mb-1">Error Details:</p>
                            <p className="break-words">{error.message}</p>
                            {error.digest && (
                                <p className="text-xs mt-1 text-gray-500">
                                    Digest: {error.digest}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={reset}
                            className="w-full"
                            variant="default"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try again
                        </Button>

                        <Button
                            onClick={handleRefresh}
                            className="w-full"
                            variant="outline"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh page
                        </Button>

                        <Button
                            onClick={handleGoHome}
                            className="w-full"
                            variant="ghost"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Go to Dashboard
                        </Button>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        <p>If the problem persists, please contact support.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 