"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OverviewHeader from './components/OverviewHeader';
import EventsList from './components/EventsList';

export default function OverviewPage({ params }) {
    const router = useRouter();
    const { draftId } = useParams();
    const [hasActiveProposal, setHasActiveProposal] = useState(false);
    const [proposalStatus, setProposalStatus] = useState('draft');
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check for active proposal
    useEffect(() => {
        const checkActiveProposal = () => {
            try {
                const eventTypeSelection = localStorage.getItem('eventTypeSelection');
                const eventProposalFormData = localStorage.getItem('eventProposalFormData');
                
                if (eventTypeSelection || eventProposalFormData) {
                    setHasActiveProposal(true);
                    
                    // Try to get status from localStorage
                    const selectionData = eventTypeSelection ? JSON.parse(eventTypeSelection) : {};
                    const formData = eventProposalFormData ? JSON.parse(eventProposalFormData) : {};
                    
                    setProposalStatus(formData.status || selectionData.status || 'draft');
                }
            } catch (error) {
                console.warn('Error checking active proposal:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkActiveProposal();
    }, []);

    // Load events data
    useEffect(() => {
        const loadEvents = async () => {
            try {
                // Mock events data - replace with actual API call
                const mockEvents = [
                    {
                        id: 1,
                        title: 'Academic Workshop 2024',
                        date: '2024-12-15',
                        status: 'approved',
                        type: 'school-based'
                    },
                    {
                        id: 2,
                        title: 'Community Outreach Program',
                        date: '2024-12-20',
                        status: 'approved',
                        type: 'community-based'
                    }
                ];
                setEvents(mockEvents);
            } catch (error) {
                console.error('Error loading events:', error);
            }
        };

        loadEvents();
    }, []);

    const handleStartProposal = () => {
        // Clear any existing data
        localStorage.removeItem('eventTypeSelection');
        localStorage.removeItem('eventProposalFormData');
        
        // Navigate to event type selection
        router.push(`/student-dashboard/submit-event/${draftId}/event-type`);
    };

    const handleContinueEditing = () => {
        // Navigate to the appropriate step based on existing data
        const eventTypeSelection = localStorage.getItem('eventTypeSelection');
        if (eventTypeSelection) {
            const data = JSON.parse(eventTypeSelection);
            if (data.eventType === 'school-based') {
                router.push(`/student-dashboard/submit-event/${draftId}/school-event`);
            } else if (data.eventType === 'community-based') {
                router.push(`/student-dashboard/submit-event/${draftId}/community-event`);
            } else {
                router.push(`/student-dashboard/submit-event/${draftId}/event-type`);
            }
        } else {
            router.push(`/student-dashboard/submit-event/${draftId}/event-type`);
        }
    };

    const handleViewProposal = () => {
        // Navigate to reporting section to view proposal
        router.push(`/student-dashboard/submit-event/${draftId}/reporting`);
    };

    const handleEventSelect = (eventId) => {
        // Handle event selection for reports
        console.log('Selected event:', eventId);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading overview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Event Proposal Overview
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage your event proposals and track their status
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Draft ID</p>
                            <p className="text-sm font-medium text-gray-900">
                                {draftId}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-8">
                    {/* Overview Header */}
                    <OverviewHeader
                        hasActiveProposal={hasActiveProposal}
                        proposalStatus={proposalStatus}
                        onStartProposal={handleStartProposal}
                        onContinueEditing={handleContinueEditing}
                        onViewProposal={handleViewProposal}
                    />

                    {/* Events List */}
                    <EventsList
                        events={events}
                        isLoading={false}
                        error={null}
                        onEventSelect={handleEventSelect}
                    />
                </div>
            </div>
        </div>
    );
}

