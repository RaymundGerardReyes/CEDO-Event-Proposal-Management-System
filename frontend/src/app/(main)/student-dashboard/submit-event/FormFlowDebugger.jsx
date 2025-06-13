"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCallback, useEffect, useRef, useState } from "react"

export const FormFlowDebugger = ({ formData, currentState, isVisible = true, stateRestorationInProgress = false }) => {
    const [logs, setLogs] = useState([])
    const [autoScroll, setAutoScroll] = useState(true)
    const consoleOverrideSetup = useRef(false)
    const logQueueRef = useRef([])
    const processingRef = useRef(false)

    // 🔧 CRITICAL FIX: Debounced log processing to prevent infinite loops
    const processLogQueue = useCallback(() => {
        if (processingRef.current || logQueueRef.current.length === 0) return

        processingRef.current = true
        const logsToProcess = [...logQueueRef.current]
        logQueueRef.current = []

        setTimeout(() => {
            setLogs(prev => {
                const newLogs = [...prev, ...logsToProcess].slice(-50) // Keep last 50 logs
                processingRef.current = false

                // Process any queued logs that accumulated during this update
                setTimeout(() => {
                    if (logQueueRef.current.length > 0) {
                        processLogQueue()
                    }
                }, 10)

                return newLogs
            })
        }, 0)
    }, [])

    // 🔧 CRITICAL FIX: Only set up console overrides once to prevent infinite loops
    useEffect(() => {
        if (typeof window === "undefined" || consoleOverrideSetup.current) return

        consoleOverrideSetup.current = true
        const originalLog = console.log
        const originalError = console.error
        const originalWarn = console.warn

        const captureLog = (level, args) => {
            const message = args.join(' ')

            // Only capture logs related to form flow and avoid self-referential logs
            if (!message.includes('FormFlowDebugger') &&
                (message.includes('ROUTING') ||
                    message.includes('Section') ||
                    message.includes('organizationType') ||
                    message.includes('CONDITIONAL') ||
                    message.includes('handleSection2Next'))) {

                const timestamp = new Date().toLocaleTimeString()
                const logEntry = {
                    id: Date.now() + Math.random(),
                    timestamp,
                    level,
                    message
                }

                // 🔧 CRITICAL FIX: Queue logs instead of immediate state update
                logQueueRef.current.push(logEntry)

                // Process queue with debouncing
                if (!processingRef.current) {
                    processLogQueue()
                }
            }
        }

        console.log = (...args) => {
            captureLog('log', args)
            originalLog.apply(console, args)
        }

        console.error = (...args) => {
            captureLog('error', args)
            originalError.apply(console, args)
        }

        console.warn = (...args) => {
            captureLog('warn', args)
            originalWarn.apply(console, args)
        }

        return () => {
            console.log = originalLog
            console.error = originalError
            console.warn = originalWarn
            consoleOverrideSetup.current = false
        }
    }, [processLogQueue])

    if (!isVisible) return null

    const getRoutePreview = () => {
        const orgType = formData?.organizationType || formData?.eventType || formData?.organizationTypes?.[0]

        if (!orgType) {
            return { route: "❌ No Route", color: "bg-red-100 text-red-800" }
        }

        if (orgType === 'school-based' || orgType === 'school') {
            return { route: "✅ → Section 3 (School Event)", color: "bg-green-100 text-green-800" }
        }

        if (orgType === 'community-based' || orgType === 'community') {
            return { route: "✅ → Section 4 (Community Event)", color: "bg-blue-100 text-blue-800" }
        }

        return { route: "⚠️ Unknown Route", color: "bg-yellow-100 text-yellow-800" }
    }

    const clearLogs = () => setLogs([])

    const routePreview = getRoutePreview()

    return (
        <Card className="w-full mt-4 border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                    🔍 Form Flow Debugger
                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                            State: {currentState}
                        </Badge>
                        {stateRestorationInProgress && (
                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 animate-pulse">
                                🔄 Restoring...
                            </Badge>
                        )}
                        <Badge className={routePreview.color}>
                            {routePreview.route}
                        </Badge>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Form Data Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded">
                        <h4 className="font-semibold mb-2">Organization Type Detection</h4>
                        <div className="space-y-1">
                            <div>organizationType: <code className="bg-gray-100 px-1 rounded">{formData?.organizationType || 'null'}</code></div>
                            <div>eventType: <code className="bg-gray-100 px-1 rounded">{formData?.eventType || 'null'}</code></div>
                            <div>organizationTypes[0]: <code className="bg-gray-100 px-1 rounded">{formData?.organizationTypes?.[0] || 'null'}</code></div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded">
                        <h4 className="font-semibold mb-2">Contact Information</h4>
                        <div className="space-y-1">
                            <div>Organization: <code className="bg-gray-100 px-1 rounded">{formData?.organizationName || 'null'}</code></div>
                            <div>Contact: <code className="bg-gray-100 px-1 rounded">{formData?.contactName || 'null'}</code></div>
                            <div>Email: <code className="bg-gray-100 px-1 rounded">{formData?.contactEmail || 'null'}</code></div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded">
                        <h4 className="font-semibold mb-2">Flow Status</h4>
                        <div className="space-y-1">
                            <div>Current Section: <code className="bg-gray-100 px-1 rounded">{formData?.currentSection || 'null'}</code></div>
                            <div>Proposal Status: <code className="bg-gray-100 px-1 rounded">{formData?.proposalStatus || 'null'}</code></div>
                            <div>State Machine: <code className="bg-gray-100 px-1 rounded">{currentState}</code></div>
                        </div>
                    </div>
                </div>

                {/* Live Console Logs */}
                <div className="bg-white rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Live Console Logs (Flow Related)</h4>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAutoScroll(!autoScroll)}
                                className="text-xs"
                            >
                                Auto Scroll: {autoScroll ? 'ON' : 'OFF'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={clearLogs} className="text-xs">
                                Clear Logs
                            </Button>
                        </div>
                    </div>

                    <div
                        className="max-h-60 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded text-xs font-mono"
                        ref={el => autoScroll && el?.scrollTo(0, el.scrollHeight)}
                    >
                        {logs.length === 0 ? (
                            <div className="text-gray-500">No flow-related logs yet...</div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className={`mb-1 ${log.level === 'error' ? 'text-red-400' :
                                    log.level === 'warn' ? 'text-yellow-400' :
                                        'text-green-400'
                                    }`}>
                                    <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Manual Testing Buttons */}
                <div className="bg-white rounded p-3">
                    <h4 className="font-semibold mb-2">Manual Tests</h4>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                console.log('🧪 MANUAL TEST: Current Form Data')
                                console.log('organizationType:', formData?.organizationType)
                                console.log('eventType:', formData?.eventType)
                                console.log('organizationTypes:', formData?.organizationTypes)
                                console.log('Full formData:', formData)
                            }}
                        >
                            Log Form Data
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                console.log('🧪 MANUAL TEST: Local Storage Check')
                                const keys = Object.keys(localStorage).filter(key =>
                                    key.includes('cedo') || key.includes('form') || key.includes('event')
                                )
                                keys.forEach(key => {
                                    console.log(`${key}:`, localStorage.getItem(key))
                                })
                            }}
                        >
                            Check Storage
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                console.log('🧪 MANUAL TEST: Simulating Section2 -> Section3 Navigation')
                                console.log('Would route to:', routePreview.route)
                                console.log('Organization type used:', formData?.organizationType || formData?.eventType)
                            }}
                        >
                            Test Navigation
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 