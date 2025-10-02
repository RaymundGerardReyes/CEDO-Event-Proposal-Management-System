// frontend/src/components/dashboard/student/header.jsx
"use client";

import { useEffect } from 'react';
import NotificationPanel from "../../headerComponents/NotificationPanel";
import UserMenu from "./UserMenu";
// Dev-only admin notifications debugger (side-effect import)
if (process.env.NODE_ENV === 'development') {
  // Importing ensures the debugger auto-runs on admin routes
  import('@/lib/admin-notification-debugger').catch(() => { });
}

const Header = () => {
  // Auth context available for future use if needed
  // Force an initial notifications refresh when admin header mounts
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications:refresh'));
      }
    } catch (_) { }
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b bg-background px-3 sm:px-4 md:px-6">
      <div className="flex-1"></div> {/* Spacer */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {/* Clean Notification Panel */}
        <NotificationPanel />

        {/* Clean User Menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;