"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";

// Loading component
function EventsLoading() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

// Component that uses useSearchParams
function EventsContent() {
  const { useSearchParams } = require("next/navigation");
  const searchParams = useSearchParams();
  
  const category = searchParams.get("category") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  
  // Rest of your events logic
  
  return (
    <div>
      <div className="mb-4">
        <p>Showing {category} events, page {page}</p>
      </div>
      
      {/* Events list */}
      <div className="grid gap-4">
        {/* Your events */}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        heading="Events" 
        subheading="Browse upcoming events and activities" 
      />
      
      <div className="mt-6">
        <Suspense fallback={<EventsLoading />}>
          <EventsContent />
        </Suspense>
      </div>
    </div>
  );
}
