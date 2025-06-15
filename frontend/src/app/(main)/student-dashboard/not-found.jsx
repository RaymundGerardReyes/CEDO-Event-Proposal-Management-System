// frontend/src/app/(main)/student-dashboard/not-found.jsx

'use client'

import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { ArrowLeft, FileX, Home } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <FileX className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <CardTitle className="text-xl text-gray-900">Page Not Found</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            The page you're looking for doesn't exist or has been moved.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link href="/student-dashboard" className="w-full">
                            <Button className="w-full bg-[#001a56] hover:bg-[#001a56]/90">
                                <Home className="h-4 w-4 mr-2" />
                                Go to Dashboard Home
                            </Button>
                        </Link>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        <p>Need help? Contact support for assistance.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 