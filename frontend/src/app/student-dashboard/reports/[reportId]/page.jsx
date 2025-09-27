/**
 * Report Detail View Page - Server Component
 * Fetches and displays complete report data with server-side rendering
 */

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import ReportDetailView from './ReportDetailView';

/**
 * Transform proposal data to consistent format
 * @param {Object} proposal - Raw proposal data
 * @param {string} backendUrl - Backend URL for file downloads
 * @returns {Object} Transformed proposal data
 */
function transformProposalData(proposal, backendUrl) {
    if (!proposal) return null;

    return {
        // Basic info
        id: proposal.id,
        organizationName: proposal.organizationName || proposal.organization_name,
        organizationType: proposal.organizationType || proposal.organization_type,
        organizationDescription: proposal.organizationDescription || proposal.organization_description,

        // Contact info
        contactName: proposal.contactName || proposal.contact_person,
        contactEmail: proposal.contactEmail || proposal.contact_email,
        contactPhone: proposal.contactPhone || proposal.contact_phone,

        // Event details
        eventName: proposal.eventName || proposal.event_name || proposal.schoolEventName || proposal.communityEventName,
        eventVenue: proposal.eventVenue || proposal.event_venue || proposal.schoolVenue || proposal.communityVenue,
        eventStartDate: proposal.eventStartDate || proposal.event_start_date || proposal.schoolStartDate || proposal.communityStartDate,
        eventEndDate: proposal.eventEndDate || proposal.event_end_date || proposal.schoolEndDate || proposal.communityEndDate,
        eventStartTime: proposal.eventStartTime || proposal.event_start_time,
        eventEndTime: proposal.eventEndTime || proposal.event_end_time,
        eventMode: proposal.eventMode || proposal.event_mode,
        eventType: proposal.eventType || proposal.event_type || proposal.schoolEventType || proposal.communityEventType,

        // Status and reporting
        proposalStatus: proposal.proposalStatus || proposal.proposal_status,
        eventStatus: proposal.eventStatus || proposal.event_status,
        reportDescription: proposal.reportDescription || proposal.report_description,
        attendanceCount: proposal.attendanceCount || proposal.attendance_count,
        digitalSignature: proposal.digitalSignature || proposal.digital_signature,

        // File information - construct download URLs
        files: {
            accomplishmentReport: (proposal.accomplishmentReportFileName || proposal.accomplishment_report_file_name) ? {
                filename: proposal.accomplishmentReportFileName || proposal.accomplishment_report_file_name,
                originalName: proposal.accomplishmentReportFileName || proposal.accomplishment_report_file_name,
                downloadUrl: `${backendUrl}/api/proposals/files/download/${proposal.accomplishmentReportFilePath || proposal.accomplishment_report_file_path}`
            } : null,

            preRegistrationList: (proposal.preRegistrationFileName || proposal.pre_registration_file_name) ? {
                filename: proposal.preRegistrationFileName || proposal.pre_registration_file_name,
                originalName: proposal.preRegistrationFileName || proposal.pre_registration_file_name,
                downloadUrl: `${backendUrl}/api/proposals/files/download/${proposal.preRegistrationFilePath || proposal.pre_registration_file_path}`
            } : null,

            finalAttendanceList: (proposal.finalAttendanceFileName || proposal.final_attendance_file_name) ? {
                filename: proposal.finalAttendanceFileName || proposal.final_attendance_file_name,
                originalName: proposal.finalAttendanceFileName || proposal.final_attendance_file_name,
                downloadUrl: `${backendUrl}/api/proposals/files/download/${proposal.finalAttendanceFilePath || proposal.final_attendance_file_path}`
            } : null
        },

        // Timestamps
        createdAt: proposal.createdAt || proposal.created_at,
        updatedAt: proposal.updatedAt || proposal.updated_at,

        // View metadata
        viewedAt: new Date().toISOString(),
        viewedBy: 'system'
    };
}

/**
 * Server-side function to fetch report data
 * @param {string} reportId - The report ID to fetch
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Report data or null if not found
 */
async function fetchReportData(reportId, token) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000';

    // Try the authenticated endpoint first
    try {
        const apiUrl = `${backendUrl}/api/proposals/reports/${reportId}`;
        console.log('🔍 Server: Trying authenticated endpoint:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server: Report data fetched from authenticated endpoint');
            return data.report;
        } else {
            console.log(`⚠️ Server: Authenticated endpoint failed with status ${response.status}, trying fallback...`);
        }
    } catch (authError) {
        console.log('⚠️ Server: Authenticated endpoint error, trying fallback:', authError.message);
    }

    // Try multiple fallback endpoints
    const fallbackEndpoints = [
        `${backendUrl}/api/proposals/${reportId}`,
        `${backendUrl}/api/proposals/debug/${reportId}`,
        `${backendUrl}/api/proposals/mysql/${reportId}`,
        `${backendUrl}/api/proposals/${reportId}`
    ];

    for (let i = 0; i < fallbackEndpoints.length; i++) {
        const endpoint = fallbackEndpoints[i];
        const endpointName = endpoint.includes('debug') ? 'Debug'
            : endpoint.includes('mysql') ? 'MySQL'
                : 'PostgreSQL';

        try {
            console.log(`🔍 Server: Trying ${endpointName} endpoint (${i + 1}/${fallbackEndpoints.length}):`, endpoint);

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                cache: 'no-store'
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Server: Report data fetched from ${endpointName} endpoint`);

                // Extract proposal from different response formats
                let proposal = null;
                if (endpointName === 'Debug') {
                    proposal = data.mysql?.data || data.mongodb?.data || data;
                } else {
                    proposal = data.proposal || data.data || data;
                }

                if (proposal && proposal.id) {
                    return transformProposalData(proposal, backendUrl);
                }
            } else if (response.status === 404) {
                console.log(`⚠️ Server: ${endpointName} endpoint returned 404, trying next...`);
                continue;
            } else {
                console.log(`⚠️ Server: ${endpointName} endpoint failed with status ${response.status}, trying next...`);
                continue;
            }
        } catch (error) {
            console.log(`⚠️ Server: ${endpointName} endpoint error:`, error.message);
            continue;
        }
    }

    // All endpoints failed
    console.error('❌ Server: All fallback endpoints failed');
    return null;
}

/**
 * Server-side function to get authentication token
 * @returns {Promise<string|null>} Authentication token or null
 */
async function getAuthToken() {
    try {
        const cookieStore = await cookies();

        // Try to get token from cookie first
        let token = cookieStore.get('cedo_token')?.value;

        if (!token) {
            // Fallback to other possible cookie names
            token = cookieStore.get('token')?.value;
        }

        if (token && token.split('.').length === 3) {
            return token;
        }

        return null;
    } catch (error) {
        console.error('❌ Server: Error getting auth token:', error);
        return null;
    }
}

/**
 * Client Component for Error State with Interactive Elements
 */
function ErrorDisplay({ error, reportId }) {
    const isNotFound = error?.message === 'Report not found';
    const isUnauthorized = error?.message === 'Not authorized to view this report';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                <div className="text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isNotFound ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                        {isNotFound ? (
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {isNotFound ? 'Report Not Found' : 'Error Loading Report'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {isNotFound
                            ? `Report with ID "${reportId}" could not be found. It may have been deleted or you may not have access to it.`
                            : isUnauthorized
                                ? 'You are not authorized to view this report.'
                                : 'There was an error loading the report. Please try again later.'
                        }
                    </p>
                    <div className="mt-6 space-x-3">
                        <Link href="/student-dashboard/reports">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Reports
                            </Button>
                        </Link>
                        {!isNotFound && (
                            <Link href={`/student-dashboard/reports/${reportId}`}>
                                <Button variant="outline" size="sm">
                                    View Full Report
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Report Detail Page Component (Server Component)
 * @param {Object} props - Component props
 * @param {Promise<Object>} props.params - Route parameters (awaitable in Next.js 15)
 */
export default async function ReportDetailPage({ params }) {
    // ✅ FIX: Await params in Next.js 15
    const { reportId } = await params;

    console.log('📊 Server: Loading report detail page for ID:', reportId);

    // Get authentication token
    const token = await getAuthToken();

    // Note: We still try to fetch data even without token since the fallback endpoint works
    if (!token) {
        console.log('⚠️ Server: No token found, will use fallback endpoint');
    }

    try {
        // Fetch report data on the server (will fallback to different endpoints)
        const reportData = await fetchReportData(reportId, token);

        if (!reportData) {
            // Report not found - show user-friendly error instead of 404
            console.log('⚠️ Server: No report data found for ID:', reportId);
            return <ErrorDisplay error={{ message: 'Report not found' }} reportId={reportId} />;
        }

        // Pass data to client component for rendering
        return (
            <div className="min-h-screen bg-gray-50">
                <ReportDetailView
                    reportData={reportData}
                    reportId={reportId}
                />
            </div>
        );

    } catch (error) {
        console.error('❌ Server: Error in report detail page:', error);

        // Return error component instead of throwing
        return <ErrorDisplay error={error} reportId={reportId} />;
    }
}

/**
 * Generate metadata for the page
 * ✅ FIX: Await params in Next.js 15
 */
export async function generateMetadata({ params }) {
    const { reportId } = await params;

    return {
        title: `Report ${reportId} - CEDO Accomplishment Reports`,
        description: `View detailed accomplishment report for submission ${reportId}`,
    };
} 