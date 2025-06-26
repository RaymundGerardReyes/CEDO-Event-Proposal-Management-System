"use client";

import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import Section2_OrgInfo from './Section2_OrgInfo.jsx';

export default function OrgInfoPage({ params }) {
    const router = useRouter();
    const { draftId } = use(params);

    // Hold local draft data (can be enhanced to fetch real draft via API)
    const [formData, setFormData] = useState({});

    const handleChange = (updates) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const handleNext = (organizationType = 'school-based') => {
        const nextSlug = organizationType === 'community-based' ? 'community-event' : 'school-event';
        router.push(`/student-dashboard/submit-event/${draftId}/${nextSlug}`);
    };

    const handlePrevious = () => {
        router.push(`/student-dashboard/submit-event/${draftId}/event-type`);
    };

    const handleWithdraw = () => {
        // Go back to overview (or implement delete logic later)
        router.push(`/student-dashboard/submit-event/${draftId}/overview`);
    };

    return (
        <Section2_OrgInfo
            formData={formData}
            onChange={handleChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onWithdraw={handleWithdraw}
        />
    );
}

