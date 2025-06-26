"use client"

import { Button } from "@/components/ui/button"
import { EnhancedLoader, FullPageLoader, LoadingMessages, QuickLoader } from "@/components/ui/enhanced-loader"
import { useState } from "react"

export default function LoadingExamples() {
    const [showFullPageLoader, setShowFullPageLoader] = useState(false)
    const [activeDemo, setActiveDemo] = useState("default")

    const variants = [
        { key: "default", name: "Default Spinner", description: "Classic loader with CEDO branding" },
        { key: "dots", name: "Bouncing Dots", description: "Three animated dots sequence" },
        { key: "progress", name: "Progress Bar", description: "Progress indicator with percentage" },
        { key: "pulse", name: "Pulse Animation", description: "Pulsing circle animation" },
        { key: "skeleton", name: "Skeleton Loader", description: "Content placeholder preview" },
        { key: "card", name: "Card Skeleton", description: "Detailed card content preview" },
        { key: "minimal", name: "Minimal", description: "Simple inline spinner" },
        { key: "success", name: "Success State", description: "Completion animation" },
    ]

    const sizes = ["sm", "md", "lg", "xl"]

    return (
        <div className="container mx-auto p-8 space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cedo-blue to-cedo-gold bg-clip-text text-transparent">
                    Enhanced Loading Components
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Modern, engaging loading states that leverage your custom Tailwind animations and CEDO brand colors.
                    Based on the latest UX research and best practices from industry leaders.
                </p>
            </div>

            {/* Quick Demo Controls */}
            <div className="bg-card border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                    {variants.map((variant) => (
                        <Button
                            key={variant.key}
                            variant={activeDemo === variant.key ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveDemo(variant.key)}
                            className="text-xs"
                        >
                            {variant.name}
                        </Button>
                    ))}
                </div>

                <div className="bg-muted/30 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
                    <EnhancedLoader
                        variant={activeDemo}
                        size="lg"
                        message={`Loading with ${variants.find(v => v.key === activeDemo)?.name}...`}
                        showProgress={activeDemo === "progress"}
                    />
                </div>

                <p className="text-sm text-muted-foreground mt-4 text-center">
                    {variants.find(v => v.key === activeDemo)?.description}
                </p>
            </div>

            {/* All Variants Showcase */}
            <div className="space-y-8">
                <h2 className="text-3xl font-semibold text-center">All Loading Variants</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {variants.map((variant) => (
                        <div key={variant.key} className="bg-card border rounded-lg p-6 text-center space-y-4">
                            <h3 className="text-lg font-semibold">{variant.name}</h3>
                            <div className="bg-muted/30 rounded-lg p-6 min-h-[120px] flex items-center justify-center">
                                <EnhancedLoader
                                    variant={variant.key}
                                    size="md"
                                    message={variant.key === "success" ? "Complete!" : "Loading..."}
                                    showProgress={variant.key === "progress"}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">{variant.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Size Variations */}
            <div className="space-y-6">
                <h2 className="text-3xl font-semibold text-center">Size Variations</h2>

                <div className="bg-card border rounded-lg p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {sizes.map((size) => (
                            <div key={size} className="text-center space-y-4">
                                <h3 className="text-sm font-medium uppercase">{size}</h3>
                                <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] flex items-center justify-center">
                                    <EnhancedLoader
                                        variant="default"
                                        size={size}
                                        message=""
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Usage Examples */}
            <div className="space-y-6">
                <h2 className="text-3xl font-semibold text-center">Usage Examples</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dashboard Loading */}
                    <div className="bg-card border rounded-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Dashboard Loading</h3>
                        <div className="bg-muted/30 rounded-lg p-4">
                            <EnhancedLoader
                                variant="skeleton"
                                size="md"
                                message="Loading dashboard data..."
                            />
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {`<EnhancedLoader 
  variant="skeleton"
  size="md"
  message="Loading dashboard data..."
/>`}
                        </pre>
                    </div>

                    {/* Form Saving */}
                    <div className="bg-card border rounded-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Form Saving</h3>
                        <div className="bg-muted/30 rounded-lg p-4">
                            <EnhancedLoader
                                variant="progress"
                                size="md"
                                message="Saving your changes..."
                                showProgress={true}
                            />
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {`<EnhancedLoader 
  variant="progress"
  size="md"
  message="Saving your changes..."
  showProgress={true}
/>`}
                        </pre>
                    </div>

                    {/* Inline Loading */}
                    <div className="bg-card border rounded-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Inline Loading</h3>
                        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
                            <span>Processing request...</span>
                            <QuickLoader />
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {`<QuickLoader />`}
                        </pre>
                    </div>

                    {/* Success State */}
                    <div className="bg-card border rounded-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Success Confirmation</h3>
                        <div className="bg-muted/30 rounded-lg p-4">
                            <EnhancedLoader
                                variant="success"
                                size="md"
                                message="Data saved successfully!"
                            />
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {`<EnhancedLoader 
  variant="success"
  size="md"
  message="Data saved successfully!"
/>`}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Full Page Loader Demo */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-2xl font-semibold">Full Page Loader</h2>
                <p className="text-muted-foreground">
                    For blocking operations that require the user's full attention.
                </p>

                <div className="flex gap-4 flex-wrap">
                    <Button
                        onClick={() => {
                            setShowFullPageLoader(true)
                            setTimeout(() => setShowFullPageLoader(false), 3000)
                        }}
                    >
                        Show Full Page Loader (3s)
                    </Button>
                </div>

                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {`<FullPageLoader message="Processing..." />`}
                </pre>
            </div>

            {/* Loading Messages */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-2xl font-semibold">Contextual Loading Messages</h2>
                <p className="text-muted-foreground">
                    Pre-defined message sets for different contexts to maintain consistency.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(LoadingMessages).map(([key, messages]) => (
                        <div key={key} className="bg-muted/30 rounded-lg p-4">
                            <h3 className="font-medium capitalize mb-2">{key} Messages:</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                {messages.map((message, index) => (
                                    <li key={index}>• {message}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Notes */}
            <div className="bg-gradient-to-r from-cedo-blue/5 to-cedo-gold/5 border border-cedo-blue/20 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-cedo-blue">Performance & UX Notes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                        <h3 className="font-semibold mb-2">✨ Best Practices Used:</h3>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>• Progressive loading with skeleton screens</li>
                            <li>• Realistic progress animations</li>
                            <li>• Brand-consistent color usage</li>
                            <li>• Accessibility-friendly animations</li>
                            <li>• Mobile-responsive sizing</li>
                            <li>• Contextual messaging</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">🚀 Performance Features:</h3>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>• CSS-only animations (GPU accelerated)</li>
                            <li>• Minimal JavaScript overhead</li>
                            <li>• Configurable animation durations</li>
                            <li>• Lazy loading support</li>
                            <li>• Memory-efficient cleanup</li>
                            <li>• Reduced layout shifts</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Full Page Loader Component */}
            {showFullPageLoader && (
                <FullPageLoader message="Processing your request..." />
            )}
        </div>
    )
} 