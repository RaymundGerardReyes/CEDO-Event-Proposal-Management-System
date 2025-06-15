// frontend/src/app/(main)/student-dashboard/profile/loading.jsx

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="z-10 w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded mb-6"></div>
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-6">
            <div className="h-4 w-1/4 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/4 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/4 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="flex justify-end">
              <div className="h-10 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
