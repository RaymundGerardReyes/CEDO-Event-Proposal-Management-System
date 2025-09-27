import { getAppConfig } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const backendUrl = getAppConfig().backendUrl
        const apiUrl = `${backendUrl}/api/admin/proposals?limit=3`

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
            backendUrl: getAppConfig().backendUrl,
            proposalCount: data.proposals?.length || 0,
            sampleProposal: data.proposals?.[0] || null,
            pagination: data.pagination
        })
    } catch (error) {
        console.error('🚨 Backend test failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            backendUrl: getAppConfig().backendUrl
        }, { status: 500 })
    }
} 