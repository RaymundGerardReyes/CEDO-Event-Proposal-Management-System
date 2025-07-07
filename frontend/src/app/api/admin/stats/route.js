import { getAppConfig } from '@/lib/utils';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/stats
 * Fetch dashboard statistics from backend
 */
export async function GET() {
    try {
        const config = getAppConfig();
        const API_URL = config.backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

        // Get authentication token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('cedo_token')?.value;

        if (!token) {
            console.error('No authentication token found');
            throw new Error('Authentication required');
        }

        // Prepare headers with authentication
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        console.log('🔍 Fetching stats from backend:', `${API_URL}/api/proposals/stats`);

        // Fetch stats from proposals endpoint (more comprehensive data)
        const response = await fetch(`${API_URL}/api/proposals/stats`, {
            method: 'GET',
            headers: headers,
        });

        console.log('📡 Backend response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend stats API error:', response.status, response.statusText, errorText);

            if (response.status === 401) {
                throw new Error('Authentication failed - please sign in again');
            } else if (response.status === 403) {
                throw new Error('Access denied - insufficient permissions');
            } else {
                throw new Error(`Backend API error: ${response.status} - ${response.statusText}`);
            }
        }

        const data = await response.json();
        console.log('✅ Backend stats response:', data);

        if (!data.success) {
            throw new Error(data.error || data.message || 'Failed to fetch stats');
        }

        // Transform backend data to match frontend expectations
        const backendStats = data.stats || {};

        // Extract metrics from backend response
        const total = backendStats.total || 0;
        const pending = backendStats.pending || 0;
        const approved = backendStats.approved || 0;
        const rejected = backendStats.rejected || 0;
        const newSinceYesterday = backendStats.newSinceYesterday || 0;
        const approvalRate = backendStats.approvalRate || 0;
        const dayOverDayChange = backendStats.dayOverDayChange || 0;

        // Return formatted stats that match the admin dashboard expectations
        return NextResponse.json({
            success: true,
            stats: {
                total,
                pending,
                approved,
                rejected,
                newSinceYesterday,
                approvalRate: `${approvalRate}%`,
                dayOverDayPct: `${Math.abs(dayOverDayChange)}%`,
                isPositiveGrowth: dayOverDayChange >= 0,
            }
        });

    } catch (error) {
        console.error('Stats API error:', error);

        // Return fallback data in case of error
        return NextResponse.json({
            success: false,
            error: error.message,
            stats: {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                newSinceYesterday: 0,
                approvalRate: '0%',
                dayOverDayPct: '0%',
                isPositiveGrowth: true,
            }
        }, { status: 500 });
    }
} 