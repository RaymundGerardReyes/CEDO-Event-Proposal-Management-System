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

import {
    AlertCircle,
    Award,
    Calendar,
    Clock,
    Eye,
    FileText,
    Filter,
    MapPin,
    Search,
    Users
} from 'lucide-react';
import { useMemo, useState } from 'react';

// Mock data for completed events - in real app, this would come from API
const MOCK_COMPLETED_EVENTS = [
    {
        id: 'evt-001',
        title: 'Community Health Seminar for SLP Scholars',
        date: '2024-01-15',
        time: '09:00 AM - 12:00 PM',
        venue: 'Main Auditorium',
        organizer: 'SLP Scholars Association',
        eventType: 'Academic Enhancement',
        targetAudience: ['1st Year', '2nd Year'],
        expectedParticipants: 150,
        actualParticipants: 142,
        status: 'completed',
        reportStatus: 'pending', // pending, submitted, approved
        sdpCredits: 2,
        description: 'A comprehensive seminar on community health practices and their impact on student learning.'
    },
    {
        id: 'evt-002',
        title: 'Leadership Training Workshop',
        date: '2024-01-20',
        time: '02:00 PM - 05:00 PM',
        venue: 'Conference Room A',
        organizer: 'Student Leadership Council',
        eventType: 'Leadership Training',
        targetAudience: ['Leaders', '3rd Year', '4th Year'],
        expectedParticipants: 50,
        actualParticipants: 48,
        status: 'completed',
        reportStatus: 'submitted',
        sdpCredits: 1,
        description: 'Interactive workshop focusing on leadership skills and team management.'
    },
    {
        id: 'evt-003',
        title: 'Environmental Awareness Campaign',
        date: '2024-01-25',
        time: '08:00 AM - 04:00 PM',
        venue: 'Campus Grounds',
        organizer: 'Environmental Awareness Group',
        eventType: 'Community Volunteerism',
        targetAudience: ['All Levels'],
        expectedParticipants: 200,
        actualParticipants: 185,
        status: 'completed',
        reportStatus: 'approved',
        sdpCredits: 2,
        description: 'Campus-wide environmental awareness campaign with tree planting and waste management activities.'
    },
    {
        id: 'evt-004',
        title: 'Technology Innovation Seminar',
        date: '2024-02-01',
        time: '10:00 AM - 03:00 PM',
        venue: 'Computer Lab 1',
        organizer: 'Technology Innovation Club',
        eventType: 'Seminar/Webinar',
        targetAudience: ['2nd Year', '3rd Year', '4th Year'],
        expectedParticipants: 80,
        actualParticipants: 75,
        status: 'completed',
        reportStatus: 'pending',
        sdpCredits: 1,
        description: 'Exploring latest technology trends and their applications in academic settings.'
    },
    {
        id: 'evt-005',
        title: 'Cultural Heritage Festival',
        date: '2024-02-05',
        time: '06:00 PM - 10:00 PM',
        venue: 'Cultural Center',
        organizer: 'Cultural Heritage Society',
        eventType: 'General Assembly',
        targetAudience: ['All Levels', 'Alumni'],
        expectedParticipants: 300,
        actualParticipants: 275,
        status: 'completed',
        reportStatus: 'submitted',
        sdpCredits: 2,
        description: 'Celebration of cultural diversity with performances, food, and traditional activities.'
    }
];

export default function PostEventReport({ onBack }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('all');
    const [selectedReportStatus, setSelectedReportStatus] = useState('all');
    const [selectedDateRange, setSelectedDateRange] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Filter and search logic
    const filteredEvents = useMemo(() => {
        return MOCK_COMPLETED_EVENTS.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesEventType = selectedEventType === 'all' || event.eventType === selectedEventType;
            const matchesReportStatus = selectedReportStatus === 'all' || event.reportStatus === selectedReportStatus;

            let matchesDateRange = true;
            if (selectedDateRange !== 'all') {
                const eventDate = new Date(event.date);
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
    }, [searchTerm, selectedEventType, selectedReportStatus, selectedDateRange]);

    const handleEventSelect = (eventId) => {
        // Navigate to report submission form for selected event
        console.log('Selected event for report:', eventId);
        // In real app, this would navigate to a report form for the specific event
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
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-6">
                    <FileText className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Completed Events</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Browse and select completed events to submit post-event reports and documentation
                </p>
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
                    Showing {filteredEvents.length} of {MOCK_COMPLETED_EVENTS.length} completed events
                </div>
                <div className="text-sm text-gray-500">
                    {filteredEvents.filter(e => e.reportStatus === 'pending').length} pending reports
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Event Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                                {getStatusBadge(event.reportStatus)}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                        </div>

                        {/* Event Details */}
                        <div className="p-6 space-y-4">
                            {/* Date and Time */}
                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{new Date(event.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                                <Clock className="h-4 w-4 ml-4 mr-2 text-gray-400" />
                                <span>{event.time}</span>
                            </div>

                            {/* Venue */}
                            <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{event.venue}</span>
                            </div>

                            {/* Organizer */}
                            <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{event.organizer}</span>
                            </div>

                            {/* Event Type and SDP Credits */}
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center text-gray-600">
                                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{event.eventType}</span>
                                </div>
                                <div className="text-blue-600 font-medium">
                                    {event.sdpCredits} SDP Credit{event.sdpCredits > 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Target Audience */}
                            <div className="flex flex-wrap gap-1">
                                {event.targetAudience.map((audience, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                        {audience}
                                    </span>
                                ))}
                            </div>

                            {/* Participation Stats */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Expected Participants:</span>
                                    <span className="font-medium">{event.expectedParticipants}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Actual Participants:</span>
                                    <span className="font-medium text-green-600">{event.actualParticipants}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Attendance Rate:</span>
                                    <span className="font-medium text-blue-600">
                                        {Math.round((event.actualParticipants / event.expectedParticipants) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleEventSelect(event.id)}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    {event.reportStatus === 'pending' ? 'Submit Report' :
                                        event.reportStatus === 'submitted' ? 'View Report' : 'View Details'}
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
            {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria or filters to find events.</p>
                </div>
            )}
        </div>
    );
}
