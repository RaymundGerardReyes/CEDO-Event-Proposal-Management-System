"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { PageHeader } from "@/components/page-header";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Loading component
function NewProposalLoading() {
  return (
    <div className="p-4 border rounded-lg animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
}

// Component that uses useSearchParams
function NewProposalContent() {
  const searchParams = useSearchParams()

  const type = searchParams.get("type") || "standard"
  const template = searchParams.get("template")

  // Rest of your new proposal logic

  return (
    <div>
      <div className="mb-6">
        <p>Creating new {type} proposal {template ? `using template: ${template}` : ""}</p>
      </div>

      {/* New proposal form */}
      <form className="space-y-4">
        {/* Your form fields */}
        <div className="p-4 bg-gray-50 rounded">
          <p>Form fields for {type} proposal would go here...</p>
          {template && <p>Using template: {template}</p>}
        </div>
      </form>
    </div>
  )
}

// Main export with Suspense boundary
export default function NewProposalPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="New Proposal"
        subheading="Create a new proposal"
      />

      <div className="mt-6">
        <Suspense fallback={<NewProposalLoading />}>
          <NewProposalContent />
        </Suspense>
      </div>
    </div>
  )
}
