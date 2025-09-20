// frontend/src/app/admin-dashboard/events/loading.jsx

import { Card, CardContent, CardHeader } from "@/components/dashboard/admin/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 -m-4 sm:-m-6 md:-m-8 lg:-m-10">
      {/* Enhanced Page Header Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-8 sm:h-10 lg:h-12 w-64 sm:w-80 lg:w-96" />
              <Skeleton className="h-4 sm:h-5 lg:h-6 w-80 sm:w-96 lg:w-[500px]" />
            </div>
            <Skeleton className="h-12 sm:h-14 w-24 sm:w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
          {/* Left column skeleton */}
          <div className="xl:col-span-1 space-y-6">
            {/* View Mode Controls Skeleton */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                <Skeleton className="h-6 sm:h-7 w-32" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-12 sm:h-14 w-full rounded-xl" />
                  <Skeleton className="h-12 sm:h-14 w-full rounded-xl" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Skeleton */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-gradient-to-br from-cedo-blue/5 to-cedo-blue/10 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <Skeleton className="h-6 sm:h-7 w-24" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-200/60">
                    <Skeleton className="h-8 sm:h-10 w-8 mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-200/60">
                    <Skeleton className="h-8 sm:h-10 w-6 mx-auto mb-2" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                  </div>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-200/60">
                  <Skeleton className="h-8 sm:h-10 w-12 mx-auto mb-2" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column skeleton */}
          <div className="xl:col-span-3 space-y-6">
            {/* Filter Controls Skeleton */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                <Skeleton className="h-6 sm:h-7 w-32" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Tabs Skeleton */}
                  <div className="grid grid-cols-3 gap-2 bg-white/50 backdrop-blur-sm border border-gray-200/60 shadow-sm rounded-xl p-1">
                    <Skeleton className="h-12 sm:h-14 w-full rounded-lg" />
                    <Skeleton className="h-12 sm:h-14 w-full rounded-lg" />
                    <Skeleton className="h-12 sm:h-14 w-full rounded-lg" />
                  </div>

                  {/* Search and Filter Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="sm:col-span-2 lg:col-span-2">
                      <Skeleton className="h-12 sm:h-14 w-full rounded-xl" />
                    </div>
                    <div className="sm:col-span-1 lg:col-span-1">
                      <Skeleton className="h-12 sm:h-14 w-full rounded-xl" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Events Display Skeleton */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
              <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 sm:h-7 lg:h-8 w-32 sm:w-40" />
                    <Skeleton className="h-4 sm:h-5 w-48 sm:w-56" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
                  {/* Calendar/List View Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="border border-gray-200/60 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm p-4 sm:p-6">
                        <div className="space-y-3">
                          <Skeleton className="h-4 sm:h-5 w-3/4" />
                          <Skeleton className="h-3 sm:h-4 w-full" />
                          <Skeleton className="h-3 sm:h-4 w-2/3" />
                          <div className="flex items-center gap-2 pt-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
