// frontend/src/app/(main)/admin-dashboard/reports/loading.jsx

export default function Loading() {
  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <div className="mb-8 animate-pulse">
        <div className="h-8 w-1/4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-2/5 bg-gray-200 rounded"></div>
      </div>

      <div className="mb-6 animate-pulse">
        <div className="h-32 bg-white rounded-lg border border-gray-200 shadow-sm"></div>
      </div>

      <div className="animate-pulse">
        <div className="h-[600px] bg-white rounded-lg border border-gray-200 shadow-sm"></div>
      </div>
    </div>
  )
}
