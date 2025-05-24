// frontend/src/components/dashboard/student/header.jsx
"use client";

import { Avatar, AvatarFallback } from "@/components/dashboard/student/ui/avatar"; // Removed AvatarImage as it was not used
import {
  AlertCircle as AlertCircleIcon,
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  LogOut,
  Settings,
  User, // Renamed to avoid conflict
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context"; // Import the useAuth hook
import { useRouter } from "next/navigation"; // Import the useRouter hook

const Header = () => {
  const { user: authUser, signOut } = useAuth(); // Get user from context
  const router = useRouter(); // Use router for navigation
  const [notificationCount, setNotificationCount] = useState(2);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([
    {
      id: "notif1", // Added id for key prop
      type: "info",
      title: "New feature available",
      message: "Check out the new dashboard view. Pages now load faster.",
      time: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
    },
    {
      id: "notif2", // Added id for key prop
      type: "success",
      title: "Event approved",
      message: 'Your event "Community Workshop" has been approved.',
      time: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
    },
  ]);

  const [allNotifications, setAllNotifications] = useState([
    {
      id: "allNotif1", // Added id for key prop
      type: "info",
      title: "New feature available",
      message: "Check out the new dashboard view. Pages now load faster.",
      time: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
    },
    {
      id: "allNotif2", // Added id for key prop
      type: "success",
      title: "Event approved",
      message: 'Your event "Community Workshop" has been approved.',
      time: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: "allNotif3", // Added id for key prop
      type: "warning",
      title: "Deadline approaching",
      message: "The submission deadline for your event is in 3 days.",
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "allNotif4", // Added id for key prop
      type: "error",
      title: "Form submission failed",
      message: "Please check your internet connection and try again.",
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "allNotif5", // Added id for key prop
      type: "success",
      title: "Report generated",
      message: "Your monthly activity report has been generated.",
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "allNotif6", // Added id for key prop
      type: "info",
      title: "System maintenance",
      message: "The system will be down for maintenance on Sunday at 2 AM.",
      time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "allNotif7", // Added id for key prop
      type: "success",
      title: "Profile updated",
      message: "Your profile information has been updated successfully.",
      time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ]);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!isUserMenuOpen && !notificationPanelOpen) return; // Only add listener if a panel is open

    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('[aria-controls="user-menu"]') && !event.target.closest('#user-menu-content')) {
        setIsUserMenuOpen(false);
      }
      if (notificationPanelOpen && !event.target.closest('[aria-controls="notification-panel"]') && !event.target.closest('#notification-panel-content')) {
        setNotificationPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen, notificationPanelOpen]);


  const getNotificationTypeStyles = (type) => {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-600";
      case "success":
        return "bg-green-100 text-green-600";
      case "warning":
        return "bg-yellow-100 text-yellow-600";
      case "error":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <AlertCircleIcon className="h-4 w-4" />;
      case "calendar":
        return <Calendar className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatNotificationTime = (time) => {
    const now = new Date();
    const diffMs = now - new Date(time);
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSecs < 60) {
      return `${diffSecs} second${diffSecs !== 1 ? "s" : ""} ago`;
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(); // Call the signOut function from the auth context
        console.log("Logging out...");
        router.push("/sign-in"); // Redirect to the sign-in page after logging out
      } catch (error) {
        console.error("Logout error:", error);
        // Optionally, show a toast or alert for logout failure
      }
    }
  };

  const markAllAsRead = () => {
    setNotificationCount(0);
    setRecentNotifications(recentNotifications.map((n) => ({ ...n, read: true })));
    setAllNotifications(allNotifications.map((n) => ({ ...n, read: true })));
  };

  const displayedNotifications = showAllNotifications ? allNotifications : recentNotifications;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex-1"></div> {/* Spacer */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative">
          <button
            id="notification-button"
            className="inline-flex items-center justify-center rounded-full p-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative"
            aria-label={`${notificationCount > 0 ? notificationCount : 'No'} unread notifications`}
            aria-haspopup="true"
            aria-expanded={notificationPanelOpen}
            aria-controls="notification-panel-content"
            onClick={() => {
              setNotificationPanelOpen(!notificationPanelOpen);
              if (!notificationPanelOpen) setShowAllNotifications(false); // Reset to recent view when opening
            }}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {notificationCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white"
                aria-hidden="true"
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {notificationPanelOpen && (
            <div
              id="notification-panel-content"
              className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-md border bg-background shadow-lg z-50"
              role="menu"
              aria-labelledby="notification-button"
            >
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-medium">{showAllNotifications ? "All Notifications" : "Recent Notifications"}</h3>
                <div className="flex gap-2">
                  {(recentNotifications.some(n => !n.read) || allNotifications.some(n => !n.read)) && notificationCount > 0 && (
                    <button className="text-xs text-muted-foreground hover:text-foreground" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  )}
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setNotificationPanelOpen(false)}
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {displayedNotifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <BellOff className="h-5 w-5 mx-auto mb-2" />
                  <p>No notifications</p>
                </div>
              ) : (
                <ul className="py-1" role="none">
                  {displayedNotifications.map((notification) => (
                    <li key={notification.id} className={`px-4 py-3 hover:bg-muted ${!notification.read ? "bg-muted/40" : ""}`} role="menuitem">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${getNotificationTypeStyles(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatNotificationTime(notification.time)}
                          </p>
                        </div>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0"></div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="p-2 border-t">
                <button
                  className="w-full rounded-md p-2 text-center text-sm hover:bg-muted flex items-center justify-center gap-1"
                  onClick={() => setShowAllNotifications(!showAllNotifications)}
                  role="menuitem"
                >
                  {showAllNotifications ? (
                    <>
                      <span>Show recent notifications</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>View all notifications</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            id="user-menu-button"
            className="flex items-center gap-2 rounded-full p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label="Open user menu"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            aria-controls="user-menu-content"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-[#0c2d6b] text-white">
                {authUser?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "JD"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline font-medium truncate max-w-[120px] text-sm">{authUser?.name || "User"}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {isUserMenuOpen && (
            <div
              id="user-menu-content"
              className="absolute right-0 mt-2 w-56 rounded-md border bg-background shadow-lg z-50"
              role="menu"
              aria-labelledby="user-menu-button"
            >
              <div className="py-2 px-3 border-b">
                <p className="text-sm font-medium truncate">{authUser?.name || "John Doe"}</p>
                <p className="text-xs text-muted-foreground truncate">{authUser?.role || "User Role"}</p>
              </div>

              <div className="py-1" role="none">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </div>

              <div className="border-t py-1" role="none">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                  role="menuitem"
                  onClick={(event) => {
                    event.preventDefault();
                    setIsUserMenuOpen(false);
                    handleLogout(); // Call the updated handleLogout function
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;