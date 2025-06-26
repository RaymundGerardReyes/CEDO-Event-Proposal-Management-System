// frontend/src/app/(main)/admin-dashboard/loading.jsx

"use client"

import { BarChart3, FileText, Loader2, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"

// Main enhanced loading component with multiple variations
export default function Loading() {
  const [loadingText, setLoadingText] = useState("Preparing your dashboard...")
  const [progress, setProgress] = useState(0)
  const [showSkeletons, setShowSkeletons] = useState(false)

  // Simulate realistic loading progression with branded messages
  useEffect(() => {
    const messages = [
      "Preparing your dashboard...",
      "Loading your data...",
      "Organizing insights...",
      "Almost ready..."
    ]

    const intervals = [0, 1000, 2000, 3000]
    const progressSteps = [0, 30, 70, 100]

    intervals.forEach((delay, index) => {
      setTimeout(() => {
        setLoadingText(messages[index])
        setProgress(progressSteps[index])

        // Show skeleton after first step
        if (index === 1) {
          setShowSkeletons(true)
        }
      }, delay)
    })
  }, [])

  return (
    <div className="min-h-[400px] w-full bg-background">
      {/* Hero Loading Section with Brand Colors */}
      <div className="flex flex-col items-center justify-center p-8 space-y-6">

        {/* CEDO Branded Loading Animation */}
        <div className="relative">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-cedo-blue animate-spin" />
              <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-cedo-gold opacity-20 animate-ping" />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-cedo-blue to-cedo-gold bg-clip-text text-transparent">
              CEDO
            </div>
          </div>
        </div>

        {/* Dynamic Loading Message */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground/90 animate-fade-in">
            {loadingText}
          </p>

          {/* Enhanced Progress Bar */}
          <div className="w-64 mx-auto">
            <div className="bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cedo-blue to-cedo-gold rounded-full transition-all duration-500 ease-out animate-progress"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {progress}% complete
            </p>
          </div>
        </div>

        {/* Interactive Loading Dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-3 h-3 bg-cedo-blue rounded-full animate-bounce"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: '1.4s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Skeleton Content Preview */}
      {showSkeletons && (
        <div className="animate-slide-up space-y-6 px-8">

          {/* Dashboard Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, label: "Analytics" },
              { icon: Users, label: "Users" },
              { icon: FileText, label: "Reports" },
              { icon: TrendingUp, label: "Growth" }
            ].map((item, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-card animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cedo-blue/10 rounded-lg">
                    <item.icon className="h-4 w-4 text-cedo-blue animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className="border rounded-lg p-6 bg-card animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
              <div className="h-48 bg-muted rounded animate-pulse relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="border rounded-lg bg-card animate-scale-in" style={{ animationDelay: '0.6s' }}>
            <div className="p-4 border-b">
              <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
            </div>
            <div className="divide-y">
              {[1, 2, 3].map((row) => (
                <div key={row} className="p-4 flex items-center space-x-4">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Encouraging Footer Message */}
      <div className="text-center mt-8 px-8">
        <p className="text-sm text-muted-foreground animate-fade-in">
          💡 <strong>Pro tip:</strong> Your dashboard loads faster with a stable internet connection
        </p>
      </div>
    </div>
  )
}
