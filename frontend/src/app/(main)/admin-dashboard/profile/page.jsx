// frontend/src/app/(main)/admin-dashboard/profile/page.jsx

"use client" // Keep this if the whole page structure relies on client interactions

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// src/app/(main)/admin-dashboard/profile/page.jsx
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react'; // Import Suspense
// import SomeOtherComponent from '@/components/SomeOtherComponent'; // Keep if used
import { PageHeader } from "@/components/dashboard/admin/page-header";

// Loading component for the profile content
function ProfileContentLoading() {
  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div> {/* Simulating h2 */}
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div> {/* Simulating p */}
      <div className="space-y-4">
        <div>
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2"></div> {/* Simulating h3 */}
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div> {/* Simulating p */}
        </div>
      </div>
    </div>
  );
}

// This is the new client component that will use useSearchParams
function ProfileSectionContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'personal'; // Get section using useSearchParams

  // You can add useEffect here if you need to perform actions when 'section' changes
  // useEffect(() => {
  //   console.log("Current section:", section);
  // }, [section]);

  return (
    <div className="mt-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Admin Profile</h2>
        <p className="mb-4">Current section: {section}</p>
        {/* Profile content would go here based on the section */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Personal Information (Section: {section})</h3>
            <p className="text-muted-foreground">
              Your admin details for section '{section}' would appear here.
            </p>
          </div>
          {/* Example of conditional rendering based on section */}
          {section === 'security' && (
            <div>
              <h3 className="font-medium">Security Settings</h3>
              <p className="text-muted-foreground">Security details here.</p>
            </div>
          )}
        </div>
        {/* {SomeOtherComponent && <SomeOtherComponent />} */}
      </div>
    </div>
  );
}

// The default export must be a client component and wrap everything in Suspense
export default function AdminProfilePage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader heading="Admin Profile" subheading="View and update your admin profile information" />
      {/* Suspense must be at the page level */}
      <Suspense fallback={<ProfileContentLoading />}>
        <ProfileSectionContent />
      </Suspense>
    </div>
  );
}