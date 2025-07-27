"use client";

import { Skeleton } from '@/components/dashboard/student/ui/skeleton';
import { useDraft } from '@/hooks/useDraft';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import Section3_SchoolEvent from './Section3_SchoolEvent.jsx';

export default function SchoolEventPage() {
    const { draftId } = useParams();
    const router = useRouter();

    // Fetch draft data
    const { draft, patch, loading } = useDraft(draftId);
    const [formData, setFormData] = useState({});

    // When the draft loads/changes, prime local form data
    useEffect(() => {
        if (draft) {
            const schoolEventData = draft.form_data?.schoolEvent ||
                draft.payload?.schoolEvent ||
                draft.schoolEvent ||
                {};
            const combinedData = {
                ...draft.payload?.organization,
                ...schoolEventData
            };
            setFormData(combinedData);
        }
    }, [draft]);

    // Auto-save after user stops typing
    useDebouncedCallback(() => {
        if (!loading && draft) {
            patch({ section: 'schoolEvent', payload: { schoolEvent: formData } });
        }
    }, 800, [formData, loading, draft]);

    // Handle input changes
    const handleInputChange = ({ target }) => {
        setFormData((prev) => ({ ...prev, [target.name]: target.value }));
    };

    // Handle file changes
    const handleFileChange = (fileData) => {
        setFormData((prev) => ({ ...prev, ...fileData }));
    };

    // Handle withdraw action
    const handleWithdraw = () => {
        // TODO: Implement withdraw logic
        console.log('Withdraw functionality not implemented yet');
    };

    // Handle next action
    const handleNext = () => {
        router.push(`/main/student-dashboard/submit-event/${draftId}/reporting`);
    };

    // Handle previous action
    const handlePrevious = () => {
        router.push(`/main/student-dashboard/submit-event/${draftId}/event-type`);
    };

    if (loading || !draft) return <Skeleton />;

    return (
        <Section3_SchoolEvent
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onWithdraw={handleWithdraw}
            draftId={draftId}
        />
    );
}

