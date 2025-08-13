"use client"

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="text-center space-y-6 p-8 max-w-md mx-auto">
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-cedo-blue dark:text-blue-400">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Page Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Sorry, we couldn't find the page you're looking for.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="default" className="bg-cedo-blue hover:bg-cedo-blue/90">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
} 