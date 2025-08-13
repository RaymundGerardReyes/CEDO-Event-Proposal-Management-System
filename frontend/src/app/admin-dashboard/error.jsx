// frontend/src/app/admin-dashboard/error.jsx

"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function ErrorBoundary({ error, reset }) {
    return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-2xl">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Something went wrong!</AlertTitle>
                <AlertDescription className="mt-2 flex flex-col gap-4">
                    <p>{error.message || "An unexpected error occurred."}</p>
                    <Button
                        variant="outline"
                        className="w-fit"
                        onClick={reset}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try again
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    )
}
