import { cn } from "@/lib/utils"
import { CheckCircle, Loader2, Zap } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * Enhanced Loading Component with multiple variants
 * Uses custom animations from tailwind.config.js
 */
export function EnhancedLoader({
    variant = "default",
    size = "md",
    message = "Loading...",
    showProgress = false,
    duration = 3000,
    className = "",
    ...props
}) {
    const [progress, setProgress] = useState(0)
    const [currentMessage, setCurrentMessage] = useState(message)

    // Simulate realistic progress
    useEffect(() => {
        if (!showProgress) return

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100
                // Slow down as we approach 100%
                const increment = prev < 70 ? Math.random() * 15 + 5 : Math.random() * 5 + 1
                return Math.min(prev + increment, 100)
            })
        }, 200)

        return () => clearInterval(interval)
    }, [showProgress])

    // Size variants
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12"
    }

    // Variant components
    const variants = {
        // Default spinning loader with brand colors
        default: () => (
            <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                    <Loader2 className={cn("text-cedo-blue animate-spin", sizeClasses[size])} />
                    <div className={cn(
                        "absolute inset-0 rounded-full border-2 border-cedo-gold opacity-20 animate-ping",
                        sizeClasses[size]
                    )} />
                </div>
                {message && (
                    <p className="text-sm text-muted-foreground animate-fade-in">
                        {currentMessage}
                    </p>
                )}
            </div>
        ),

        // Bouncing dots loader
        dots: () => (
            <div className="flex flex-col items-center space-y-3">
                <div className="flex space-x-2">
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className={cn(
                                "bg-cedo-blue rounded-full animate-bounce",
                                size === "sm" ? "w-2 h-2" :
                                    size === "md" ? "w-3 h-3" :
                                        size === "lg" ? "w-4 h-4" : "w-6 h-6"
                            )}
                            style={{
                                animationDelay: `${index * 0.2}s`,
                                animationDuration: '1.4s'
                            }}
                        />
                    ))}
                </div>
                {message && (
                    <p className="text-sm text-muted-foreground animate-fade-in">
                        {currentMessage}
                    </p>
                )}
            </div>
        ),

        // Progress bar loader
        progress: () => (
            <div className="flex flex-col items-center space-y-3 w-full max-w-xs">
                <div className="flex items-center space-x-2">
                    <Zap className={cn("text-cedo-gold", sizeClasses[size])} />
                    <span className="text-sm font-medium">Loading</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cedo-blue to-cedo-gold rounded-full transition-all duration-300 ease-out animate-progress"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {Math.round(progress)}% complete
                </p>
            </div>
        ),

        // Pulse loader
        pulse: () => (
            <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                    <div className={cn(
                        "bg-cedo-blue rounded-full animate-ping",
                        sizeClasses[size]
                    )} />
                    <div className={cn(
                        "absolute inset-0 bg-cedo-gold rounded-full animate-pulse",
                        sizeClasses[size]
                    )} />
                </div>
                {message && (
                    <p className="text-sm text-muted-foreground animate-fade-in">
                        {currentMessage}
                    </p>
                )}
            </div>
        ),

        // Skeleton loader
        skeleton: () => (
            <div className="space-y-3 w-full max-w-sm">
                <div className="flex items-center space-x-3">
                    <div className={cn(
                        "bg-muted rounded-full animate-pulse",
                        sizeClasses[size]
                    )} />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                </div>
                {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-4/5 animate-pulse" />
                    </div>
                ))}
            </div>
        ),

        // Card skeleton
        card: () => (
            <div className="border rounded-lg p-4 w-full max-w-sm bg-card animate-scale-in">
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className={cn(
                            "bg-muted rounded-full animate-pulse",
                            sizeClasses[size]
                        )} />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded animate-pulse" />
                            <div className="h-2 bg-muted rounded w-3/4 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-32 bg-muted rounded animate-pulse relative overflow-hidden">
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-progress" />
                        </div>
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                </div>
            </div>
        ),

        // Minimalist spinner
        minimal: () => (
            <div className="flex items-center space-x-2">
                <Loader2 className={cn("text-cedo-blue animate-spin", sizeClasses[size])} />
                {message && (
                    <span className="text-sm text-muted-foreground">{currentMessage}</span>
                )}
            </div>
        ),

        // Success completion animation
        success: () => (
            <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                    <CheckCircle className={cn("text-green-500", sizeClasses[size])} />
                    <div className={cn(
                        "absolute inset-0 rounded-full border-2 border-green-500 opacity-20 animate-ping",
                        sizeClasses[size]
                    )} />
                </div>
                <p className="text-sm text-green-600 font-medium animate-fade-in">
                    {message || "Complete!"}
                </p>
            </div>
        )
    }

    return (
        <div className={cn("flex items-center justify-center", className)} {...props}>
            {variants[variant]?.() || variants.default()}
        </div>
    )
}

// Preset loading messages for different contexts
export const LoadingMessages = {
    dashboard: [
        "Preparing your dashboard...",
        "Loading analytics...",
        "Organizing data...",
        "Almost ready..."
    ],
    data: [
        "Fetching data...",
        "Processing information...",
        "Finalizing results...",
        "Ready!"
    ],
    upload: [
        "Uploading file...",
        "Processing upload...",
        "Verifying data...",
        "Upload complete!"
    ],
    save: [
        "Saving changes...",
        "Validating data...",
        "Updating records...",
        "Saved successfully!"
    ]
}

// Quick loader for inline use
export function QuickLoader({ className = "" }) {
    return (
        <Loader2 className={cn("h-4 w-4 animate-spin text-cedo-blue", className)} />
    )
}

// Full page loader
export function FullPageLoader({ message = "Loading..." }) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <EnhancedLoader
                variant="default"
                size="lg"
                message={message}
                className="bg-card p-8 rounded-lg shadow-lg border animate-scale-in"
            />
        </div>
    )
} 