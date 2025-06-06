"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, ChevronDown, Clock, LogOut, Settings, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Sample notifications data (can be fetched from an API)
const sampleNotifications = [
  {
    id: "notif-001",
    title: "New Proposal Submitted",
    message: "Science Fair Exhibition proposal was submitted by Alex Johnson",
    timestamp: "10 minutes ago",
    read: false,
    type: "proposal",
    link: "/admin-dashboard/proposals/sci-fair-001"
  },
  {
    id: "notif-002",
    title: "Proposal Approved",
    message: "Leadership Workshop proposal has been approved",
    timestamp: "2 hours ago",
    read: true,
    type: "approval",
    link: "/admin-dashboard/proposals/lead-work-002"
  },
  {
    id: "notif-003",
    title: "Event Reminder",
    message: "Community Service Day starts tomorrow at 8:00 AM",
    timestamp: "1 day ago",
    read: false,
    type: "reminder",
    link: "/admin-dashboard/events/comm-serv-003"
  },
  {
    id: "notif-004",
    title: "Proposal Rejected",
    message: "Tech Conference proposal was rejected. See comments for details.",
    timestamp: "1 day ago",
    read: true,
    type: "rejection",
    link: "/admin-dashboard/proposals/tech-conf-004"
  },
];

export function AppHeader() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const { user, signOut } = useAuth();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = (id, link) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)));
    if (link) {
      router.push(link);
    }
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "proposal":
        return <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Bell className="h-3 w-3 sm:h-4 sm:w-4" /></div>;
      case "approval":
        return <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><Check className="h-3 w-3 sm:h-4 sm:w-4" /></div>;
      case "rejection":
        return <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><X className="h-3 w-3 sm:h-4 sm:w-4" /></div>;
      case "reminder":
        return <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0"><Clock className="h-3 w-3 sm:h-4 sm:w-4" /></div>;
      default:
        return <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"><Bell className="h-3 w-3 sm:h-4 sm:w-4" /></div>;
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
    setShowProfile(false);
  };

  const viewAllNotifications = () => {
    router.push("/admin-dashboard/notifications");
    setShowNotifications(false);
  };

  // Handle cases where user might be null during initial load
  if (!user) {
    return (
      <div className="h-12 sm:h-14 md:h-16 border-b bg-white flex items-center justify-end px-3 sm:px-4 md:px-6 sticky top-0 z-40 shadow-sm">
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={() => router.push('/sign-in')}
          className="text-xs sm:text-sm"
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="h-12 sm:h-14 md:h-16 border-b bg-white/95 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-40 shadow-sm transition-all duration-200">
      {/* Left section - Brand/Search (responsive) */}
      <div className="flex items-center min-w-0 flex-1">
        {/* Optional brand/logo for larger screens */}
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-cedo-blue truncate">
            CEDO Admin
          </h1>
        </div>

        {/* Search could go here on larger screens */}
        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          {/* Placeholder for search functionality */}
        </div>
      </div>

      {/* Right section - Notifications and Profile (responsive) */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        {/* Notifications dropdown with responsive design */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "default"}
            className="relative h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-gray-100"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            aria-label="Toggle notifications"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 rounded-full text-[10px] sm:text-xs text-white flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 bg-white rounded-lg sm:rounded-xl shadow-xl border overflow-hidden z-50 w-72 sm:w-80 md:w-96"
              >
                {/* Header with responsive spacing */}
                <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs sm:text-sm h-auto p-0 text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>

                {/* Notifications list with responsive design */}
                <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto scrollbar-thin">
                  {notifications.length > 0 ? (
                    <div>
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 sm:p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? "bg-blue-50/50" : ""
                            }`}
                          onClick={() => markAsRead(notification.id, notification.link)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && markAsRead(notification.id, notification.link)}
                        >
                          <div className="flex gap-2 sm:gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-600 rounded-full mt-1 shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 sm:p-8 text-center">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-500">No notifications</p>
                    </div>
                  )}
                </div>

                {/* Footer with responsive design */}
                <div className="p-2 sm:p-3 border-t bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-700 hover:bg-gray-100 text-xs sm:text-sm"
                    onClick={viewAllNotifications}
                  >
                    View all notifications
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown with responsive design */}
        <div className="relative" ref={profileRef}>
          <Button
            variant="ghost"
            className={`flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-1 sm:px-2 hover:bg-gray-100 transition-colors`}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            aria-label="Toggle user profile menu"
            aria-expanded={showProfile}
          >
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-cedo-blue text-white text-xs">
                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* User info - hidden on very small screens */}
            <div className="hidden sm:block text-left min-w-0 max-w-[120px] md:max-w-[150px]">
              <p className="text-xs font-medium leading-none text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {user.role}
              </p>
            </div>

            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 hidden sm:block" />
          </Button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 bg-white rounded-lg sm:rounded-xl shadow-xl border overflow-hidden z-50 w-56 sm:w-64"
              >
                {/* Profile header with responsive design */}
                <div className="p-3 sm:p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-cedo-blue text-white text-sm">
                        {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {user.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile menu items with responsive design */}
                <div className="p-1 sm:p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-700 hover:bg-gray-100 h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => handleNavigation("/admin-dashboard/profile")}
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    My Profile
                  </Button>

                  {user.role === "head_admin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-700 hover:bg-gray-100 h-8 sm:h-9 text-xs sm:text-sm"
                      onClick={() => handleNavigation("/admin-dashboard/settings")}
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Settings
                    </Button>
                  )}

                  <div className="border-t my-1 sm:my-2" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => {
                      signOut();
                      setShowProfile(false);
                    }}
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
