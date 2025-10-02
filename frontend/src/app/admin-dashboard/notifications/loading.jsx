/**
 * Notifications Loading Page
 * Purpose: Show loading state while notifications page is loading
 * Key approaches: Consistent loading UI, responsive design
 */

export default function NotificationsLoading() {
    return (
        <div className="flex-1 bg-[#f8f9fa] min-h-screen" style={{ padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
            <div className="w-full max-w-full space-y-6">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                </div>

                {/* Card skeleton */}
                <div className="bg-white rounded-lg shadow-sm border-0 p-6">
                    {/* Header skeleton */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="flex space-x-2">
                            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Notification skeletons */}
                    <div className="space-y-3">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="p-4 rounded-lg border border-gray-200 animate-pulse">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="flex justify-between items-center">
                                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
