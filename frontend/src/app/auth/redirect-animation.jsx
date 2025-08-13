"use client"

import Logo from "@/components/logo"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

const RedirectAnimation = ({
    message = "Redirecting you to your dashboard",
    className,
    // Add speed configuration options with defaults
    speedFactor = 1, // Overall speed multiplier
    progressDuration = 2.5, // Time in seconds for progress bar to complete
    initialDelay = 0.3, // Delay before starting progress animation
    transitionDelay = 0.4, // Delay between progress completion and final animation
}) => {
    const [progress, setProgress] = useState(0)
    const [showFinalAnimation, setShowFinalAnimation] = useState(false)
    const [animationStarted, setAnimationStarted] = useState(false)

    useEffect(() => {
        // Initial delay before starting the progress animation
        const startTimer = setTimeout(
            () => {
                setAnimationStarted(true)
            },
            (initialDelay * 1000) / speedFactor,
        )

        return () => clearTimeout(startTimer)
    }, [initialDelay, speedFactor])

    useEffect(() => {
        if (!animationStarted) return

        // Calculate increment and interval based on desired duration
        const totalSteps = 100
        const intervalTime = (progressDuration * 1000) / totalSteps / speedFactor
        const increment = 1

        // Simulate progress for the animation
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(() => setShowFinalAnimation(true), (transitionDelay * 1000) / speedFactor)
                    return 100
                }
                return Math.min(prev + increment, 100)
            })
        }, intervalTime)

        return () => clearInterval(interval)
    }, [animationStarted, progressDuration, speedFactor, transitionDelay])

    return (
        <div
            className={cn(
                "fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50",
                className,
            )}
        >
            <AnimatePresence mode="wait">
                {!showFinalAnimation ? (
                    <motion.div
                        key="loading"
                        className="flex flex-col items-center justify-center p-6 max-w-md text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 / speedFactor }}
                    >
                        <div className="mb-6 relative">
                            <Logo className="w-16 h-16" />
                            <motion.div
                                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full"
                                initial={{ opacity: 0.7, scale: 0.8 }}
                                animate={{
                                    opacity: [0.5, 0.8, 0.5],
                                    scale: [0.8, 1.1, 0.8],
                                }}
                                transition={{
                                    repeat: Number.POSITIVE_INFINITY,
                                    duration: 1.5 / speedFactor,
                                    ease: "easeInOut",
                                }}
                            >
                                <div className="w-full h-full bg-cedo-blue/20 dark:bg-blue-500/20 rounded-full blur-xl" />
                            </motion.div>
                        </div>

                        <h3 className="text-xl font-semibold text-foreground mb-2">{message}</h3>

                        <p className="text-sm text-muted-foreground mb-6">
                            {progress < 20
                                ? "Preparing your experience..."
                                : progress < 50
                                    ? "Verifying credentials..."
                                    : progress < 80
                                        ? "Loading your dashboard..."
                                        : "Almost there..."}
                        </p>

                        <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
                            <motion.div
                                className="h-full bg-cedo-blue dark:bg-blue-500 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${progress}%` }}
                                transition={{
                                    ease: [0.4, 0.0, 0.2, 1], // Custom easing for smoother progress
                                    duration: 0.3 / speedFactor,
                                }}
                            />
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">{progress}%</div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        className="flex flex-col items-center justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 / speedFactor, ease: "easeOut" }}
                    >
                        <motion.div
                            className="relative"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{
                                duration: 0.6 / speedFactor,
                                ease: [0.175, 0.885, 0.32, 1.275], // Custom spring-like easing
                            }}
                        >
                            <Logo className="w-20 h-20" />
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-cedo-blue dark:border-blue-500"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0.8, 0], scale: [0.8, 1.5] }}
                                transition={{
                                    duration: 1.2 / speedFactor,
                                    ease: "easeOut",
                                    repeat: Number.POSITIVE_INFINITY,
                                    repeatDelay: 0.2 / speedFactor,
                                }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-cedo-blue/60 dark:border-blue-500/60"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0.6, 0], scale: [0.9, 1.7] }}
                                transition={{
                                    duration: 1.2 / speedFactor,
                                    ease: "easeOut",
                                    repeat: Number.POSITIVE_INFINITY,
                                    repeatDelay: 0.2 / speedFactor,
                                    delay: 0.3 / speedFactor,
                                }}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 / speedFactor, duration: 0.4 / speedFactor }}
                            className="mt-6 text-center"
                        >
                            <h3 className="text-xl font-semibold text-foreground">Welcome back!</h3>
                            <p className="text-sm text-muted-foreground mt-2">Taking you to your dashboard...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default RedirectAnimation
