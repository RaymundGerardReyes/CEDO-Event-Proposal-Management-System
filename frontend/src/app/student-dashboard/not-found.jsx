// frontend/src/app/student-dashboard/not-found.jsx

'use client'

import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cedo-blue via-cedo-blue to-cedo-blue/90 p-4">
            <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Page Not Found</CardTitle>
                    <CardDescription className="text-gray-600">
                        Sorry, we couldn't find the page you're looking for.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center text-sm text-gray-500">
                        The page you requested doesn't exist or has been moved.
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/student-dashboard" className="w-full">
                            <Button className="w-full bg-cedo-blue hover:bg-cedo-blue/90 text-white">
                                <Home className="mr-2 h-4 w-4" />
                                Go to Dashboard
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                // Use router refresh instead of window.location.reload()
                                if (typeof window !== 'undefined') {
                                    window.location.href = window.location.pathname;
                                }
                            }}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 