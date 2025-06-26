import SubmitEventFlow from "@/app/(main)/student-dashboard/submit-event/SubmitEventFlow"

export default function FormDebugPage() {
    return (
        <main className="flex w-full flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
            <div className="mb-8 text-center max-w-3xl">
                <h1 className="text-3xl font-bold text-red-600 mb-2">🔧 FORM DEBUG MODE (NO AUTH)</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    This is a test route that bypasses authentication. Use this to debug form issues.
                </p>
                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> This route should only be used for development debugging.
                        Access: <code>http://localhost:3000/form-debug</code>
                    </p>
                </div>
            </div>

            {/* Render the SubmitEventFlow component */}
            <div className="w-full max-w-4xl bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <SubmitEventFlow />
            </div>
        </main>
    )
} 