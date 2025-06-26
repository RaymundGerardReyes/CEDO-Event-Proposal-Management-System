"use client"

import { useEffect, useState } from 'react'

export default function DebugProposalPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchData() {
            try {
                console.log('🔍 Starting proposal fetch test...')

                // Test frontend API route first
                const testResponse = await fetch('/api/test-proposals')
                const testData = await testResponse.json()
                console.log('✅ Frontend API test:', testData)

                // Test direct backend call
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
                const directResponse = await fetch(`${backendUrl}/api/mongodb-unified/admin/proposals-hybrid?limit=2`)

                if (!directResponse.ok) {
                    throw new Error(`Backend error: ${directResponse.status}`)
                }

                const directData = await directResponse.json()
                console.log('✅ Direct backend test:', directData)

                setData({
                    frontendTest: testData,
                    backendTest: directData
                })
            } catch (err) {
                console.error('❌ Test failed:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Proposal API Debug</h1>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p>Testing API connections...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Proposal API Debug</h1>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Proposal API Debug</h1>

            <div className="space-y-6">
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <strong>✅ All tests passed!</strong>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Frontend API Test</h2>
                    <div className="bg-gray-100 p-4 rounded overflow-auto">
                        <pre>{JSON.stringify(data?.frontendTest, null, 2)}</pre>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Backend Test</h2>
                    <div className="bg-gray-100 p-4 rounded overflow-auto">
                        <pre>{JSON.stringify(data?.backendTest, null, 2)}</pre>
                    </div>
                </div>

                {data?.backendTest?.proposals?.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Sample Proposal Fields</h2>
                        <div className="bg-blue-100 p-4 rounded">
                            <p><strong>Available fields:</strong></p>
                            <ul className="list-disc list-inside mt-2">
                                {Object.keys(data.backendTest.proposals[0]).map(field => (
                                    <li key={field} className="text-sm">
                                        <code>{field}</code>: {typeof data.backendTest.proposals[0][field]}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 