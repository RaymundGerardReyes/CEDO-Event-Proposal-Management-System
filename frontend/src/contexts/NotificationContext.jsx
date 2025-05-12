"use client"

import { createContext, useContext, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useAuth } from "./AuthContext_old_Text"

const NotificationContext = createContext()

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const { currentUser } = useAuth()

    // Fetch notifications when user logs in
    useEffect(() => {
        if (currentUser) {
            fetchNotifications()
        }
    }, [currentUser])

    // Fetch notifications from API
    const fetchNotifications = async () => {
        try {
            // In a real app, this would be an API call
            // For demo, we'll use mock data
            const mockNotifications = [
                {
                    id: 1,
                    message: "New proposal submitted: Community Outreach Program",
                    createdAt: "2023-05-15T10:30:00Z",
                    read: false,
                    type: "proposal_new",
                },
                {
                    id: 2,
                    message: "Proposal approved: HIV Awareness Campaign",
                    createdAt: "2023-05-14T14:45:00Z",
                    read: true,
                    type: "proposal_approved",
                },
                {
                    id: 3,
                    message: "New user registered: John Doe",
                    createdAt: "2023-05-13T09:15:00Z",
                    read: false,
                    type: "user_new",
                },
            ]

            setNotifications(mockNotifications)
            setUnreadCount(mockNotifications.filter((n) => !n.read).length)

            // In a real app:
            // const response = await api.get("/notifications");
            // setNotifications(response.data);
            // setUnreadCount(response.data.filter(n => !n.read).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        }
    }

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            // Update local state
            setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
            setUnreadCount((prev) => Math.max(0, prev - 1))

            // In a real app, update on server
            // await api.put(`/notifications/${notificationId}/read`);
        } catch (error) {
            console.error("Failed to mark notification as read:", error)
        }
    }

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            // Update local state
            setNotifications(notifications.map((n) => ({ ...n, read: true })))
            setUnreadCount(0)

            // In a real app, update on server
            // await api.put("/notifications/read-all");
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error)
        }
    }

    // Add a new notification (used when receiving real-time notifications)
    const addNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev])
        if (!notification.read) {
            setUnreadCount((prev) => prev + 1)
        }

        // Show toast notification
        toast(notification.message, {
            icon: notification.type === "proposal_approved" ? "✅" : notification.type === "proposal_rejected" ? "❌" : "📣",
        })
    }

    const value = {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
    }

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
