"use client";

import StatusBadge from "@/components/dashboard/student/common/StatusBadge";
import { Button } from "@/components/dashboard/student/ui/button";
import { TabsContent } from "@/components/dashboard/student/ui/tabs";
import { getAppConfig, loadConfig } from "@/lib/utils";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Section5_Reporting } from "./[draftId]/reporting/page";

export default function AccomplishmentReport({ setActiveTab }) {
    /* ------------------------------------------------------------
     * STEP 1 – Load the authenticated user's profile so we know
     *           their contact_email / role.
     * ----------------------------------------------------------*/

    const [userProfileData, setUserProfileData] = useState(null);
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);
    const [userError, setUserError] = useState(null);

    useEffect(() => {
        const loadUserProfileData = async () => {
            try {
                // Extract token from cookie (preferred) or localStorage
                let token = null;
                if (typeof document !== "undefined") {
                    const cookieVal = document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("cedo_token="));
                    if (cookieVal) {
                        token = cookieVal.split("=")[1];
                    } else {
                        token =
                            localStorage.getItem("cedo_token") ||
                            localStorage.getItem("token");
                    }
                }

                const headers = { "Content-Type": "application/json" };
                if (token && token.split(".").length === 3) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                // Ensure backendUrl is available in app config
                let backendUrl = getAppConfig().backendUrl;
                if (!backendUrl) {
                    // Try to load config if not already loaded
                    const config = await loadConfig();
                    backendUrl = config.backendUrl;
                }
                if (!backendUrl) {
                    // Fallback to environment variables or localhost
                    backendUrl = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:5000';
                }
                if (!backendUrl) {
                    console.error('No backendUrl found in app config or environment. Skipping profile fetch.');
                    setUserError('No backendUrl found in app config or environment.');
                    setIsLoadingUserData(false);
                    return;
                }
                const profileUrl = `${backendUrl}/api/profile`;
                console.log('Fetching user profile from:', profileUrl);
                const resp = await fetch(
                    profileUrl,
                    {
                        method: "GET",
                        headers,
                        credentials: "include",
                    }
                );

                if (resp.ok) {
                    const data = await resp.json();
                    if (data.success && data.user) {
                        setUserProfileData(data.user);
                        return;
                    }
                }

                // If we reach here: response not ok OR format unexpected.
                if (resp.status === 401 || resp.status === 403 || resp.status === 404) {
                    console.warn("🔒 Not authenticated, token expired, or profile not found; falling back to local profile cache");
                    const cachedEmail =
                        (typeof localStorage !== "undefined" &&
                            (localStorage.getItem("cedo_user_email") || localStorage.getItem("contact_email"))) ||
                        null;
                    if (cachedEmail) {
                        setUserProfileData({ contactEmail: cachedEmail });
                        return;
                    }
                }
                throw new Error(`Profile fetch failed: ${resp.status}`);
            } catch (err) {
                console.error("❌ Error loading user profile:", err);
                setUserError(err.message);
            } finally {
                setIsLoadingUserData(false);
            }
        };

        loadUserProfileData();
    }, []);

    /* ------------------------------------------------------------
     * STEP 2 – Fetch APPROVED events for that user
     * ----------------------------------------------------------*/

    const [approvedEvents, setApprovedEvents] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [eventsError, setEventsError] = useState(null);

    // 🆕 Search & date filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const fetchApprovedEvents = useCallback(async () => {
        const userId = userProfileData?.id;
        const userRole = userProfileData?.role || 'student';

        // Do not fetch if the user is a student/partner but we don't have their ID yet.
        if ((userRole === 'student' || userRole === 'partner') && !userId) {
            console.warn("User ID not found in profile data. Skipping event fetch to prevent loading incorrect data.");
            setIsLoadingEvents(false);
            setApprovedEvents([]); // Ensure the list is empty
            return;
        }

        setIsLoadingEvents(true);
        setEventsError(null);

        try {
            // Always use getAppConfig() as a function
            let backend = getAppConfig().backendUrl;
            if (!backend) {
                // Try to load config if not already loaded
                const config = await loadConfig();
                backend = config.backendUrl;
            }
            if (!backend) {
                backend = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:5000';
            }

            const queryParams = new URLSearchParams();
            // Admins see all events. Other roles are filtered by their User ID.
            if (userRole !== 'admin' && userId) {
                queryParams.append('userId', userId);
            }
            queryParams.append('status', 'approved,pending');

            // Only require backend for admin, backend+userId for student/partner
            if (!backend || ((userRole !== 'admin') && !userId)) {
                console.error('fetchApprovedEvents: baseUrl or userId is undefined', { backend, userId, userRole });
                setEventsError('Cannot fetch events: missing base URL or user ID.');
                setIsLoadingEvents(false);
                setApprovedEvents([]);
                return;
            }
            const url = `${backend}/api/events/approved?${queryParams.toString()}`;
            console.log('Fetching events from:', url, { backend, userId, userRole });
            const res = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
            });

            if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`);

            const data = await res.json();
            let eventsArr = data.events || data.data || data.proposals || [];

            // Transform & filter approved
            const formatted = (Array.isArray(eventsArr) ? eventsArr : [])
                .filter((ev) => ['approved', 'pending'].includes(ev.proposal_status || ev.status))
                .map((event) => ({
                    id: event.id || event._id,
                    organization_name:
                        event.organization_name || event.organizationName || "Unknown Org",
                    organization_type:
                        event.organization_type || event.organizationType || "school-based",
                    event_name: event.event_name || event.eventName || "Unnamed Event",
                    event_venue: event.event_venue || event.eventVenue || "TBD",
                    event_start_date: event.event_start_date || event.startDate,
                    event_end_date: event.event_end_date || event.endDate,
                    proposal_status: event.proposal_status || event.status,
                    report_status: event.report_status || event.reportStatus || "not_applicable",
                    accomplishment_report_file_name:
                        event.accomplishment_report_file_name || event.accomplishmentReportFileName,
                    contact_email: event.contact_email || event.contactEmail,
                    contact_name: event.contact_name || event.contactName,
                    event_status: event.event_status || event.eventStatus || "pending",
                    form_completion_percentage:
                        event.form_completion_percentage || 0,
                }));

            setApprovedEvents(formatted);
        } catch (err) {
            console.error("❌ Error fetching approved events:", err);
            setEventsError(err.message);
            setApprovedEvents([]);
        } finally {
            setIsLoadingEvents(false);
        }
    }, [userProfileData]);

    useEffect(() => {
        if (!isLoadingUserData && userProfileData) {
            fetchApprovedEvents();
        }
    }, [isLoadingUserData, userProfileData, fetchApprovedEvents]);

    /* ------------------------------------------------------------
     * STEP 3 – Reporting helpers (copied from previous version)
     * ----------------------------------------------------------*/

    const [selectedEventForReport, setSelectedEventForReport] = useState(null);

    const updateReportData = useCallback((updates) => {
        setSelectedEventForReport((prev) => ({ ...prev, ...updates }));
    }, []);

    // 🔧 DATA MAPPING: Create a correctly structured formData object for the Section5 component.
    const reportFormData = useMemo(() => {
        if (!selectedEventForReport) return null;

        // Maps fields from the `event` object to the structure Section5 expects.
        return {
            ...selectedEventForReport,
            id: selectedEventForReport.id,
            proposalId: selectedEventForReport.id,
            organizationName: selectedEventForReport.organization_name,
            organizationType: selectedEventForReport.organization_type,
            eventName: selectedEventForReport.event_name,
            eventVenue: selectedEventForReport.event_venue,
            startDate: selectedEventForReport.event_start_date,
            endDate: selectedEventForReport.event_end_date,
            status: selectedEventForReport.proposal_status,
            reportStatus: selectedEventForReport.report_status,
            accomplishmentReportFileName: selectedEventForReport.accomplishment_report_file_name,
            contactEmail: selectedEventForReport.contact_email,
            contactName: selectedEventForReport.contact_name,
            eventStatus: selectedEventForReport.event_status,
            formCompletionPercentage: selectedEventForReport.form_completion_percentage,
        };
    }, [selectedEventForReport]);

    // 🔧 FILTERING: Filter events based on search and date range
    const filteredEvents = useMemo(() => {
        let filtered = approvedEvents;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event =>
                event.event_name?.toLowerCase().includes(query) ||
                event.organization_name?.toLowerCase().includes(query) ||
                event.contact_name?.toLowerCase().includes(query) ||
                event.contact_email?.toLowerCase().includes(query)
            );
        }

        // Date range filter
        if (fromDate) {
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.event_start_date);
                const fromDateObj = new Date(fromDate);
                return eventDate >= fromDateObj;
            });
        }

        if (toDate) {
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.event_start_date);
                const toDateObj = new Date(toDate);
                return eventDate <= toDateObj;
            });
        }

        return filtered;
    }, [approvedEvents, searchQuery, fromDate, toDate]);

    // 🔧 UTILITY: Reset all filters
    const resetFilters = () => {
        setSearchQuery("");
        setFromDate("");
        setToDate("");
    };

    // 🔧 HANDLER: Select event for reporting
    const handleSelectEventForReport = (event) => {
        setSelectedEventForReport(event);
        if (setActiveTab) {
            setActiveTab("reporting");
        }
    };

    // 🔧 UTILITY: Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "TBD";
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return "Invalid Date";
        }
    };

    // 🔧 UTILITY: Get status badge color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'success';
            case 'pending':
                return 'warning';
            case 'rejected':
            case 'denied':
                return 'error';
            default:
                return 'default';
        }
    };

    // 🔧 UTILITY: Check if event has report
    const hasReport = (event) => {
        return event.accomplishment_report_file_name &&
            event.accomplishment_report_file_name !== "null" &&
            event.accomplishment_report_file_name !== "";
    };

    // 🔧 UTILITY: Get report status text
    const getReportStatusText = (event) => {
        if (hasReport(event)) {
            return "Report Submitted";
        }
        return "No Report";
    };

    // 🔧 UTILITY: Get report status color
    const getReportStatusColor = (event) => {
        if (hasReport(event)) {
            return 'success';
        }
        return 'warning';
    };

    // 🔧 LOADING STATES
    if (isLoadingUserData) {
        return (
            <TabsContent value="accomplishment-report" className="space-y-4">
                <div className="flex items-center justify-center p-8">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading user profile...</span>
                    </div>
                </div>
            </TabsContent>
        );
    }

    if (userError) {
        return (
            <TabsContent value="accomplishment-report" className="space-y-4">
                <div className="flex items-center justify-center p-8">
                    <div className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Error loading profile: {userError}</span>
                    </div>
                </div>
            </TabsContent>
        );
    }

    return (
        <TabsContent value="accomplishment-report" className="space-y-4">
            {/* 🔍 SEARCH & FILTERS */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Search & Filters</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search Input */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Search Events</label>
                        <input
                            type="text"
                            placeholder="Search by event name, organization, or contact..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Reset Filters Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={resetFilters}
                        variant="outline"
                        size="sm"
                        className="text-gray-600"
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            {/* 📊 EVENTS LIST */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        Approved Events ({filteredEvents.length})
                    </h3>
                    {isLoadingEvents && (
                        <div className="flex items-center space-x-2 text-blue-600">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading events...</span>
                        </div>
                    )}
                </div>

                {eventsError && (
                    <div className="flex items-center space-x-2 text-red-600 p-4 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Error loading events: {eventsError}</span>
                    </div>
                )}

                {!isLoadingEvents && filteredEvents.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No approved events found.</p>
                        <p className="text-sm">Events will appear here once they are approved.</p>
                    </div>
                )}

                {!isLoadingEvents && filteredEvents.length > 0 && (
                    <div className="grid gap-4">
                        {filteredEvents.map((event) => (
                            <div
                                key={event.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-lg mb-2">
                                            {event.event_name}
                                        </h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p><strong>Organization:</strong> {event.organization_name}</p>
                                                <p><strong>Contact:</strong> {event.contact_name}</p>
                                                <p><strong>Email:</strong> {event.contact_email}</p>
                                                <p><strong>Venue:</strong> {event.event_venue}</p>
                                            </div>
                                            <div>
                                                <p><strong>Start Date:</strong> {formatDate(event.event_start_date)}</p>
                                                <p><strong>End Date:</strong> {formatDate(event.event_end_date)}</p>
                                                <p><strong>Status:</strong>
                                                    <StatusBadge
                                                        status={event.proposal_status}
                                                        color={getStatusColor(event.proposal_status)}
                                                    />
                                                </p>
                                                <p><strong>Report:</strong>
                                                    <StatusBadge
                                                        status={getReportStatusText(event)}
                                                        color={getReportStatusColor(event)}
                                                    />
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-4">
                                        <Button
                                            onClick={() => handleSelectEventForReport(event)}
                                            variant="outline"
                                            size="sm"
                                            className="whitespace-nowrap"
                                        >
                                            {hasReport(event) ? "View Report" : "Create Report"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 📝 REPORTING SECTION */}
            {selectedEventForReport && reportFormData && (
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Reporting for: {selectedEventForReport.event_name}
                    </h3>
                    <Section5_Reporting
                        formData={reportFormData}
                        updateFormData={updateReportData}
                    />
                </div>
            )}
        </TabsContent>
    );
}
