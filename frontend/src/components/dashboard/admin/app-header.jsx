"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context"; // Add this line
import { useMobile } from "@/hooks/use-mobile"; // Assuming this hook is correctly defined
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, ChevronDown, Clock, LogOut, Settings, User, X } from "lucide-react"; // Added MenuIcon
import { useRouter } from "next/navigation"; // Corrected import
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
    link: "/admin-dashboard/proposals/sci-fair-001" // Example link
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
  const { isMobile } = useMobile(); // Assuming this hook provides a boolean
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);
  // const [isMobileNavOpen, setIsMobileNavOpen] = useState(false); // If you need a mobile nav toggle in header

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Sample user data (ideally from context or auth hook)
  const { user, signOut } = useAuth(); // Get authenticated user and signOut from auth context

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
    setShowNotifications(false); // Close dropdown after click
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  const getNotificationIcon = (type) => {
    // Same as your provided function
    switch (type) {
      case "proposal":
        return <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Bell className="h-4 w-4" /></div>;
      case "approval":
        return <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><Check className="h-4 w-4" /></div>;
      case "rejection":
        return <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><X className="h-4 w-4" /></div>;
      case "reminder":
        return <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0"><Clock className="h-4 w-4" /></div>;
      default:
        return <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"><Bell className="h-4 w-4" /></div>;
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
    setShowProfile(false); // Close profile dropdown after navigation
  };

  const viewAllNotifications = () => {
    router.push("/admin-dashboard/notifications"); // Corrected path
    setShowNotifications(false);
  };

  // Placeholder for mobile navigation toggle if this header is responsible for it
  // const toggleMobileNav = () => setIsMobileNavOpen(!isMobileNavOpen);

  // Handle cases where user might be null during initial load or if not authenticated
  if (!user) {
    // Optionally, render a loading state or a sign-in prompt, 
    // or null if the header shouldn't be visible without a user.
    // For now, let's return a minimal version or null to prevent errors.
    // Depending on your app flow, you might want to redirect or show a placeholder.
    return (
      <div className="h-16 border-b bg-white flex items-center justify-end px-4 sticky top-0 z-40 shadow-sm">
        {/* Placeholder for when user is not loaded, or redirect logic might handle this state elsewhere */}
        <Button variant="outline" onClick={() => router.push('/sign-in')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center">
        {/* Optional: Mobile Nav Toggle if sidebar is not always visible or controlled by this header */}
        {/* <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={toggleMobileNav}>
          <MenuIcon className="h-5 w-5 text-black" />
        </Button> */}
        {/* Optional: Logo or Brand Name if not in Sidebar */}
        {/* <Link href="/admin-dashboard" className="text-lg font-semibold text-cedo-blue">
          CEDO Portal
        </Link> */}
      </div>

      <div className="flex-1">{/* Spacer or Desktop Search Bar can go here */}</div>

      <div className="flex items-center gap-1 ml-auto pr-1">
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            aria-label="Toggle notifications"
          >
            <Bell className="h-5 w-5 text-black" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg border overflow-hidden z-50"
              >
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium text-black">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="link" size="sm" onClick={markAllAsRead} className="text-xs h-8 text-blue-600 hover:text-blue-700 px-1">
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div>
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? "bg-blue-50/30" : ""}`}
                          onClick={() => markAsRead(notification.id, notification.link)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && markAsRead(notification.id, notification.link)}
                        >
                          <div className="flex gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-black">{notification.title}</p>
                                {!notification.read && <span className="h-2 w-2 bg-blue-600 rounded-full mt-1 shrink-0"></span>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">No notifications</p>
                    </div>
                  )}
                </div>
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full text-black hover:bg-gray-100" onClick={viewAllNotifications}>
                    View all notifications
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <Button
            variant="ghost"
            className={`flex items-center gap-1 ${isMobile ? "px-1" : "px-2"} h-9`}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            aria-label="Toggle user profile menu"
            aria-expanded={showProfile}
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-cedo-blue text-white text-xs">
                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isMobile && (
              <>
                <div className="text-left max-w-[120px]">
                  <p className="text-xs font-medium leading-none text-black truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </Button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border overflow-hidden z-50"
              >
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-cedo-blue text-white">
                        {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-black">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-black hover:bg-gray-100" onClick={() => handleNavigation("/admin-dashboard/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-black hover:bg-gray-100" onClick={() => handleNavigation("/admin-dashboard/settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      // Add your sign out logic here
                      signOut(); // Call signOut from context
                      // router.push("/sign-in"); // signOut in context should handle redirection
                      setShowProfile(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
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
