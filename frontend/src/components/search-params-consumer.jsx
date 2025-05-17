// File: search-params-consumer.jsx
"use client";

import { Suspense } from "react";

// Component that uses useSearchParams
function SearchParamsConsumer({ children }) {
    // IMPORTANT: Dynamic import
    const { useSearchParams } = require("next/navigation");
    const searchParams = useSearchParams();

    // Call the children function with the searchParams
    return children(searchParams);
}

// Wrapper with Suspense
export function WithSearchParams({ fallback = <div>Loading...</div>, children }) {
    return (
        <Suspense fallback={fallback}>
            <SearchParamsConsumer>
                {(searchParams) => children(searchParams)}
            </SearchParamsConsumer>
        </Suspense>
    );
}