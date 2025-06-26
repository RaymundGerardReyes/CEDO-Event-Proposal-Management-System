"use client"

import { AvatarProfile } from "@/components/ui/avatar-origin";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, ChevronDown, Clock, LogOut, Settings, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Enhanced responsive breakpoints with zoom awareness  
const RESPONSIVE_BREAKPOINTS = {
  xs: 320,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
  zoom125: 1536,  // Handles 125% zoom
  zoom150: 1280,  // Handles 150% zoom
  zoom200: 960,   // Handles 200% zoom
}

// Sample notifications data
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
];

export function AppHeader() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const { user, signOut } = useAuth();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Enhanced responsive monitoring
  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth
      const screenWidth = window.screen.width
      const zoom = width / screenWidth

      setViewportWidth(width)
      setZoomLevel(zoom)
    }

    updateResponsiveState()
    window.addEventListener("resize", updateResponsiveState, { passive: true })

    return () => window.removeEventListener("resize", updateResponsiveState)
  }, [])

  // Enhanced click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = (id, link) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)));
    if (link) router.push(link);
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  // Enhanced notification icons with responsive sizing
  const getNotificationIcon = (type) => {
    const iconProps = {
      className: "w-full h-full",
      style: { width: "100%", height: "100%" }
    };

    const containerClass = `
      rounded-full flex items-center justify-center shrink-0
      transition-all duration-300 hover:scale-110
    `;

    const containerStyle = {
      width: `clamp(2rem, 4vw, 2.5rem)`,
      height: `clamp(2rem, 4vw, 2.5rem)`,
    };

    switch (type) {
      case "proposal":
        return <div className={`${containerClass} bg-blue-100 text-blue-600`} style={containerStyle}><Bell {...iconProps} /></div>;
      case "approval":
        return <div className={`${containerClass} bg-green-100 text-green-600`} style={containerStyle}><Check {...iconProps} /></div>;
      case "rejection":
        return <div className={`${containerClass} bg-red-100 text-red-600`} style={containerStyle}><X {...iconProps} /></div>;
      case "reminder":
        return <div className={`${containerClass} bg-yellow-100 text-yellow-600`} style={containerStyle}><Clock {...iconProps} /></div>;
      default:
        return <div className={`${containerClass} bg-gray-100 text-gray-600`} style={containerStyle}><Bell {...iconProps} /></div>;
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

  if (!user) {
    return (
      <div
        className="
          flex items-center justify-end 
          bg-white/95 backdrop-blur-md
          border-b border-gray-200/60 shadow-sm
          transition-all duration-300 ease-out
        "
        style={{
          height: `clamp(3.5rem, 8vh, 5rem)`,
          padding: `0 clamp(1rem, 3vw, 2rem)`,
        }}
      >
        <Button
          variant="outline"
          onClick={() => router.push('/sign-in')}
          className="
            border-gray-300 hover:border-gray-400
            transition-all duration-300 hover:scale-105
          "
          style={{
            minHeight: `clamp(2.5rem, 5vh, 3rem)`,
            padding: `clamp(0.5rem, 1.5vw, 1rem) clamp(1rem, 3vw, 1.5rem)`,
            fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
          }}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div
      className="
        flex items-center justify-between 
        bg-white/95 backdrop-blur-md
        border-b border-gray-200/60 shadow-sm
        transition-all duration-300 ease-out
      "
      style={{
        height: `clamp(3.5rem, 8vh, 5rem)`,
        padding: `0 clamp(1rem, 3vw, 2rem)`,
      }}
    >
      {/* Enhanced left section with responsive brand */}
      <div className="flex items-center min-w-0 flex-1">
        <h1
          className="font-semibold text-gray-900 truncate transition-all duration-300"
          style={{
            fontSize: `clamp(1.25rem, 3vw, 2rem)`,
            lineHeight: 1.2
          }}
        >
          <span className="hidden md:inline">CEDO Admin</span>
          <span className="md:hidden">Admin</span>
        </h1>
      </div>

      {/* Enhanced right section with responsive spacing */}
      <div
        className="flex items-center ml-auto"
        style={{ gap: `clamp(0.5rem, 2vw, 1.25rem)` }}
      >
        {/* Enhanced notifications dropdown */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            className="
              relative cursor-pointer rounded-xl
              hover:bg-gray-100 active:bg-gray-200 
              transition-all duration-300 hover:scale-110 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-yellow-400/50
            "
            style={{
              width: `clamp(2.5rem, 5vw, 3rem)`,
              height: `clamp(2.5rem, 5vw, 3rem)`,
              padding: 0,
            }}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            aria-label="Toggle notifications"
          >
            <Bell
              className="text-gray-600 transition-transform duration-300 hover:scale-110"
              style={{
                width: `clamp(1.25rem, 3vw, 1.5rem)`,
                height: `clamp(1.25rem, 3vw, 1.5rem)`,
              }}
            />
            {unreadCount > 0 && (
              <span
                className="
                  absolute -top-1 -right-1 
                  bg-red-500 rounded-full 
                  text-white font-medium
                  flex items-center justify-center
                  border-2 border-white
                "
                style={{
                  width: `clamp(1.25rem, 3vw, 1.5rem)`,
                  height: `clamp(1.25rem, 3vw, 1.5rem)`,
                  fontSize: `clamp(0.625rem, 1.5vw, 0.75rem)`,
                }}
              >
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
                  bg-white rounded-xl shadow-xl border border-gray-200
                  overflow-hidden z-50 
                "
                style={{
                  width: `clamp(320px, 40vw, 480px)`,
                  maxHeight: `clamp(400px, 70vh, 600px)`,
                }}
              >
                {/* Enhanced header */}
                <div
                  className="border-b border-gray-200 bg-gray-50"
                  style={{ padding: `clamp(1rem, 3vw, 1.5rem)` }}
                >
                  <div className="flex justify-between items-center">
                    <h3
                      className="font-semibold text-gray-900"
                      style={{ fontSize: `clamp(1rem, 2vw, 1.25rem)` }}
                    >
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="link"
                        onClick={markAllAsRead}
                        className="text-blue-600 hover:text-blue-700 h-auto p-0"
                        style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>

                {/* Enhanced notifications list */}
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  {notifications.length > 0 ? (
                    <div>
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`
                            border-b border-gray-100 
                            hover:bg-gray-50 active:bg-gray-100 
                            transition-colors duration-300 cursor-pointer
                            ${!notification.read ? "bg-blue-50/50" : ""}
                          `}
                          style={{ padding: `clamp(1rem, 3vw, 1.5rem)` }}
                          onClick={() => markAsRead(notification.id, notification.link)}
                          role="button"
                          tabIndex={0}
                        >
                          <div
                            className="flex gap-3"
                            style={{ gap: `clamp(0.75rem, 2vw, 1rem)` }}
                          >
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p
                                  className="font-medium text-gray-900 line-clamp-2"
                                  style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                                >
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="h-2 w-2 bg-blue-600 rounded-full mt-1 shrink-0"></span>
                                )}
                              </div>
                              <p
                                className="text-gray-600 mt-1 line-clamp-2"
                                style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
                              >
                                {notification.message}
                              </p>
                              <p
                                className="text-gray-500 mt-1"
                                style={{ fontSize: `clamp(0.75rem, 1.2vw, 0.875rem)` }}
                              >
                                {notification.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-center"
                      style={{ padding: `clamp(2rem, 5vw, 3rem)` }}
                    >
                      <div
                        className="mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center"
                        style={{
                          width: `clamp(4rem, 8vw, 5rem)`,
                          height: `clamp(4rem, 8vw, 5rem)`,
                        }}
                      >
                        <Bell
                          className="text-gray-400"
                          style={{
                            width: `clamp(2rem, 4vw, 2.5rem)`,
                            height: `clamp(2rem, 4vw, 2.5rem)`,
                          }}
                        />
                      </div>
                      <p
                        className="text-gray-500"
                        style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                      >
                        No notifications
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced profile dropdown with Google OAuth Avatar using AvatarProfile */}
        <div className="relative" ref={profileRef}>
          <Button
            variant="ghost"
            className="
              flex items-center cursor-pointer rounded-xl
              hover:bg-gray-100 active:bg-gray-200 
              transition-all duration-300 hover:scale-105 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-yellow-400/50
            "
            style={{
              height: `clamp(2.5rem, 5vw, 3rem)`,
              padding: `clamp(0.5rem, 1vw, 0.75rem)`,
              gap: `clamp(0.5rem, 1.5vw, 1rem)`,
            }}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            aria-label="Toggle user profile menu"
          >
            <AvatarProfile
              src={user.avatar || user.profilePicture || user.image}
              name={user.name}
              role={user.role}
              size="default"
              showGoogleIndicator={true}
              className="ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300"
              style={{
                width: `clamp(2rem, 4vw, 2.5rem)`,
                height: `clamp(2rem, 4vw, 2.5rem)`,
              }}
            />

            {/* Enhanced user info with responsive visibility */}
            <div
              className="hidden sm:block text-left min-w-0"
              style={{ maxWidth: `clamp(120px, 15vw, 200px)` }}
            >
              <p
                className="font-medium leading-none text-gray-900 truncate"
                style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
              >
                {user.name}
              </p>
              <p
                className="text-gray-500 truncate mt-0.5"
                style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
              >
                {user.role}
              </p>
            </div>

            <ChevronDown
              className="hidden sm:block text-gray-500 transition-transform duration-300"
              style={{
                width: `clamp(1rem, 2vw, 1.25rem)`,
                height: `clamp(1rem, 2vw, 1.25rem)`,
              }}
            />
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
                  bg-white rounded-xl shadow-xl border border-gray-200
                  overflow-hidden z-50 
                "
                style={{ width: `clamp(256px, 32vw, 384px)` }}
              >
                {/* Enhanced profile header with Google OAuth Avatar using AvatarProfile */}
                <div
                  className="border-b border-gray-200 bg-gray-50"
                  style={{ padding: `clamp(1rem, 3vw, 1.5rem)` }}
                >
                  <div
                    className="flex items-center"
                    style={{ gap: `clamp(0.75rem, 2vw, 1rem)` }}
                  >
                    <AvatarProfile
                      src={user.avatar || user.profilePicture || user.image}
                      name={user.name}
                      role={user.role}
                      size="xl"
                      showGoogleIndicator={true}
                      className="ring-2 ring-primary/20"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-medium text-gray-900 truncate"
                        style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                      >
                        {user.name}
                      </p>
                      <p
                        className="text-gray-500 truncate"
                        style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced profile menu */}
                <div style={{ padding: `clamp(0.5rem, 1.5vw, 0.75rem)` }}>
                  <Button
                    variant="ghost"
                    className="
                      w-full justify-start cursor-pointer rounded-lg
                      text-gray-700 hover:bg-gray-100 active:bg-gray-200
                      transition-all duration-300
                    "
                    style={{
                      height: `clamp(2.5rem, 5vh, 3rem)`,
                      fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
                      gap: `clamp(0.5rem, 1.5vw, 0.75rem)`,
                    }}
                    onClick={() => handleNavigation("/admin-dashboard/profile")}
                  >
                    <User
                      style={{
                        width: `clamp(1rem, 2vw, 1.25rem)`,
                        height: `clamp(1rem, 2vw, 1.25rem)`,
                      }}
                    />
                    My Profile
                  </Button>

                  {user.role === "head_admin" && (
                    <Button
                      variant="ghost"
                      className="
                        w-full justify-start cursor-pointer rounded-lg
                        text-gray-700 hover:bg-gray-100 active:bg-gray-200
                        transition-all duration-300
                      "
                      style={{
                        height: `clamp(2.5rem, 5vh, 3rem)`,
                        fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
                        gap: `clamp(0.5rem, 1.5vw, 0.75rem)`,
                      }}
                      onClick={() => handleNavigation("/admin-dashboard/settings")}
                    >
                      <Settings
                        style={{
                          width: `clamp(1rem, 2vw, 1.25rem)`,
                          height: `clamp(1rem, 2vw, 1.25rem)`,
                        }}
                      />
                      Settings
                    </Button>
                  )}

                  <div className="border-t my-1" />

                  <Button
                    variant="ghost"
                    className="
                      w-full justify-start cursor-pointer rounded-lg
                      text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100
                      transition-all duration-300
                    "
                    style={{
                      height: `clamp(2.5rem, 5vh, 3rem)`,
                      fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
                      gap: `clamp(0.5rem, 1.5vw, 0.75rem)`,
                    }}
                    onClick={async () => {
                      try {
                        setShowProfile(false);
                        await signOut();
                      } catch (error) {
                        console.warn('Sign-out error:', error);
                        setShowProfile(false);
                      }
                    }}
                  >
                    <LogOut
                      style={{
                        width: `clamp(1rem, 2vw, 1.25rem)`,
                        height: `clamp(1rem, 2vw, 1.25rem)`,
                      }}
                    />
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