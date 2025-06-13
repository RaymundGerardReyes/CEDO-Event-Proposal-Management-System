"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, ChevronDown, Clock, LogOut, Settings, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Responsive breakpoints following mobile-first approach
const RESPONSIVE_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

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

  // Enhanced click outside handler with responsive considerations
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }

    // Add passive listeners for better performance
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
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

  // Enhanced notification icons with responsive sizing
  const getNotificationIcon = (type) => {
    const iconSize = "h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5";
    const containerSize = "h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10";

    switch (type) {
      case "proposal":
        return <div className={`${containerSize} rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0`}><Bell className={iconSize} /></div>;
      case "approval":
        return <div className={`${containerSize} rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0`}><Check className={iconSize} /></div>;
      case "rejection":
        return <div className={`${containerSize} rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0`}><X className={iconSize} /></div>;
      case "reminder":
        return <div className={`${containerSize} rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0`}><Clock className={iconSize} /></div>;
      default:
        return <div className={`${containerSize} rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0`}><Bell className={iconSize} /></div>;
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

  // Enhanced loading state with responsive design
  if (!user) {
    return (
      <div className="
        h-14 md:h-16 lg:h-20 
        flex items-center justify-end 
        px-4 md:px-6 lg:px-8
        transition-all duration-200
      ">
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={() => router.push('/sign-in')}
          className="
            text-xs md:text-sm lg:text-base 
            border-slate-300 hover:border-slate-400
            min-h-[40px] md:min-h-[44px] lg:min-h-[48px]
            px-4 md:px-6 lg:px-8
            transition-all duration-200
          "
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="
      h-14 md:h-16 lg:h-20 
      flex items-center justify-between 
      px-4 md:px-6 lg:px-8
      transition-all duration-200
      bg-white/95 backdrop-blur-md
      border-b border-slate-200/60
      shadow-sm
    ">

      {/* Enhanced left section with responsive brand */}
      <div className="flex items-center min-w-0 flex-1">
        {/* Responsive brand/logo */}
        <div className="hidden md:block">
          <h1 className="
            text-lg md:text-xl lg:text-2xl xl:text-3xl 
            font-semibold text-slate-900 truncate
            transition-all duration-200
          ">
            CEDO Admin
          </h1>
        </div>

        {/* Mobile brand */}
        <div className="block md:hidden">
          <h1 className="text-base font-semibold text-slate-900 truncate">
            Admin
          </h1>
        </div>
      </div>

      {/* Enhanced right section with responsive spacing */}
      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 xl:gap-5 ml-auto">

        {/* Enhanced notifications dropdown with responsive design */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="sm"
            className="
              relative cursor-pointer
              h-9 w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 xl:h-12 xl:w-12 p-0 
              hover:bg-slate-100 active:bg-slate-200 transition-all duration-200
              rounded-xl
              focus:outline-none focus:ring-2 focus:ring-cedo-gold/50
            "
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            aria-label="Toggle notifications"
          >
            <Bell className="
              h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 
              text-slate-600 transition-transform duration-200 
              hover:scale-110 active:scale-95
            " />
            {unreadCount > 0 && (
              <span className="
                absolute -top-1 -right-1 
                h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 
                bg-red-500 rounded-full 
                text-[10px] md:text-xs lg:text-sm text-white 
                flex items-center justify-center font-medium
                border-2 border-white
              ">
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
                className="
                  absolute right-0 mt-2 
                  bg-white rounded-xl shadow-xl border border-slate-200
                  overflow-hidden z-50 
                  w-80 md:w-96 lg:w-[420px] xl:w-[480px]
                  max-h-[85vh] md:max-h-[80vh]
                "
              >
                {/* Enhanced header with responsive typography */}
                <div className="p-4 md:p-5 lg:p-6 border-b border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <h3 className="
                      font-semibold text-slate-900 
                      text-sm md:text-base lg:text-lg
                    ">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={markAllAsRead}
                        className="
                          text-xs md:text-sm lg:text-base h-auto p-0 
                          text-blue-600 hover:text-blue-700
                          transition-colors duration-200
                        "
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>

                {/* Enhanced notifications list with responsive scrolling */}
                <div className="
                  max-h-96 md:max-h-[400px] lg:max-h-[450px] 
                  overflow-y-auto
                  scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent
                ">
                  {notifications.length > 0 ? (
                    <div>
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`
                            p-4 md:p-5 lg:p-6 border-b border-slate-100 
                            hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 cursor-pointer
                            ${!notification.read ? "bg-blue-50/50" : ""}
                          `}
                          onClick={() => markAsRead(notification.id, notification.link)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && markAsRead(notification.id, notification.link)}
                        >
                          <div className="flex gap-3 md:gap-4">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="
                                  text-sm md:text-base lg:text-lg font-medium text-slate-900 line-clamp-2
                                  transition-colors duration-200
                                ">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="h-2 w-2 md:h-3 md:w-3 bg-blue-600 rounded-full mt-1 shrink-0"></span>
                                )}
                              </div>
                              <p className="
                                text-xs md:text-sm lg:text-base text-slate-600 mt-1 line-clamp-2
                                transition-colors duration-200
                              ">
                                {notification.message}
                              </p>
                              <p className="text-xs md:text-sm text-slate-500 mt-1">{notification.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 md:p-10 lg:p-12 text-center">
                      <div className="
                        h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 
                        mx-auto mb-4 rounded-full bg-slate-100 
                        flex items-center justify-center
                      ">
                        <Bell className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-slate-400" />
                      </div>
                      <p className="text-sm md:text-base lg:text-lg text-slate-500">No notifications</p>
                    </div>
                  )}
                </div>

                {/* Enhanced footer with responsive button */}
                <div className="p-3 md:p-4 lg:p-5 border-t border-slate-200 bg-slate-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="
                      w-full text-slate-700 hover:bg-slate-100 
                      text-xs md:text-sm lg:text-base
                      h-9 md:h-10 lg:h-11
                      transition-all duration-200
                    "
                    onClick={viewAllNotifications}
                  >
                    View all notifications
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced profile dropdown with responsive design */}
        <div className="relative" ref={profileRef}>
          <Button
            variant="ghost"
            className="
              flex items-center cursor-pointer
              gap-2 md:gap-3 lg:gap-4
              h-9 md:h-10 lg:h-11 xl:h-12 
              px-2 md:px-3 lg:px-4
              hover:bg-slate-100 active:bg-slate-200 transition-all duration-200
              rounded-xl
              focus:outline-none focus:ring-2 focus:ring-cedo-gold/50
            "
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            aria-label="Toggle user profile menu"
            aria-expanded={showProfile}
          >
            <Avatar className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="
                bg-blue-600 text-white 
                text-xs md:text-sm lg:text-base xl:text-lg
              ">
                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Enhanced user info with responsive visibility */}
            <div className="hidden sm:block text-left min-w-0 max-w-[120px] md:max-w-[150px] lg:max-w-[180px] xl:max-w-[200px]">
              <p className="
                text-xs md:text-sm lg:text-base font-medium leading-none text-slate-900 truncate
                transition-colors duration-200
              ">
                {user.name}
              </p>
              <p className="
                text-xs md:text-sm text-slate-500 truncate mt-0.5
                transition-colors duration-200
              ">
                {user.role}
              </p>
            </div>

            <ChevronDown className="
              h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-slate-500 
              hidden sm:block transition-transform duration-200
              group-hover:rotate-180
            " />
          </Button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="
                  absolute right-0 mt-2 
                  bg-white rounded-xl shadow-xl border border-slate-200
                  overflow-hidden z-50 
                  w-64 md:w-72 lg:w-80 xl:w-96
                "
              >
                {/* Enhanced profile header with responsive sizing */}
                <div className="p-4 md:p-5 lg:p-6 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3 md:gap-4">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="
                        bg-blue-600 text-white 
                        text-sm md:text-base lg:text-lg
                      ">
                        {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="
                        font-medium text-slate-900 
                        text-sm md:text-base lg:text-lg truncate
                        transition-colors duration-200
                      ">
                        {user.name}
                      </p>
                      <p className="
                        text-xs md:text-sm lg:text-base text-slate-500 truncate
                        transition-colors duration-200
                      ">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced profile menu with responsive items */}
                <div className="p-2 md:p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="
                      w-full justify-start cursor-pointer
                      text-slate-700 hover:bg-slate-100 active:bg-slate-200
                      h-9 md:h-10 lg:h-11 
                      text-xs md:text-sm lg:text-base
                      rounded-lg transition-all duration-200
                    "
                    onClick={() => handleNavigation("/admin-dashboard/profile")}
                  >
                    <User className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 mr-2 md:mr-3" />
                    My Profile
                  </Button>

                  {user.role === "head_admin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="
                        w-full justify-start cursor-pointer
                        text-slate-700 hover:bg-slate-100 active:bg-slate-200
                        h-9 md:h-10 lg:h-11 
                        text-xs md:text-sm lg:text-base
                        rounded-lg transition-all duration-200
                      "
                      onClick={() => handleNavigation("/admin-dashboard/settings")}
                    >
                      <Settings className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 mr-2 md:mr-3" />
                      Settings
                    </Button>
                  )}

                  <div className="border-t my-1 md:my-2" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="
                      w-full justify-start cursor-pointer
                      text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100
                      h-9 md:h-10 lg:h-11 
                      text-xs md:text-sm lg:text-base
                      rounded-lg transition-all duration-200
                    "
                    onClick={async () => {
                      try {
                        setShowProfile(false);
                        // Enhanced sign-out with cleanup
                        await signOut();
                      } catch (error) {
                        console.warn('Sign-out error:', error);
                        // Force cleanup even if sign-out fails
                        setShowProfile(false);
                      }
                    }}
                  >
                    <LogOut className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 mr-2 md:mr-3" />
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