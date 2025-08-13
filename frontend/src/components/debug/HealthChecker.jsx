"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export default function HealthChecker() {
    const [isChecking, setIsChecking] = useState(false)
    const [healthStatus, setHealthStatus] = useState(null)
    const [error, setError] = useState(null)

    const checkHealth = async () => {
        setIsChecking(true)
        setError(null)
        setHealthStatus(null)

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

        try {
            console.log('🔍 Client-side health check starting...')

            const response = await fetch(`${backendUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                cache: 'no-cache'
            })

            console.log(`📡 Health check response: ${response.status} ${response.statusText}`)

            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            setHealthStatus(data)
            console.log('✅ Health check successful:', data)

        } catch (err) {
            console.error('❌ Health check failed:', err)
            setError({
                message: err.message,
                name: err.name,
                type: err.constructor.name
            })
        } finally {
            setIsChecking(false)
        }
    }

    const getStatusBadge = (status) => {
        if (status === 'healthy') return <Badge className="bg-green-500">Healthy</Badge>
        if (status === 'unhealthy') return <Badge variant="destructive">Unhealthy</Badge>
        return <Badge variant="secondary">Unknown</Badge>
    }

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Backend Health Checker</CardTitle>
                <CardDescription>
                    Test the connection between frontend and backend
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={checkHealth}
                    disabled={isChecking}
                    className="w-full"
                >
                    {isChecking ? '🔄 Checking...' : '🔍 Check Backend Health'}
                </Button>

                {error && (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <h3 className="font-semibold text-red-800 mb-2">❌ Health Check Failed</h3>
                        <p className="text-red-700 text-sm mb-2"><strong>Error:</strong> {error.message}</p>
                        <p className="text-red-600 text-xs"><strong>Type:</strong> {error.name} ({error.type})</p>

                        <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800">
                            <strong>Troubleshooting:</strong>
                            <ul className="mt-1 space-y-1 list-disc list-inside">
                                <li>Check if backend server is running on port 5000</li>
                                <li>Verify NEXT_PUBLIC_API_URL environment variable</li>
                                <li>Check browser console for CORS errors</li>
                                <li>Ensure no firewall blocking the connection</li>
                            </ul>
                        </div>
                    </div>
                )}

                {healthStatus && (
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                        <h3 className="font-semibold text-green-800 mb-3">✅ Backend is Healthy</h3>

                        <div className="space-y-3 text-sm">
                            <div>
                                <strong>Status:</strong> {getStatusBadge(healthStatus.status)}
                                <span className="ml-2 text-gray-600">
                                    {healthStatus.timestamp && new Date(healthStatus.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <div>
                                <strong>Environment:</strong> <Badge variant="outline">{healthStatus.env}</Badge>
                            </div>

                            {healthStatus.services && (
                                <div>
                                    <strong>Services:</strong>
                                    <div className="mt-1 space-y-1">
                                        {Object.entries(healthStatus.services).map(([service, info]) => (
                                            <div key={service} className="flex items-center justify-between">
                                                <span className="capitalize">{service}:</span>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(info.status)}
                                                    <span className="text-xs text-gray-500">
                                                        {info.responseTime}ms
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {healthStatus.server && (
                                <div>
                                    <strong>Server:</strong>
                                    <div className="mt-1 text-xs text-gray-600 space-y-1">
                                        <div>Uptime: {Math.round(healthStatus.server.uptime)}s</div>
                                        <div>Memory: {Math.round(healthStatus.server.memory.heapUsed / 1024 / 1024)}MB used</div>
                                        <div>Node.js: {healthStatus.server.version}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                    <strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}
                </div>
            </CardContent>
        </Card>
    )
}

