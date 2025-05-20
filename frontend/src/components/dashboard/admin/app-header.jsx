"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, User, Settings, LogOut, ChevronDown, X, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"

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

export function AppHeader() {
  const router = useRouter()
  const { isMobile } = useMobile()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState(sampleNotifications)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Sample user data
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Administrator",
    avatar: "/images/profile-avatar.png",
  }

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
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

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
      <div className="flex-1">{/* Left side content can go here */}</div>
      <div className="flex items-center gap-1 ml-auto pr-1">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
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
                          className={`p-3 border-b hover:bg-gray-50 transition-colors ${!notification.read ? "bg-blue-50/30" : ""}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium text-black">{notification.title}</p>
                                {!notification.read && <span className="h-2 w-2 bg-blue-600 rounded-full"></span>}
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
                  <Button variant="ghost" size="sm" className="w-full text-black" onClick={viewAllNotifications}>
                    View all notifications
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
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
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-cedo-blue text-white">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
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
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="bg-cedo-blue text-white">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-black">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
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
  )
}
