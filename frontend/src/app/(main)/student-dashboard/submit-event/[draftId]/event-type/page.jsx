"use client";

import { useRouter } from 'next/navigation';
import { use } from 'react';

import EventTypeSelection from './EventTypeSelection.jsx';

export default function EventTypePage({ params }) {
    const router = useRouter();
    const { draftId } = use(params);

    const handleSelect = (mappedType) => {
        // For now we simply forward to organization step; you can store the type later.
        router.push(`/student-dashboard/submit-event/${draftId}/organization`);
    };

    const handlePrevious = () => {
        router.push(`/student-dashboard/submit-event/${draftId}/overview`);
    };

    return (
        <EventTypeSelection onSelect={handleSelect} onPrevious={handlePrevious} />
    );
}

