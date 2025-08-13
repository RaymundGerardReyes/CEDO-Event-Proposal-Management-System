"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Circle } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Enhanced Multi-Step Progress Bar Component
 * Based on modern web practices and accessibility standards
 */
export const EnhancedProgressBar = ({
    steps,
    currentStepIndex,
    className = "",
    showProgressPercentage = true,
    showStepNumbers = true,
    animated = true,
}) => {
    const [progressWidth, setProgressWidth] = useState(0);

    // Calculate progress percentage
    const progressPercentage = Math.max(0, Math.min(100, (currentStepIndex / (steps.length - 1)) * 100));

    // Animate progress bar
    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => {
                setProgressWidth(progressPercentage);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setProgressWidth(progressPercentage);
        }
    }, [progressPercentage, animated]);

    return (
        <div className={cn("w-full", className)}>
            {/* Progress Bar Container */}
            <div className="relative mb-8">
                {/* Background Progress Bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cedo-blue to-cedo-gold transition-all duration-700 ease-out"
                        style={{ width: `${progressWidth}%` }}
                    />
                </div>

                {/* Progress Percentage Display */}
                {showProgressPercentage && (
                    <div className="absolute -top-8 right-0">
                        <span className="text-sm font-semibold text-cedo-blue bg-white px-2 py-1 rounded-md shadow-sm">
                            {Math.round(progressPercentage)}% Complete
                        </span>
                    </div>
                )}
            </div>

            {/* Steps Indicator */}
            <div className="relative">
                <nav aria-label="Progress" className="w-full">
                    <ol role="list" className="flex items-center justify-between w-full">
                        {steps.map((step, stepIdx) => {
                            const isActive = stepIdx === currentStepIndex;
                            const isCompleted = stepIdx < currentStepIndex;
                            const isUpcoming = stepIdx > currentStepIndex;
                            const isError = step.error;

                            return (
                                <li
                                    key={step.name}
                                    className="relative flex flex-col items-center flex-1"
                                >
                                    {/* Connecting Line */}
                                    {stepIdx !== steps.length - 1 && (
                                        <div
                                            className="absolute top-5 left-1/2 w-full h-0.5 flex items-center"
                                            aria-hidden="true"
                                        >
                                            <div
                                                className={cn(
                                                    "h-0.5 w-full transition-all duration-500",
                                                    isCompleted
                                                        ? "bg-gradient-to-r from-cedo-blue to-cedo-gold"
                                                        : "bg-gray-200"
                                                )}
                                            />
                                        </div>
                                    )}

                                    {/* Step Circle */}
                                    <div
                                        className={cn(
                                            "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                                            {
                                                // Active state
                                                "border-cedo-blue bg-white shadow-lg ring-4 ring-cedo-blue/20": isActive,
                                                // Completed state
                                                "border-cedo-blue bg-gradient-to-r from-cedo-blue to-cedo-gold shadow-md": isCompleted,
                                                // Error state
                                                "border-red-500 bg-red-50": isError,
                                                // Upcoming state
                                                "border-gray-300 bg-white": isUpcoming && !isError,
                                            }
                                        )}
                                    >
                                        {/* Step Icon/Number */}
                                        {isCompleted ? (
                                            <CheckCircle className="h-6 w-6 text-white" aria-hidden="true" />
                                        ) : isError ? (
                                            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                {showStepNumbers ? (
                                                    <span
                                                        className={cn(
                                                            "text-sm font-semibold",
                                                            isActive ? "text-cedo-blue" : "text-gray-500"
                                                        )}
                                                    >
                                                        {stepIdx + 1}
                                                    </span>
                                                ) : (
                                                    <span className={cn(
                                                        "h-5 w-5",
                                                        isActive ? "text-cedo-blue" : "text-gray-400"
                                                    )}>
                                                        {step.icon || <Circle className="h-5 w-5" />}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Step Label */}
                                    <div className="mt-3 text-center max-w-[120px]">
                                        <span
                                            className={cn(
                                                "text-xs sm:text-sm font-medium block leading-tight transition-colors duration-200",
                                                {
                                                    "text-cedo-blue font-semibold": isActive,
                                                    "text-cedo-blue": isCompleted,
                                                    "text-red-500": isError,
                                                    "text-gray-500": isUpcoming && !isError,
                                                }
                                            )}
                                        >
                                            {step.name}
                                        </span>

                                        {/* Step Description */}
                                        {step.description && (
                                            <span
                                                className={cn(
                                                    "text-xs text-gray-400 mt-1 block leading-tight",
                                                    {
                                                        "text-cedo-blue/70": isActive,
                                                        "text-gray-400": !isActive,
                                                    }
                                                )}
                                            >
                                                {step.description}
                                            </span>
                                        )}

                                        {/* Error Message */}
                                        {isError && step.errorMessage && (
                                            <span className="text-xs text-red-500 mt-1 block leading-tight">
                                                {step.errorMessage}
                                            </span>
                                        )}
                                    </div>

                                    {/* Accessibility */}
                                    <span className="sr-only">
                                        {isCompleted
                                            ? `${step.name} completed`
                                            : isActive
                                                ? `${step.name} current step`
                                                : `${step.name} step ${stepIdx + 1} of ${steps.length}`
                                        }
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            {/* Progress Summary */}
            <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                    <span className="text-sm text-gray-600">
                        Step {currentStepIndex + 1} of {steps.length}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                        {steps[currentStepIndex]?.name}
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * Mobile-Optimized Progress Bar
 * Simplified version for smaller screens
 */
export const MobileProgressBar = ({
    steps,
    currentStepIndex,
    className = "",
}) => {
    const progressPercentage = Math.max(0, Math.min(100, (currentStepIndex / (steps.length - 1)) * 100));

    return (
        <div className={cn("w-full", className)}>
            {/* Compact Progress Bar */}
            <div className="relative mb-4">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cedo-blue to-cedo-gold transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Current Step Display */}
            <div className="text-center">
                <span className="text-sm font-medium text-cedo-blue">
                    {steps[currentStepIndex]?.name}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                    ({currentStepIndex + 1} of {steps.length})
                </span>
            </div>
        </div>
    );
};

/**
 * Compact Progress Dots
 * Minimal progress indicator for tight spaces
 */
export const ProgressDots = ({
    steps,
    currentStepIndex,
    className = "",
}) => {
    return (
        <div className={cn("flex items-center justify-center space-x-2", className)}>
            {steps.map((_, stepIdx) => {
                const isActive = stepIdx === currentStepIndex;
                const isCompleted = stepIdx < currentStepIndex;

                return (
                    <div
                        key={stepIdx}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            {
                                "bg-cedo-blue scale-125": isActive,
                                "bg-cedo-blue": isCompleted,
                                "bg-gray-300": !isActive && !isCompleted,
                            }
                        )}
                    />
                );
            })}
        </div>
    );
};

export default EnhancedProgressBar; 