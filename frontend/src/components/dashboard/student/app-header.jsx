"use client"

import { getSafeImageUrl } from "@/utils/image-utils"
import { Bell, Check, ChevronDown, Clock, LogOut, Settings, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

// Sample notifications data
const sampleNotifications = [
  {
    id: "notif-001",
    title: "New Proposal Submitted",
    message: "Science Fair Exhibition proposal was submitted by Alex Johnson",
    timestamp: "10 minutes ago",
    read: false,
    type: "proposal",
  },
  {
    id: "notif-002",
    title: "Proposal Approved",
    message: "Leadership Workshop proposal has been approved",
    timestamp: "2 hours ago",
    read: true,
    type: "approval",
  },
  {
    id: "notif-003",
    title: "Event Reminder",
    message: "Community Service Day starts tomorrow at 8:00 AM",
    timestamp: "1 day ago",
    read: false,
    type: "reminder",
  },
  {
    id: "notif-004",
    title: "Proposal Rejected",
    message: "Tech Conference proposal was rejected. See comments for details.",
    timestamp: "1 day ago",
    read: true,
    type: "rejection",
  },
]

// Custom Button component to replace external dependency
function Button({ variant = "default", size = "default", className = "", children, onClick, ...props }) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    ghost: "hover:bg-gray-100 focus:ring-gray-500",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    icon: "h-9 w-9",
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

// Custom Avatar components to replace external dependency
function Avatar({ className = "", children }) {
  return <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>
}

function AvatarImage({ src, alt }) {
  const safeSrc = getSafeImageUrl(src);
  return <img className="aspect-square h-full w-full" src={safeSrc} alt={alt} onError={(e) => {
    if (e.target.src !== getSafeImageUrl()) {
      e.target.src = getSafeImageUrl();
    }
  }} />
}

function AvatarFallback({ className = "", children }) {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-[#0c2d6b] text-white text-xs sm:text-sm font-medium ${className}`}>
      {children}
    </div>
  )
}

export function AppHeader() {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState(sampleNotifications)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const notificationRef = useRef(null)
  const notificationButtonRef = useRef(null)
  const profileRef = useRef(null)
  const notificationPortalRef = useRef(null)
  const [notifPosition, setNotifPosition] = useState({ top: 0, left: 0, width: 0 })

  // Mock user data - replace with actual auth context
  const authUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Student",
    avatar: null,
  }

  const isInitialized = true // Mock initialization state

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  // Listen for sidebar state changes and window resize
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(false) // Reset sidebar state on mobile
      }
    }

    handleResize()
    window.addEventListener("sidebar-toggle", handleSidebarToggle)
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      const clickedInsidePortal = notificationPortalRef.current && notificationPortalRef.current.contains(event.target)
      const clickedButton = notificationButtonRef.current && notificationButtonRef.current.contains(event.target)
      if (!clickedInsidePortal && !clickedButton) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Compute and update portal dropdown position based on the bell button
  useEffect(() => {
    function updateNotifPosition() {
      try {
        const btn = notificationButtonRef.current
        if (!btn) return
        const rect = btn.getBoundingClientRect()
        setNotifPosition({
          top: rect.bottom + 8,
          left: Math.max(8, Math.min(window.innerWidth - 8, rect.right)),
          width: Math.min(480, Math.max(320, Math.floor(window.innerWidth * 0.4)))
        })
      } catch (_) { }
    }

    if (showNotifications) {
      updateNotifPosition()
      window.addEventListener('scroll', updateNotifPosition, { passive: true })
      window.addEventListener('resize', updateNotifPosition, { passive: true })
      return () => {
        window.removeEventListener('scroll', updateNotifPosition)
        window.removeEventListener('resize', updateNotifPosition)
      }
    }
  }, [showNotifications])

  // Mark a notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })))
  }

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "proposal":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Bell className="h-4 w-4" />
          </div>
        )
      case "approval":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <Check className="h-4 w-4" />
          </div>
        )
      case "rejection":
        return (
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <X className="h-4 w-4" />
          </div>
        )
      case "reminder":
        return (
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
        )
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <Bell className="h-4 w-4" />
          </div>
        )
    }
  }

  // Navigate to profile page
  const goToProfile = () => {
    router.push("/profile")
    setShowProfile(false)
  }

  // Navigate to notifications page
  const viewAllNotifications = () => {
    router.push("/notifications")
    setShowNotifications(false)
  }

  const handleSignOut = async () => {
    // Mock sign out - replace with actual auth logic
    setShowProfile(false)
    router.push("/login")
  }

  // Fallback name initials
  const getNameInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  // Calculate header margin based on sidebar state
  const getHeaderMargin = () => {
    if (isMobile) return "ml-0"
    return sidebarCollapsed ? "ml-20" : "ml-64"
  }

  if (!isInitialized) {
    return null
  }

  return (
    <div
      className={`h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm transition-all duration-300 ${getHeaderMargin()}`}
    >
      {/* Left side */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile spacing for sidebar button */}
        {isMobile && <div className="w-12"></div>}

        {/* Page title */}
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Mobile title */}
        <div className="sm:hidden">
          <h1 className="text-base font-semibold text-gray-900">CEDO</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 ml-auto pr-1">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            ref={notificationButtonRef}
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfile(false)
            }}
          >
            <Bell className="h-5 w-5 text-black" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications dropdown - portal-based fixed positioning */}
          {showNotifications && createPortal((
            <div
              ref={notificationPortalRef}
              className="fixed bg-white rounded-md shadow-lg border overflow-hidden z-[2147483647]"
              style={{
                top: 72,
                right: 16,
                width: Math.min(480, Math.max(320, Math.floor(window.innerWidth * 0.4))),
                maxHeight: '70vh'
              }}
            >
              <div className="p-3 border-b flex justify-between items-center">
                <h3 className="font-medium text-black">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-8 text-black">
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
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-black">{notification.title}</p>
                              {!notification.read && <span className="h-2 w-2 bg-blue-600 rounded-full"></span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No notifications</p>
                  </div>
                )}
              </div>

              <div className="p-2 border-t">
                <Button variant="ghost" size="sm" className="w-full text-black" onClick={viewAllNotifications}>
                  View all notifications
                </Button>
              </div>
            </div>
          ), document.body)}
        </div>

        {/* Profile */}
        {authUser ? (
          <div className="relative" ref={profileRef}>
            <Button
              variant="ghost"
              className={`flex items-center gap-1 ${isMobile ? "px-1" : "px-2"} h-9`}
              onClick={() => {
                setShowProfile(!showProfile)
                setShowNotifications(false)
              }}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={authUser.avatar || "/placeholder.svg"} alt={authUser.name || "User"} />
                <AvatarFallback className="bg-blue-600 text-white">{getNameInitials(authUser.name)}</AvatarFallback>
              </Avatar>
              {!isMobile && (
                <>
                  <div className="text-left max-w-[120px]">
                    <p className="text-xs font-medium leading-none text-black truncate">{authUser.name || "User"}</p>
                    <p className="text-[10px] text-gray-500 truncate">{authUser.role || "Role"}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </>
              )}
            </Button>

            {/* Profile dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={authUser.avatar || "/placeholder.svg"} alt={authUser.name || "User"} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getNameInitials(authUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-black">{authUser.name || "User"}</p>
                      <p className="text-xs text-gray-500">{authUser.email || "No email"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-black" onClick={goToProfile}>
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-black">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign asdas
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
