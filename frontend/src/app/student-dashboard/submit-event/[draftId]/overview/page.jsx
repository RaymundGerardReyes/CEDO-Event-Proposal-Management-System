"use client";

import SubmitEventFlow from '../components/SubmitEventFlow';

export default function OverviewPage({ params }) {
    // The SubmitEventFlow component handles all the logic including:
    // - useDraft hook integration
    // - Section1_Overview rendering
    // - Navigation between sections
    // - Form data management
    // - Error handling
    // - Next.js 15+ params handling with React.use()

    return <SubmitEventFlow params={params} />;
}

