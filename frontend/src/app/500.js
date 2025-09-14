'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Custom500() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Server Error
                    </h1>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Something went wrong on our end. Please try again later.
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="flex-1"
                        variant="outline"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
