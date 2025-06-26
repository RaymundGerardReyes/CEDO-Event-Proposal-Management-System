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

    // Keep local state unconditional so hook order stays stable
    const [formData, setFormData] = useState({});

    // When the draft loads/changes, prime local form data
    useEffect(() => {
        if (draft) {
            setFormData(draft.payload?.schoolEvent ?? {});
        }
    }, [draft]);

    // Auto-save after user stops typing
    useDebouncedCallback(() => {
        if (!loading && draft) {
            patch({ section: 'school-event', payload: formData });
        }
    }, 800, [formData, loading, draft]);

    if (loading || !draft) return <Skeleton />;

    return (
        <Section3_SchoolEvent
            formData={formData}
            onChange={(u) => setFormData((prev) => ({ ...prev, ...u }))}
            onPrevious={() => router.push(`/student-dashboard/submit-event/${draftId}/organization`)}
            onNext={() => router.push(`/student-dashboard/submit-event/${draftId}/reporting`)}
            // Pass through handlers expected by Section3 for files
            handleInputChange={({ target }) => setFormData((p) => ({ ...p, [target.name]: target.value }))}
            handleFileChange={() => { }}
        />
    );
}

