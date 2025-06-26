'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { CheckCircle2, Clock, Database, FileText, Loader2 } from "lucide-react"
import { useEffect, useState } from 'react'

import Progress from "@/components/dashboard/student/ui/progress"

export default function EnhancedLoadingPage({
    message = "Loading reporting section...",
    showProgress = true,
    estimatedTime = 15000 // 15 seconds based on your logs
}) {
    const [progress, setProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState(0)
    const [elapsedTime, setElapsedTime] = useState(0)

    const steps = [
        {
            id: 0,
            label: "Initializing",
            description: "Starting up the reporting system...",
            icon: Loader2,
            duration: 2000
        },
        {
            id: 1,
            label: "Compiling Components",
            description: "Building the reporting interface...",
            icon: FileText,
            duration: 8000
        },
        {
            id: 2,
            label: "Loading Proposal Data",
            description: "Fetching your proposal information...",
            icon: Database,
            duration: 3000
        },
        {
            id: 3,
            label: "Preparing Interface",
            description: "Setting up the reporting form...",
            icon: CheckCircle2,
            duration: 2000
        }
    ]

    useEffect(() => {
        if (!showProgress) return

        const startTime = Date.now()
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime
            setElapsedTime(elapsed)

            // Calculate progress based on elapsed time
            const progressPercent = Math.min((elapsed / estimatedTime) * 100, 95)
            setProgress(progressPercent)

            // Update current step based on elapsed time
            let stepIndex = 0
            let cumulativeTime = 0

            for (let i = 0; i < steps.length; i++) {
                cumulativeTime += steps[i].duration
                if (elapsed < cumulativeTime) {
                    stepIndex = i
                    break
                }
                stepIndex = i + 1
            }

            setCurrentStep(Math.min(stepIndex, steps.length - 1))

        }, 100)

        return () => clearInterval(interval)
    }, [showProgress, estimatedTime])

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000)
        return `${seconds}s`
    }

    const currentStepData = steps[currentStep]
    const CurrentIcon = currentStepData?.icon || Loader2

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <CurrentIcon className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                        {message}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Please wait while we prepare your reporting section
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {showProgress && (
                        <>
                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="w-full" />
                            </div>

                            {/* Current Step */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <CurrentIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {currentStepData?.label}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {currentStepData?.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Steps List */}
                            <div className="space-y-2">
                                {steps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={`flex items-center gap-3 p-2 rounded-md transition-colors ${index < currentStep
                                            ? 'bg-green-50 text-green-800'
                                            : index === currentStep
                                                ? 'bg-blue-50 text-blue-800'
                                                : 'bg-gray-50 text-gray-500'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${index < currentStep
                                            ? 'bg-green-200'
                                            : index === currentStep
                                                ? 'bg-blue-200'
                                                : 'bg-gray-200'
                                            }`}>
                                            {index < currentStep ? (
                                                <CheckCircle2 className="h-3 w-3" />
                                            ) : index === currentStep ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Clock className="h-3 w-3" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium">
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Time Information */}
                            <div className="flex justify-between text-xs text-gray-500 pt-4 border-t">
                                <span>Elapsed: {formatTime(elapsedTime)}</span>
                                <span>Est. Total: {formatTime(estimatedTime)}</span>
                            </div>
                        </>
                    )}

                    {/* Simple loading without progress */}
                    {!showProgress && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    )}

                    {/* Helpful tip */}
                    <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-xs text-blue-700">
                            💡 <strong>Tip:</strong> The reporting section is being compiled for the first time.
                            Subsequent visits will be much faster!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 