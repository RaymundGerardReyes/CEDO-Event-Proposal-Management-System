// frontend/src/app/admin-dashboard/notifications/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import NotificationsLoading from './loading';
import NotificationsPageContent from './NotificationsPageContent';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsPageContent />
    </Suspense>
  )
}
