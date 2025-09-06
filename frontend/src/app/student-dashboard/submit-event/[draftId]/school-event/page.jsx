"use client";

import SubmitEventFlow from '../components/SubmitEventFlow';

export default function SchoolEventPage({ params }) {
    // The SubmitEventFlow component handles all the logic including:
    // - useDraft hook integration
    // - School event form rendering
    // - Navigation between sections
    // - Form data management
    // - Error handling

    return <SubmitEventFlow params={params} />;
}







