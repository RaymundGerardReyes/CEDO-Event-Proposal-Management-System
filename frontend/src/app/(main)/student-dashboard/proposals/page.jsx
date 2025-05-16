"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ProposalsPageContent() {
    const searchParams = useSearchParams();
    // Your logic using searchParams here

    return (
        <div>
            {/* Your proposals page content */}
            <h1>Student Proposals</h1>
            {/* Example: */}
            <p>Query: {searchParams.get("q")}</p>
        </div>
    );
}

export default function ProposalsPage() {
    return (
        <Suspense fallback={<div>Loading proposals...</div>}>
            <ProposalsPageContent />
        </Suspense>
    );
}
