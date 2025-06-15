// frontend/src/app/(main)/student-dashboard/notifications/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Suspense } from "react"

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsContent />
    </Suspense>
  )
}
