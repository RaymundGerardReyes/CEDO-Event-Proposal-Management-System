// frontend/src/components/dashboard/student/header.jsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/student/ui/avatar";
import { useAuth } from "@/contexts/auth-context"; // Import the useAuth hook
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
import { useRouter } from "next/navigation"; // Import the useRouter hook
import { useEffect, useState } from "react";

const Header = () => {
  const { user: authUser, signOut } = useAuth(); // Get user from context
  const router = useRouter(); // Use router for navigation
  const [notificationCount, setNotificationCount] = useState(2);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false); // Track image loading errors
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

  // Enhanced function to get optimized Google profile picture URL
  const getOptimizedProfileImage = (user) => {
    if (!user) return null;

    // Check multiple possible sources for profile picture
    const possibleSources = [
      user.user_metadata?.avatar_url,
      user.user_metadata?.picture,
      user.user_metadata?.profile_picture,
      user.raw_user_meta_data?.avatar_url,
      user.raw_user_meta_data?.picture,
      user.raw_user_meta_data?.profile_picture,
      user.picture,
      user.avatar_url,
      user.profile_picture
    ];

    for (const source of possibleSources) {
      if (source && typeof source === 'string') {
        // Optimize Google profile pictures for better quality and performance
        if (source.includes('googleusercontent.com')) {
          // Remove existing size parameters and add optimized ones
          const baseUrl = source.split('=')[0];
          return `${baseUrl}=s400-c`; // 400x400 pixels, cropped to square
        }

        // Return other profile pictures as-is
        return source;
      }
    }

    return null;
  };

  // Enhanced function to get user display name
  const getUserDisplayName = (user) => {
    if (!user) return "User";

    const possibleNames = [
      user.user_metadata?.full_name,
      user.user_metadata?.name,
      user.raw_user_meta_data?.full_name,
      user.raw_user_meta_data?.name,
      user.name,
      user.full_name,
      user.email?.split('@')[0] // Fallback to email username
    ];

    for (const name of possibleNames) {
      if (name && typeof name === 'string' && name.trim()) {
        return name.trim();
      }
    }

    return "User";
  };

  // Enhanced function to get user initials
  const getUserInitials = (user) => {
    const displayName = getUserDisplayName(user);

    if (displayName === "User") return "U";

    const nameParts = displayName.split(' ').filter(part => part.length > 0);

    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    return displayName.substring(0, 2).toUpperCase();
  };

  // Check if user is authenticated via Google OAuth
  const isGoogleAuth = (user) => {
    if (!user) return false;

    const provider = user.app_metadata?.provider || user.user_metadata?.provider;
    const providers = user.app_metadata?.providers || [];

    return provider === 'google' || providers.includes('google') ||
      (user.email && user.user_metadata?.avatar_url?.includes('googleusercontent.com'));
  };

  const profileImageUrl = getOptimizedProfileImage(authUser);
  const displayName = getUserDisplayName(authUser);
  const userInitials = getUserInitials(authUser);
  const isFromGoogle = isGoogleAuth(authUser);

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
        return <Info className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "success":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "error":
        return <AlertCircleIcon className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "calendar":
        return <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "document":
        return <FileText className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Bell className="h-3 w-3 sm:h-4 sm:w-4" />;
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

  /**
   * DOCS: This function handles the user logout process.
   * It no longer shows a confirmation dialog.
   * It directly calls the signOut method from the authentication context,
   * logs any errors, and redirects to the sign-in page.
   */
  const handleLogout = async () => {
    try {
      await signOut(); // Call the signOut function from the auth context
      console.log("Logging out...");
      router.push("/sign-in"); // Redirect to the sign-in page after logging out
    } catch (error) {
      console.error("Logout error:", error);
      // Optionally, show a toast or alert for logout failure
    }
  };

  const markAllAsRead = () => {
    setNotificationCount(0);
    setRecentNotifications(recentNotifications.map((n) => ({ ...n, read: true })));
    setAllNotifications(allNotifications.map((n) => ({ ...n, read: true })));
  };

  const displayedNotifications = showAllNotifications ? allNotifications : recentNotifications;

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b bg-background px-3 sm:px-4 md:px-6">
      <div className="flex-1"></div> {/* Spacer */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {/* Enhanced Notification Panel */}
        <div className="relative">
          <button
            id="notification-button"
            className="inline-flex items-center justify-center rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]"
            aria-label={`${notificationCount > 0 ? notificationCount : 'No'} unread notifications`}
            aria-haspopup="true"
            aria-expanded={notificationPanelOpen}
            aria-controls="notification-panel-content"
            onClick={() => {
              setNotificationPanelOpen(!notificationPanelOpen);
              if (!notificationPanelOpen) setShowAllNotifications(false); // Reset to recent view when opening
            }}
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            {notificationCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white"
                aria-hidden="true"
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {notificationPanelOpen && (
            <div
              id="notification-panel-content"
              className="absolute right-0 mt-2 w-[320px] sm:w-80 max-h-[70vh] overflow-y-auto rounded-lg sm:rounded-xl border bg-background shadow-lg z-50"
              role="menu"
              aria-labelledby="notification-button"
            >
              {/* Enhanced Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                <h3 className="font-medium text-sm sm:text-base">{showAllNotifications ? "All Notifications" : "Recent Notifications"}</h3>
                <div className="flex gap-1 sm:gap-2">
                  {(recentNotifications.some(n => !n.read) || allNotifications.some(n => !n.read)) && notificationCount > 0 && (
                    <button className="text-xs sm:text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  )}
                  <button
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground p-1 rounded transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                    onClick={() => setNotificationPanelOpen(false)}
                    aria-label="Close notifications"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>

              {/* Enhanced Notification List */}
              {displayedNotifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground">
                  <BellOff className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base">No notifications</p>
                </div>
              ) : (
                <ul className="py-1" role="none">
                  {displayedNotifications.map((notification) => (
                    <li key={notification.id} className={`px-3 sm:px-4 py-3 hover:bg-muted transition-colors ${!notification.read ? "bg-muted/40" : ""}`} role="menuitem">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className={`rounded-full p-1.5 sm:p-2 flex-shrink-0 ${getNotificationTypeStyles(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatNotificationTime(notification.time)}
                          </p>
                        </div>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1"></div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Enhanced Footer */}
              <div className="p-2 border-t">
                <button
                  className="w-full rounded-lg p-2 sm:p-3 text-center text-xs sm:text-sm hover:bg-muted flex items-center justify-center gap-1 sm:gap-2 transition-colors min-h-[40px]"
                  onClick={() => setShowAllNotifications(!showAllNotifications)}
                  role="menuitem"
                >
                  {showAllNotifications ? (
                    <>
                      <span>Show recent notifications</span>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    </>
                  ) : (
                    <>
                      <span>View all notifications</span>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced User Menu with Google Profile Picture Support */}
        <div className="relative">
          <button
            id="user-menu-button"
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl p-1 sm:p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 min-h-[40px] sm:min-h-[44px]"
            aria-label="Open user menu"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            aria-controls="user-menu-content"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            {/* Enhanced Avatar with Google Profile Picture Support */}
            <div className="relative h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
              <Avatar className="h-full w-full border border-border">
                {profileImageUrl && !profileImageError ? (
                  <AvatarImage
                    src={profileImageUrl}
                    alt={`${displayName}'s profile picture`}
                    className="object-cover"
                    onError={() => setProfileImageError(true)}
                  />
                ) : null}
                <AvatarFallback className="bg-[#0c2d6b] text-white text-xs sm:text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              {/* Google Account Indicator */}
              {isFromGoogle && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm"
                  title="Google Account"
                >
                  <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <span className="hidden sm:inline font-medium truncate max-w-[80px] md:max-w-[120px] text-xs sm:text-sm">
              {displayName}
            </span>
            <ChevronDown
              className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 flex-shrink-0 ${isUserMenuOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {isUserMenuOpen && (
            <div
              id="user-menu-content"
              className="absolute right-0 mt-2 w-48 sm:w-56 rounded-lg sm:rounded-xl border bg-background shadow-lg z-50"
              role="menu"
              aria-labelledby="user-menu-button"
            >
              {/* Enhanced User Info with Google Account Indicator */}
              <div className="py-2 sm:py-3 px-3 sm:px-4 border-b">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-medium truncate flex-1">{displayName}</p>
                  {isFromGoogle && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <svg className="h-3 w-3" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Google</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{authUser?.email || "User Email"}</p>
              </div>

              {/* Enhanced Menu Items */}
              <div className="py-1" role="none">
                <Link
                  href="/student-dashboard/profile"
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-muted transition-colors min-h-[40px]"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Profile</span>
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-muted transition-colors min-h-[40px]"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Enhanced Logout Button */}
              <div className="border-t py-1" role="none">
                <button
                  className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-500 hover:bg-red-50 transition-colors min-h-[40px]"
                  role="menuitem"
                  onClick={(event) => {
                    event.preventDefault();
                    setIsUserMenuOpen(false);
                    handleLogout(); // Call the updated handleLogout function
                  }}
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
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