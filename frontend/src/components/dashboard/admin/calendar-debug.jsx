// frontend/src/components/dashboard/admin/calendar-debug.jsx

"use client"

import { useState } from "react"

export function CalendarDebug({ currentView, currentDate, onViewChange, onNavigate }) {
    const [debugInfo, setDebugInfo] = useState({
        view: currentView,
        date: currentDate,
        clicks: 0
    })

    const handleViewClick = (view) => {
        setDebugInfo(prev => ({
            ...prev,
            view,
            clicks: prev.clicks + 1
        }))
        onViewChange(view)
    }

    const handleNavigateClick = (action) => {
        setDebugInfo(prev => ({
            ...prev,
            clicks: prev.clicks + 1
        }))
        onNavigate(action)
    }

    return (
        <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-xs">
            <h3 className="font-bold text-sm mb-2">Calendar Debug</h3>
            <div className="text-xs space-y-1">
                <div>Current View: <span className="font-mono">{debugInfo.view}</span></div>
                <div>Current Date: <span className="font-mono">{debugInfo.date.toLocaleDateString()}</span></div>
                <div>Total Clicks: <span className="font-mono">{debugInfo.clicks}</span></div>
            </div>
            <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                    <button
                        onClick={() => handleViewClick('month')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                        Month
                    </button>
                    <button
                        onClick={() => handleViewClick('week')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                        Week
                    </button>
                    <button
                        onClick={() => handleViewClick('day')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                        Day
                    </button>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => handleNavigateClick('PREV')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => handleNavigateClick('TODAY')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => handleNavigateClick('NEXT')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
