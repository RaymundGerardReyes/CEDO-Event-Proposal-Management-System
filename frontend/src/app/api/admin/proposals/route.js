import { config } from '@/lib/utils';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// API route to fetch all proposals for admin dashboard
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // Filter by status if provided
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        console.log('📋 Admin: Fetching proposals from Hybrid API (MySQL + MongoDB)...')
        console.log('📋 Filters:', { status, page, limit, skip })

        // Get auth from cookies or headers
        const authCookie = request.cookies.get('cedo_token')?.value;

        if (!authCookie) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Connect to hybrid API (MySQL + MongoDB)
        const backendUrl = config.backendUrl
        const apiUrl = `${backendUrl}/api/mongodb-proposals/admin/proposals-hybrid`

        // Build query parameters for backend
        const queryParams = new URLSearchParams()
        if (status && status !== 'all') queryParams.append('status', status)
        queryParams.append('page', page.toString())
        queryParams.append('limit', limit.toString())

        const finalUrl = `${apiUrl}?${queryParams.toString()}`
        console.log('🌐 Calling backend API:', finalUrl)

        // Test backend connectivity first
        try {
            const healthCheck = await fetch(`${backendUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            console.log('🏥 Backend health check:', healthCheck.status, healthCheck.ok)
        } catch (healthError) {
            console.error('❌ Backend health check failed:', healthError.message)
            throw new Error(`Backend server not reachable at ${backendUrl}. Please ensure backend is running.`)
        }

        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add auth headers when needed
                // 'Authorization': `Bearer ${token}`
            },
        })

        console.log('📡 Backend response status:', response.status, response.statusText)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ Backend API error:', response.status, response.statusText, errorText)
            throw new Error(`Backend API error: ${response.status} - ${response.statusText}. ${errorText}`)
        }

        const data = await response.json()
        console.log('✅ Successfully fetched proposals from hybrid API')
        console.log('📊 Hybrid API response:', {
            success: data.success,
            proposalsCount: data.proposals?.length || 0,
            pagination: data.pagination,
            metadata: data.metadata
        })

        // Transform hybrid backend data to match frontend component expectations
        const transformedProposals = (data.proposals || []).map(proposal => ({
            id: proposal.id,
            eventName: proposal.eventName || proposal.title || 'Unnamed Event',
            venue: proposal.venue || 'N/A',
            startDate: proposal.startDate || proposal.submittedAt,
            submittedAt: proposal.submittedAt || proposal.createdAt,
            status: proposal.status,
            contactPerson: proposal.contactPerson,
            contactEmail: proposal.contactEmail,
            contactPhone: proposal.contactPhone,
            organizationType: proposal.organizationType || 'Unknown',
            eventType: proposal.eventType || proposal.category || 'General',
            description: proposal.description,
            organization: proposal.organizationName || proposal.organization,
            // Files from MySQL
            files: proposal.files || {},
            dataSource: proposal.dataSource,
            budget: proposal.budget,
            objectives: proposal.objectives,
            volunteersNeeded: proposal.volunteersNeeded
        }))

        // Transform pagination data from hybrid API
        const transformedPagination = {
            page: data.pagination?.page || page,
            pages: data.pagination?.pages || 0,
            total: data.pagination?.total || 0,
            hasPrev: data.pagination?.hasPrev || false,
            hasNext: data.pagination?.hasNext || false,
            limit: data.pagination?.limit || limit
        }

        return NextResponse.json({
            success: true,
            proposals: transformedProposals,
            pagination: transformedPagination
        })

    } catch (error) {
        console.error('❌ Error fetching proposals:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch proposals',
                details: error.message,
                proposals: [],
                pagination: { page: 1, limit: 10, total: 0, pages: 0 }
            },
            { status: 500 }
        )
    }
} 