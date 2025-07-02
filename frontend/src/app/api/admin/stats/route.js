import { config } from '@/lib/utils';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = config.apiUrl;

/**
 * GET /api/admin/stats
 * Fetch dashboard statistics from backend
 */
export async function GET() {
    try {
        // Get authentication token from cookies (optional for this endpoint)
        const cookieStore = await cookies();
        const token = cookieStore.get('cedo_token')?.value;

        // Prepare headers - include auth token if available
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch stats from backend - using working proposals admin stats endpoint
        const response = await fetch(`${API_URL}/proposals/admin/stats`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            console.error('Backend stats API error:', response.status, response.statusText);
            throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch stats');
        }

        // Extract stats from proposals admin endpoint response format
        const stats = data.data;
        const total = (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0) + (stats.draft || 0);
        const pending = stats.pending || 0;
        const approved = stats.approved || 0;
        const rejected = stats.rejected || 0;

        // Calculate metrics from available data
        const newSinceYesterday = stats.recentActivity || 0; // Use recent activity as proxy
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        // Use trends data if available
        const pendingTrend = stats.trends?.pending;
        const dayOverDayChange = pendingTrend?.direction === 'up' ?
            parseInt(pendingTrend.value) :
            pendingTrend?.direction === 'down' ?
                -parseInt(pendingTrend.value) : 0;

        // Return formatted stats
        return NextResponse.json({
            success: true,
            stats: {
                total,
                pending,
                approved,
                rejected,
                newSinceYesterday,
                approvalRate: `${approvalRate}%`,
                dayOverDayPct: `${dayOverDayChange}%`,
                isPositiveGrowth: parseFloat(dayOverDayChange) >= 0,
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