"use client";

import StatusBadge from "@/components/dashboard/student/common/StatusBadge";
import { Button } from "@/components/dashboard/student/ui/button";
import { TabsContent } from "@/components/dashboard/student/ui/tabs";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Section5_Reporting from "./Section5_Reporting";

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

                const resp = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/profile`,
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
                if (resp.status === 401 || resp.status === 403) {
                    console.warn("🔒 Not authenticated or token expired; falling back to local profile cache");
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
        const role = userProfileData?.role || 'student';
        const email = (role === 'student' || role === 'partner') ?
            (userProfileData?.contactEmail || (typeof localStorage !== 'undefined' && localStorage.getItem('cedo_user_email'))) : null;

        setIsLoadingEvents(true);
        setEventsError(null);

        try {
            const backend =
                process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

            const queryParams = new URLSearchParams();
            if (email) queryParams.append('email', email);
            queryParams.append('status', 'approved,pending');

            const url = `${backend}/api/events/approved?${queryParams.toString()}`;

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
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportError, setReportError] = useState(null);

    const updateReportData = useCallback((updates) => {
        setReportData((prev) => ({ ...prev, ...updates }));
    }, []);

    // 🆕 Helper to reset filters
    const resetFilters = () => {
        setSearchQuery("");
        setFromDate("");
        setToDate("");
    };

    // 🆕 Derived list after applying client-side filters
    const filteredEvents = approvedEvents.filter((event) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
            query === "" ||
            (event.event_name?.toLowerCase() || "").includes(query) ||
            (event.organization_name?.toLowerCase() || "").includes(query);

        const eventStart = new Date(event.event_start_date);
        const fromOk = !fromDate || eventStart >= new Date(fromDate);
        const toOk = !toDate || eventStart <= new Date(toDate);

        return matchesSearch && fromOk && toOk;
    });

    const fetchReportData = useCallback(
        async (event) => {
            if (!event?.id) return;
            setIsLoadingReport(true);
            setReportError(null);

            try {
                const backend =
                    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const resp = await fetch(`${backend}/api/reports/${event.id}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (resp.ok) {
                    const data = await resp.json();
                    setReportData(data);
                } else if (resp.status === 404) {
                    // no existing report, create default skeleton
                    setReportData({ isNewReport: true, ...event });
                } else {
                    throw new Error(`Report fetch failed: ${resp.status}`);
                }
            } catch (err) {
                console.error("❌ Error fetching report:", err);
                setReportError(err.message);
            } finally {
                setIsLoadingReport(false);
            }
        },
        []
    );

    const handleSelectEventForReport = (event) => {
        setSelectedEventForReport(event);
        fetchReportData(event);
    };

    const handleReportSubmit = async (submissionData) => {
        if (!selectedEventForReport) return;
        try {
            const backend =
                process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const resp = await fetch(`${backend}/api/reports/${selectedEventForReport.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData),
            });
            if (resp.ok) {
                fetchReportData(selectedEventForReport);
                // Refresh events list to update report_status
                fetchApprovedEvents();
            } else {
                throw new Error(`Report submit failed: ${resp.status}`);
            }
        } catch (err) {
            console.error("❌ Report submission error:", err);
            throw err;
        }
    };

    /* ------------------------------------------------------------
     * UI RENDER – identical to previous template but driven by new state
     * ----------------------------------------------------------*/

    /* Loading overlay while fetching profile */
    if (isLoadingUserData) {
        return (
            <TabsContent value="report" className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm">Loading user profile…</span>
            </TabsContent>
        );
    }

    if (userError) {
        return (
            <TabsContent value="report" className="space-y-4 mt-4">
                <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
                    <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600">Failed to load user profile: {userError}</p>
                </div>
            </TabsContent>
        );
    }

    // The rest is the same as previous JSX – use internal state vars
    return (
        <TabsContent value="report" className="space-y-4 mt-4">
            {/* Header */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-2">Accomplishment Reports</h3>
                <p className="text-sm text-muted-foreground">
                    Manage accomplishment reports for your approved events
                </p>
            </div>

            {/* Loading state for approved events */}
            {isLoadingEvents && (
                <div className="bg-white border rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Loading Approved Events</h3>
                    <p className="text-muted-foreground">
                        Fetching your approved events from database...
                    </p>
                </div>
            )}

            {/* Error state for approved events */}
            {eventsError && !isLoadingEvents && (
                <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-red-600">Failed to Load Events</h3>
                    <p className="text-muted-foreground mb-4">
                        {eventsError}
                    </p>
                    <Button onClick={fetchApprovedEvents} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Retry Loading Events
                    </Button>
                </div>
            )}

            {/* No approved events */}
            {!isLoadingEvents && !eventsError && approvedEvents.length === 0 && (
                <div className="bg-white border rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-gray-600">No Approved Events</h3>
                    <p className="text-muted-foreground">
                        You don't have any approved events yet. Submit an event proposal to get started.
                    </p>
                    <Button onClick={() => setActiveTab("proposal")} variant="outline" className="mt-4">
                        Go to Event Proposal
                    </Button>
                </div>
            )}

            {/* List of approved events */}
            {!isLoadingEvents && !eventsError && approvedEvents.length > 0 && !selectedEventForReport && (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700">
                            📋 <strong>{filteredEvents.length}</strong> of {approvedEvents.length} Approved Event{approvedEvents.length > 1 ? 's' : ''} shown – refine your search below
                        </p>
                    </div>

                    {/* 🆕 Filters UI */}
                    <div className="bg-white border rounded-lg p-4 flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Search</label>
                            <input
                                type="text"
                                placeholder="Search by event or organization…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">From</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="border rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">To</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="border rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                        <Button onClick={resetFilters} variant="outline" className="md:ml-2 mt-2 md:mt-6">Clear</Button>
                    </div>

                    <div className="grid gap-4">
                        {filteredEvents.map((event) => (
                            <div key={event.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium text-lg">{event.event_name}</h4>
                                            <StatusBadge status={event.report_status} />
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p><strong>Organization:</strong> {event.organization_name}</p>
                                            <p><strong>Type:</strong> {event.organization_type}</p>
                                            <p><strong>Venue:</strong> {event.event_venue}</p>
                                            <p><strong>Date:</strong> {new Date(event.event_start_date).toLocaleDateString()} - {new Date(event.event_end_date).toLocaleDateString()}</p>
                                            <p><strong>Status:</strong> {event.event_status || 'Pending'}</p>
                                            {event.accomplishment_report_file_name && (
                                                <p className="text-green-600">
                                                    <strong>Report:</strong> {event.accomplishment_report_file_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {event.report_status === 'not_applicable' || !event.accomplishment_report_file_name ? (
                                            <Button
                                                onClick={() => handleSelectEventForReport(event)}
                                                className="w-full sm:w-auto"
                                            >
                                                Create Report
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleSelectEventForReport(event)}
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                            >
                                                View Report
                                            </Button>
                                        )}
                                        <div className="text-xs text-center text-muted-foreground">
                                            ID: {event.id}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🆕 No events match filters */}
            {!isLoadingEvents && !eventsError && approvedEvents.length > 0 && filteredEvents.length === 0 && !selectedEventForReport && (
                <div className="bg-white border rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-gray-600">No Events Match Your Filters</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search text or date range.</p>
                    <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
                </div>
            )}

            {/* Report creation/editing interface */}
            {selectedEventForReport && (
                <div className="space-y-4">
                    {/* Back button and event info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">
                                {selectedEventForReport.accomplishment_report_file_name
                                    ? 'Viewing Report'
                                    : 'Creating Report'}: {selectedEventForReport.event_name}
                            </h3>
                            <Button
                                onClick={() => setSelectedEventForReport(null)}
                                variant="outline"
                                size="sm"
                            >
                                ← Back to Events List
                            </Button>
                        </div>
                        <p className="text-sm text-blue-700">
                            Organization: {selectedEventForReport.organization_name} |
                            Date: {new Date(selectedEventForReport.event_start_date).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Loading state for specific report */}
                    {isLoadingReport && (
                        <div className="bg-white border rounded-lg p-6 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                                <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Loading Report Data</h3>
                            <p className="text-muted-foreground">
                                Fetching report details for {selectedEventForReport.event_name}...
                            </p>
                        </div>
                    )}

                    {/* Report interface */}
                    {!isLoadingReport && reportData && (
                        <Section5_Reporting
                            formData={{
                                ...reportData,
                                ...selectedEventForReport,
                                id: selectedEventForReport.id,
                                proposalId: selectedEventForReport.id,
                                organizationName: selectedEventForReport.organization_name,
                                contactEmail: selectedEventForReport.contact_email,
                                contactName: selectedEventForReport.contact_name,
                                organizationType: selectedEventForReport.organization_type,
                                organizationTypes: [selectedEventForReport.organization_type],
                                // Map event fields to form structure
                                schoolEventName: selectedEventForReport.organization_type === 'school-based' ? selectedEventForReport.event_name : '',
                                communityEventName: selectedEventForReport.organization_type === 'community-based' ? selectedEventForReport.event_name : '',
                                schoolVenue: selectedEventForReport.organization_type === 'school-based' ? selectedEventForReport.event_venue : '',
                                communityVenue: selectedEventForReport.organization_type === 'community-based' ? selectedEventForReport.event_venue : '',
                                schoolStartDate: selectedEventForReport.organization_type === 'school-based' ? selectedEventForReport.event_start_date : '',
                                communityStartDate: selectedEventForReport.organization_type === 'community-based' ? selectedEventForReport.event_start_date : '',
                                schoolEndDate: selectedEventForReport.organization_type === 'school-based' ? selectedEventForReport.event_end_date : '',
                                communityEndDate: selectedEventForReport.organization_type === 'community-based' ? selectedEventForReport.event_end_date : '',
                                eventStatus: selectedEventForReport.event_status,
                                proposalStatus: selectedEventForReport.proposal_status
                            }}
                            updateFormData={updateReportData}
                            onSubmit={handleReportSubmit}
                            onPrevious={() => setSelectedEventForReport(null)}
                            disabled={selectedEventForReport.report_status === "approved"}
                            sectionsComplete={{
                                section1: true,
                                section2: true,
                                section3: true,
                                section4: true,
                                section5: false
                            }}
                        />
                    )}
                </div>
            )}
        </TabsContent>
    )
}
