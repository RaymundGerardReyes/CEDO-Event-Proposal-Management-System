/**
 * useOverviewData Hook
 * Custom hook for managing overview page data and state
 * 
 * Key approaches: Extract shared logic, clean state management,
 * reusable data fetching patterns
 */

import { useAuth } from "@/contexts/auth-context";
import { loadConfig } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export const useOverviewData = () => {
    const { user: authUser, isLoading: authLoading, isInitialized } = useAuth();

    // Configuration state
    const [config, setConfig] = useState(null);
    const [userProfileData, setUserProfileData] = useState(null);
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);
    const [userError, setUserError] = useState(null);

    // Events state
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [eventsError, setEventsError] = useState(null);

    // Load configuration
    useEffect(() => {
        const loadAppConfig = async () => {
            try {
                const appConfig = await loadConfig();
                console.log("⚙️ Loaded config:", appConfig);
                setConfig(appConfig);
            } catch (err) {
                console.error("❌ Error loading config:", err);
                // Set fallback config
                const fallbackConfig = {
                    apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000',
                    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000'
                };
                console.log("🔄 Using fallback config:", fallbackConfig);
                setConfig(fallbackConfig);
            }
        };
        loadAppConfig();
    }, []);

    // Use auth context user data
    useEffect(() => {
        if (!isInitialized) return;

        if (authLoading) {
            setIsLoadingUserData(true);
            return;
        }

        if (authUser) {
            console.log("👤 Using user data from auth context:", authUser);
            setUserProfileData(authUser);
            setUserError(null);
        } else {
            console.log("⚠️ No authenticated user found");
            setUserError("No authenticated user found");
        }

        setIsLoadingUserData(false);
    }, [authUser, authLoading, isInitialized]);

    // Fetch approved events
    const fetchApprovedEvents = useCallback(async () => {
        const userId = userProfileData?.id;
        const userRole = userProfileData?.role || 'student';

        // Do not fetch if the user is a student/partner but we don't have their ID yet
        if ((userRole === 'student' || userRole === 'partner') && !userId) {
            console.warn("User ID not found in profile data. Skipping event fetch to prevent loading incorrect data.");
            setIsLoadingEvents(false);
            setApprovedEvents([]);
            return;
        }

        setIsLoadingEvents(true);
        setEventsError(null);

        try {
            const backend = config?.backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

            const queryParams = new URLSearchParams();

            // Admins see all events. Other roles are filtered by their User ID.
            if (userRole !== 'admin' && userId) {
                queryParams.append('userId', userId);
            }
            queryParams.append('status', 'approved,pending');

            const url = `${backend}/api/events/approved?${queryParams.toString()}`;
            console.log(`✅ Fetching events for user ${userId || '(admin)'} from URL: ${url}`);

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
                    organization_name: event.organization_name || event.organizationName || "Unknown Org",
                    organization_type: event.organization_type || event.organizationType || "school-based",
                    event_name: event.event_name || event.eventName || "Unnamed Event",
                    event_start_date: event.event_start_date || event.eventStartDate || new Date().toISOString(),
                    proposal_status: event.proposal_status || event.status || "draft",
                    report_status: event.report_status || event.reportStatus || "not_applicable",
                    accomplishment_report_file_name: event.accomplishment_report_file_name || event.accomplishmentReportFileName || null
                }));

            console.log(`✅ Loaded ${formatted.length} events for user ${userId || '(admin)'}`);
            setApprovedEvents(formatted);
        } catch (error) {
            console.error("❌ Error fetching events:", error);
            setEventsError(error.message || "Failed to load events");
        } finally {
            setIsLoadingEvents(false);
        }
    }, [config, userProfileData]);

    // Load events when user data is available
    useEffect(() => {
        if (userProfileData && config) {
            fetchApprovedEvents();
        }
    }, [userProfileData, config, fetchApprovedEvents]);

    return {
        // User data
        userProfileData,
        isLoadingUserData,
        userError,

        // Events data
        approvedEvents,
        isLoadingEvents,
        eventsError,
        fetchApprovedEvents,

        // Auth state
        authUser,
        authLoading,
        isInitialized
    };
};




