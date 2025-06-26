'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import Progress from "@/components/dashboard/student/ui/progress";
import { CheckCircle2, Clock, Database, FileText } from "lucide-react";
import { useEffect, useState } from 'react';

/**
 * Optimized loading component for the reporting section
 * Provides better UX during Next.js 13+ App Router compilation
 */
export default function ReportingLoading() {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    const steps = [
        { label: 'Initializing', icon: Clock, duration: 2000 },
        { label: 'Loading Components', icon: FileText, duration: 3000 },
        { label: 'Fetching Proposal Data', icon: Database, duration: 4000 },
        { label: 'Preparing Interface', icon: CheckCircle2, duration: 1000 }
    ];

    useEffect(() => {
        const startTime = Date.now();
        let timeInterval;
        let stepTimeout;

        // Update elapsed time
        timeInterval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        // Progress through steps
        const progressStep = (stepIndex) => {
            if (stepIndex >= steps.length) return;

            setCurrentStep(stepIndex);

            // Simulate step progress
            const stepDuration = steps[stepIndex].duration;
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    const stepProgress = (stepIndex / steps.length) * 100;
                    const withinStepProgress = Math.min(20, Math.random() * 10);
                    return Math.min(95, stepProgress + withinStepProgress);
                });
            }, 200);

            stepTimeout = setTimeout(() => {
                clearInterval(progressInterval);
                progressStep(stepIndex + 1);
            }, stepDuration);
        };

        progressStep(0);

        return () => {
            clearInterval(timeInterval);
            clearTimeout(stepTimeout);
        };
    }, []);

    const estimatedTotal = elapsedTime > 10 ? Math.max(elapsedTime + 5, 15) : 10;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-semibold text-gray-800">
                        Initializing Reporting Section...
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                        Please wait while we prepare your reporting section
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Progress</span>
                            <span className="text-blue-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Current Step */}
                    <div className="space-y-3">
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;

                            return (
                                <div
                                    key={step.label}
                                    className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-blue-50 border border-blue-200' :
                                        isCompleted ? 'bg-green-50' : 'bg-gray-50'
                                        }`}
                                >
                                    <StepIcon
                                        className={`w-5 h-5 ${isActive ? 'text-blue-600 animate-pulse' :
                                            isCompleted ? 'text-green-600' : 'text-gray-400'
                                            }`}
                                    />
                                    <span className={`text-sm font-medium ${isActive ? 'text-blue-800' :
                                        isCompleted ? 'text-green-800' : 'text-gray-600'
                                        }`}>
                                        {step.label}
                                        {isActive && <span className="ml-2 text-blue-600">...</span>}
                                        {isCompleted && <span className="ml-2">✓</span>}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Time Information */}
                    <div className="text-center space-y-1 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Elapsed:</span> {elapsedTime}s
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Est. Total:</span> {estimatedTotal}s
                        </div>
                    </div>

                    {/* Helpful Tip */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                            <div className="text-yellow-600 mt-0.5">💡</div>
                            <div className="text-sm text-yellow-800">
                                <strong>Tip:</strong> The reporting section is being compiled for the first time.
                                Subsequent visits will be much faster!
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 