"use client";

import SubmitEventFlow from '../components/SubmitEventFlow';

export default function OrganizationPage({ params }) {
    // The SubmitEventFlow component handles all the logic including:
    // - useDraft hook integration
    // - OrganizationSection rendering
    // - Navigation between sections
    // - Form data management
    // - Error handling

    return <SubmitEventFlow params={params} />;
}

