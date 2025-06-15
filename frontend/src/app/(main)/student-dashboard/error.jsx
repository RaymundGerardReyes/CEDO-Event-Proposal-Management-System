// frontend/src/app/(main)/student-dashboard/error.jsx

'use client'

import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Student Dashboard Error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-red-100 p-3 rounded-full">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    <CardTitle className="text-xl text-gray-900">Oops! Something went wrong</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            We encountered an unexpected error while loading the dashboard. This is usually temporary.
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="text-left bg-gray-100 p-3 rounded text-sm mb-4">
                                <summary className="font-medium cursor-pointer">Error Details (Development)</summary>
                                <pre className="mt-2 text-xs overflow-auto">
                                    {error?.message || 'Unknown error'}
                                </pre>
                            </details>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={reset}
                            className="w-full bg-[#001a56] hover:bg-[#001a56]/90"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>

                        <Link href="/student-dashboard" className="w-full">
                            <Button variant="outline" className="w-full">
                                <Home className="h-4 w-4 mr-2" />
                                Go to Dashboard Home
                            </Button>
                        </Link>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        <p>If this problem persists, please contact support.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 