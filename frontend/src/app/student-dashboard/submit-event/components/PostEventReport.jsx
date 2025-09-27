/**
 * Post Event Report Component
 * Event Listing & Report Submission Interface
 * 
 * 🎯 Purpose:
 * - Display list of completed/occurred events
 * - Provide search and filter functionality
 * - Allow users to select events for report submission
 * - Show event status and reporting progress
 * 
 * 🖥️ User Experience Goals:
 * - Easy discovery of completed events
 * - Efficient search and filtering
 * - Clear event status indicators
 * - Quick access to report submission
 */

"use client";

import BackButton from '@/components/BackButton';
import { getApprovedEvents } from '@/services/proposal-service.js';
import {
    AlertCircle,
    Award,
    Calendar,
    Eye,
    FileText,
    Filter,
    MapPin,
    Search,
    Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';


export default function PostEventReport({ onBack, onNavigateToReports }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('all');
    const [selectedReportStatus, setSelectedReportStatus] = useState('all');
    const [selectedDateRange, setSelectedDateRange] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Real data from backend
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userEmail, setUserEmail] = useState(null);

    // Fetch approved events from backend
    useEffect(() => {
        const fetchApprovedEvents = async () => {
            try {
                setIsLoading(true);
                setError(null);

                console.log('📋 Fetching approved events for PostEventReport...');

                // Get user email from localStorage or context if available
                const storedUser = localStorage.getItem('user');
                const email = storedUser ? JSON.parse(storedUser).email : null;
                setUserEmail(email);

                const result = await getApprovedEvents(email);

                if (result.success) {
                    console.log('✅ Approved events loaded:', result.data.length, 'events');
                    setApprovedEvents(result.data);
                } else {
                    console.error('❌ Failed to load approved events:', result.message);
                    setError(result.message || 'Failed to load approved events');
                    setApprovedEvents([]);
                }
            } catch (error) {
                console.error('❌ Error loading approved events:', error);
                setError('Network error while loading events');
                setApprovedEvents([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApprovedEvents();
    }, []);

    // Filter and search logic - now using real data
    const filteredEvents = useMemo(() => {
        return approvedEvents.filter(event => {
            const matchesSearch = event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.report_description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesEventType = selectedEventType === 'all' || event.event_type === selectedEventType;
            const matchesReportStatus = selectedReportStatus === 'all' || event.report_status === selectedReportStatus;

            let matchesDateRange = true;
            if (selectedDateRange !== 'all') {
                const eventDate = new Date(event.event_start_date || event.created_at);
                const now = new Date();
                const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));

                switch (selectedDateRange) {
                    case 'last7days':
                        matchesDateRange = daysDiff <= 7;
                        break;
                    case 'last30days':
                        matchesDateRange = daysDiff <= 30;
                        break;
                    case 'last3months':
                        matchesDateRange = daysDiff <= 90;
                        break;
                    default:
                        matchesDateRange = true;
                }
            }

            return matchesSearch && matchesEventType && matchesReportStatus && matchesDateRange;
        });
    }, [approvedEvents, searchTerm, selectedEventType, selectedReportStatus, selectedDateRange]);

    const handleEventSelect = (event) => {
        // Navigate to report submission form for selected event
        console.log('Selected event for report:', event);

        if (onNavigateToReports) {
            // Pass the event data to the Reports component
            onNavigateToReports(event);
        } else {
            console.warn('onNavigateToReports callback not provided');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Report Pending' },
            submitted: { color: 'bg-blue-100 text-blue-800', text: 'Report Submitted' },
            approved: { color: 'bg-green-100 text-green-800', text: 'Report Approved' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <div className="flex justify-start">
                <BackButton
                    customAction={onBack}
                    showHomeButton={true}
                />
            </div>

            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-6">
                    <FileText className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Approved Events</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Browse and select approved events to submit post-event reports and documentation
                </p>

                {/* Loading/Error States */}
                {isLoading && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                            <span className="text-blue-800">Loading approved events...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                            <span className="text-red-800">{error}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search events by title, organizer, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="h-5 w-5 mr-2" />
                        Filters
                    </button>

                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Back to Overview
                    </button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Event Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                                <select
                                    value={selectedEventType}
                                    onChange={(e) => setSelectedEventType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="Academic Enhancement">Academic Enhancement</option>
                                    <option value="Seminar/Webinar">Seminar/Webinar</option>
                                    <option value="General Assembly">General Assembly</option>
                                    <option value="Leadership Training">Leadership Training</option>
                                    <option value="Community Volunteerism">Community Volunteerism</option>
                                </select>
                            </div>

                            {/* Report Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Report Status</label>
                                <select
                                    value={selectedReportStatus}
                                    onChange={(e) => setSelectedReportStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Report Pending</option>
                                    <option value="submitted">Report Submitted</option>
                                    <option value="approved">Report Approved</option>
                                </select>
                            </div>

                            {/* Date Range Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                <select
                                    value={selectedDateRange}
                                    onChange={(e) => setSelectedDateRange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Dates</option>
                                    <option value="last7days">Last 7 Days</option>
                                    <option value="last30days">Last 30 Days</option>
                                    <option value="last3months">Last 3 Months</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    Showing {filteredEvents.length} of {approvedEvents.length} approved events
                </div>
                <div className="text-sm text-gray-500">
                    {filteredEvents.filter(e => e.report_status === 'pending' || e.report_status === 'not_applicable').length} pending reports
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Event Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.event_name}</h3>
                                {getStatusBadge(event.report_status)}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{event.report_description || 'No description available'}</p>
                        </div>

                        {/* Event Details */}
                        <div className="p-6 space-y-4">
                            {/* Date and Time */}
                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{new Date(event.event_start_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                                {event.event_end_date && (
                                    <>
                                        <span className="mx-2">-</span>
                                        <span>{new Date(event.event_end_date).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                    </>
                                )}
                            </div>

                            {/* Venue */}
                            <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{event.event_venue}</span>
                            </div>

                            {/* Organizer */}
                            <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{event.organization_name}</span>
                            </div>

                            {/* Event Type and Contact */}
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center text-gray-600">
                                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{event.event_type || 'Not specified'}</span>
                                </div>
                                <div className="text-blue-600 font-medium">
                                    {event.organization_type}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Contact Person:</span>
                                    <span className="font-medium">{event.contact_name || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium text-blue-600">{event.contact_email}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Attendance:</span>
                                    <span className="font-medium text-green-600">{event.attendance_count || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleEventSelect(event)}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    {event.report_status === 'pending' || event.report_status === 'not_applicable' ? 'Submit Report' :
                                        event.report_status === 'submitted' ? 'View Report' : 'View Details'}
                                </button>
                                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Eye className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* No Results */}
            {!isLoading && !error && filteredEvents.length === 0 && (
                <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {approvedEvents.length === 0 ? 'No approved events found' : 'No events match your criteria'}
                    </h3>
                    <p className="text-gray-600">
                        {approvedEvents.length === 0
                            ? 'You don\'t have any approved events yet. Complete and submit a proposal to see it here.'
                            : 'Try adjusting your search criteria or filters to find events.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

