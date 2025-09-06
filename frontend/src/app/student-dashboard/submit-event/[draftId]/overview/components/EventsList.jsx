/**
 * EventsList Component
 * Displays the list of approved events with filtering and search
 * 
 * Key approaches: Single responsibility, reusable component,
 * clean state management
 */

import { Button } from "@/components/dashboard/student/ui/button";
import { Input } from "@/components/dashboard/student/ui/input";
import { Calendar, FileText, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

const EventsList = ({
    events,
    isLoading,
    error,
    onRefresh,
    onSelectEventForReport,
    onResetFilters
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Filter events based on search and date range
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesSearch = !searchQuery ||
                event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.organization_name.toLowerCase().includes(searchQuery.toLowerCase());

            const eventDate = new Date(event.event_start_date);
            const matchesFromDate = !fromDate || eventDate >= new Date(fromDate);
            const matchesToDate = !toDate || eventDate <= new Date(toDate);

            return matchesSearch && matchesFromDate && matchesToDate;
        });
    }, [events, searchQuery, fromDate, toDate]);

    const resetFilters = () => {
        setSearchQuery("");
        setFromDate("");
        setToDate("");
        onResetFilters?.();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading events...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-red-800">Error Loading Events</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={onRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="bg-white border rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-600">No Events Found</h3>
                <p className="text-muted-foreground mb-4">
                    You don't have any approved events yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="bg-white border rounded-lg p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div>
                        <Input
                            type="date"
                            placeholder="From date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Input
                            type="date"
                            placeholder="To date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                        {filteredEvents.length} of {events.length} events
                    </span>
                    <Button onClick={resetFilters} variant="outline" size="sm">
                        Reset Filters
                    </Button>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{event.event_name}</h3>
                                <p className="text-sm text-gray-600">{event.organization_name}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${event.proposal_status === 'approved' ? 'bg-green-100 text-green-800' :
                                event.proposal_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {event.proposal_status}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(event.event_start_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">
                                Type: {event.organization_type}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {event.report_status === 'not_applicable' || !event.accomplishment_report_file_name ? (
                                <Button
                                    onClick={() => onSelectEventForReport(event)}
                                    className="w-full"
                                    size="sm"
                                >
                                    Create Report
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <Link
                                        href={`/student-dashboard/reports/${event.id}`}
                                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        View Report
                                    </Link>
                                    <Button
                                        onClick={() => onSelectEventForReport(event)}
                                        variant="outline"
                                        className="w-full"
                                        size="sm"
                                    >
                                        Edit Report
                                    </Button>
                                </div>
                            )}
                            <div className="text-xs text-center text-muted-foreground">
                                ID: {event.id}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* No events match filters */}
            {filteredEvents.length === 0 && events.length > 0 && (
                <div className="bg-white border rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-gray-600">No Events Match Your Filters</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search text or date range.</p>
                    <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
                </div>
            )}
        </div>
    );
};

EventsList.propTypes = {
    events: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        event_name: PropTypes.string.isRequired,
        organization_name: PropTypes.string.isRequired,
        organization_type: PropTypes.string.isRequired,
        event_start_date: PropTypes.string.isRequired,
        proposal_status: PropTypes.string.isRequired,
        report_status: PropTypes.string,
        accomplishment_report_file_name: PropTypes.string
    })).isRequired,
    isLoading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    onRefresh: PropTypes.func.isRequired,
    onSelectEventForReport: PropTypes.func.isRequired,
    onResetFilters: PropTypes.func
};

export default EventsList;
