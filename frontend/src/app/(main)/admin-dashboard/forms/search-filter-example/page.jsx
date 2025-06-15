// frontend/src/app/(main)/admin-dashboard/forms/search-filter-example/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Suspense } from "react"
import SearchFilterExamplePageContent from "./SearchFilterExamplePageContent"

export default function SearchFilterExamplePage() {
  return (
    <Suspense fallback={<div>Loading search/filter...</div>}>
      <SearchFilterExamplePageContent />
    </Suspense>
  )
}
