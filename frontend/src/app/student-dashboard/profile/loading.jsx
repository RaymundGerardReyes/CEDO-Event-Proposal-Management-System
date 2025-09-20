// frontend/src/app/student-dashboard/profile/loading.jsx

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-300 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview Card Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-6">
                <div className="h-6 w-32 bg-gray-300 rounded"></div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-20 w-20 bg-gray-300 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-gray-300 rounded"></div>
                    <div className="flex gap-2 justify-center">
                      <div className="h-6 w-16 bg-gray-300 rounded"></div>
                      <div className="h-6 w-12 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-6">
                <div className="space-y-2">
                  <div className="h-6 w-40 bg-gray-300 rounded"></div>
                  <div className="h-4 w-48 bg-gray-300 rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                    <div className="h-10 w-full bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                    <div className="h-10 w-full bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Card Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-6">
                <div className="space-y-2">
                  <div className="h-6 w-40 bg-gray-300 rounded"></div>
                  <div className="h-4 w-48 bg-gray-300 rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-300 rounded"></div>
                    <div className="h-24 w-full bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                    <div className="h-10 w-full bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
