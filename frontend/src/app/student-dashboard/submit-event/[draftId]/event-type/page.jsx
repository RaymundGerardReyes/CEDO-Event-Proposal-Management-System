"use client";

import { useToast } from '@/hooks/use-toast';
import { saveEventTypeSelection } from '@/lib/draft-api';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { EventTypeDebugger } from '../debug';
import EventTypeSelection from './EventTypeSelection.jsx';

export default function EventTypePage() {
    const router = useRouter();
    const { draftId } = useParams();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSelect = async (mappedType) => {
        if (isSaving) return; // Prevent multiple submissions

        setIsSaving(true);

        try {
            console.log('🎯 EventTypePage: Saving event type selection:', mappedType);

            // ✅ ENHANCED: Save the event type selection to the database with retry logic
            let retryCount = 0;
            const maxRetries = 2;

            while (retryCount <= maxRetries) {
                try {
                    await saveEventTypeSelection(draftId, mappedType);
                    console.log('✅ Event type selection saved successfully');
                    break; // Success, exit retry loop
                } catch (error) {
                    retryCount++;
                    console.log(`❌ Attempt ${retryCount} failed:`, error.message);

                    if (retryCount > maxRetries) {
                        throw error; // Re-throw if all retries failed
                    }

                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }

            // ✅ ENHANCED: Also save to localStorage for immediate access by other sections
            try {
                const eventTypeData = {
                    eventType: mappedType,
                    selectedEventType: mappedType,
                    draftId: draftId,
                    timestamp: Date.now()
                };

                // Save to multiple localStorage keys for compatibility
                localStorage.setItem('eventTypeSelection', JSON.stringify(eventTypeData));
                localStorage.setItem('selectedEventType', mappedType);

                // Also update existing form data if it exists
                const existingFormData = localStorage.getItem('eventProposalFormData');
                if (existingFormData) {
                    const parsed = JSON.parse(existingFormData);
                    const updatedFormData = {
                        ...parsed,
                        eventType: mappedType,
                        selectedEventType: mappedType
                    };
                    localStorage.setItem('eventProposalFormData', JSON.stringify(updatedFormData));
                }

                // ✅ CRITICAL FIX: Save to unified storage structure
                const { updateDraftSection } = await import('@/lib/utils/eventProposalStorage');
                updateDraftSection('eventType', {
                    eventType: mappedType,
                    selectedEventType: mappedType
                }, draftId);

                console.log('✅ Event type saved to localStorage and unified storage:', eventTypeData);
            } catch (localStorageError) {
                console.warn('⚠️ Failed to save to localStorage:', localStorageError);
            }

            // Show success message
            toast({
                title: "Event Type Saved",
                description: `Your selection has been saved successfully.`,
                variant: "default",
            });

            // 🔧 FIXED: Route to organization section first, then to appropriate event section
            // Flow: event-type → organization → SchoolEvent/CommunityEvent → reporting
            const targetRoute = `/student-dashboard/submit-event/${draftId}/organization`;
            console.log('🎯 Routing to Organization section first:', targetRoute);
            console.log('📋 Organization will then route to appropriate event section based on type:', mappedType);

            router.push(targetRoute);
        } catch (error) {
            console.error('❌ Failed to save event type selection:', error);

            // ✅ ENHANCED: Provide specific error messages based on error type
            let errorMessage = "Failed to save event type selection.";
            let errorDescription = "Please try again or contact support if the problem persists.";

            if (error.message.includes('Draft not found')) {
                errorMessage = "Draft not found";
                errorDescription = "Please start a new event proposal and try again.";
            } else if (error.message.includes('Invalid event type')) {
                errorMessage = "Invalid event type";
                errorDescription = "Please select either 'School-based' or 'Community-based' event.";
            } else if (error.message.includes('Server error')) {
                errorMessage = "Server error";
                errorDescription = "Please try again in a few moments.";
            }

            // 🔧 ENHANCED: Still save to localStorage even if backend save fails
            try {
                const eventTypeData = {
                    eventType: mappedType,
                    selectedEventType: mappedType,
                    draftId: draftId,
                    timestamp: Date.now()
                };

                localStorage.setItem('eventTypeSelection', JSON.stringify(eventTypeData));
                localStorage.setItem('selectedEventType', mappedType);

                // Update existing form data
                const existingFormData = localStorage.getItem('eventProposalFormData');
                if (existingFormData) {
                    const parsed = JSON.parse(existingFormData);
                    const updatedFormData = {
                        ...parsed,
                        eventType: mappedType,
                        selectedEventType: mappedType
                    };
                    localStorage.setItem('eventProposalFormData', JSON.stringify(updatedFormData));
                }

                // ✅ CRITICAL FIX: Save to unified storage structure even if backend fails
                const { updateDraftSection } = await import('@/lib/utils/eventProposalStorage');
                updateDraftSection('eventType', {
                    eventType: mappedType,
                    selectedEventType: mappedType
                }, draftId);

                console.log('✅ Event type saved to localStorage and unified storage (backend failed):', eventTypeData);
            } catch (localStorageError) {
                console.warn('⚠️ Failed to save to localStorage:', localStorageError);
            }

            // Show error message with specific guidance
            toast({
                title: errorMessage,
                description: errorDescription,
                variant: "destructive",
            });

            // 🔧 ENHANCED: Only route if it's a recoverable error
            if (error.message.includes('Draft not found')) {
                // For draft not found, redirect to overview to create new draft
                router.push(`/student-dashboard/submit-event/${draftId}/overview`);
            } else {
                // For other errors, still allow proceeding
                const targetRoute = `/student-dashboard/submit-event/${draftId}/organization`;
                console.log('🎯 Routing to Organization section (save failed):', targetRoute);
                router.push(targetRoute);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrevious = () => {
        router.push(`/student-dashboard/submit-event/${draftId}/overview`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* 🔍 DEBUG: Add Event Type Debugger */}
                <EventTypeDebugger draftId={draftId} />

                <EventTypeSelection
                    onSelect={handleSelect}
                    onPrevious={handlePrevious}
                    isSaving={isSaving}
                />
            </div>
        </div>
    );
}

