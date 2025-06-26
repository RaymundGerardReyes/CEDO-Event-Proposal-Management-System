import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
        const apiUrl = `${backendUrl}/api/mongodb-unified/admin/proposals-hybrid?limit=3`

        console.log('🧪 Testing backend connection:', apiUrl)

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Backend API failed: ${response.status}`)
        }

        const data = await response.json()

        return NextResponse.json({
            success: true,
            message: 'Backend connection successful',
            backendUrl,
            proposalCount: data.proposals?.length || 0,
            sampleProposal: data.proposals?.[0] || null,
            pagination: data.pagination
        })
    } catch (error) {
        console.error('🚨 Backend test failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
        }, { status: 500 })
    }
} 