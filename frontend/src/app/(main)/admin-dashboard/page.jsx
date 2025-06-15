// frontend/src/app/(main)/admin-dashboard/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card";
import { Input } from "@/components/dashboard/admin/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Eye,
  FileText,
  MoreVertical,
  Search,
  TrendingUp,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Enhanced sample data with more realistic content
const recentProposals = [
  {
    id: "PROP-1001",
    title: "Sports Festival 2024",
    organization: "USTP Sports Council",
    submittedOn: "2024-01-15",
    status: "pending",
    assignedTo: "Gerard Reyes",
    description: "Annual sports festival promoting healthy lifestyle among students.",
    proposedVenue: "University Gymnasium",
    proposedSchedule: "2024-04-20",
    expectedParticipants: 200,
    priority: "high",
    category: "Sports & Recreation"
  },
  {
    id: "PROP-1002",
    title: "HIV Awareness Campaign",
    organization: "XU Health Advocates",
    submittedOn: "2024-01-12",
    status: "approved",
    assignedTo: "Eva Torres",
    description: "Month-long campaign to raise HIV/AIDS awareness.",
    proposedVenue: "City Park",
    proposedSchedule: "2024-03-15",
    expectedParticipants: 300,
    priority: "medium",
    category: "Health & Wellness"
  },
  {
    id: "PROP-1003",
    title: "Tech Innovation Summit",
    organization: "Lourdes College IT Society",
    submittedOn: "2024-01-10",
    status: "rejected",
    assignedTo: "Mike Johnson",
    description: "Conference on latest tech trends and innovations.",
    proposedVenue: "Convention Center",
    proposedSchedule: "2024-05-10",
    expectedParticipants: 150,
    priority: "low",
    category: "Technology"
  },
  {
    id: "PROP-1004",
    title: "Local Business Marketing Workshop",
    organization: "XU Business Club",
    submittedOn: "2024-01-08",
    status: "approved",
    assignedTo: "Khecy Egar",
    description: "Workshop for local businesses on digital marketing strategies.",
    proposedVenue: "Community Hall",
    proposedSchedule: "2024-04-01",
    expectedParticipants: 80,
    priority: "medium",
    category: "Business & Finance"
  },
  {
    id: "PROP-1005",
    title: "Community Clean-Up Drive",
    organization: "CSO Environmental Team",
    submittedOn: "2024-01-05",
    status: "pending",
    assignedTo: "Robert Brown",
    description: "Community service project for environmental conservation.",
    proposedVenue: "City Park",
    proposedSchedule: "2024-03-28",
    expectedParticipants: 75,
    priority: "high",
    category: "Environment"
  },
]

const upcomingEvents = [
  {
    id: "EVENT-001",
    title: "Science Fair Exhibition",
    date: "Mon, Mar 20",
    time: "9:00 AM",
    location: "Main Campus Hall",
    attendees: 120,
    status: "confirmed",
    category: "Academic"
  },
  {
    id: "EVENT-002",
    title: "Leadership Workshop",
    date: "Wed, Mar 22",
    time: "2:00 PM",
    location: "Conference Room B",
    attendees: 45,
    status: "pending",
    category: "Training"
  },
  {
    id: "EVENT-003",
    title: "Community Service Day",
    date: "Sat, Mar 25",
    time: "8:00 AM",
    location: "City Park",
    attendees: 75,
    status: "confirmed",
    category: "Community"
  },
]

// Enhanced Error Boundary with better UX
function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false)
  const [errorDetails, setErrorDetails] = useState(null)

  useEffect(() => {
    const handleError = (error) => {
      const errorMessage = error.message || error.toString()
      if (errorMessage.includes('className') && errorMessage.includes('includes is not a function')) {
        console.warn('DOM className error detected and handled:', errorMessage)
        return
      }
      console.error('Dashboard Error:', error)
      setHasError(true)
      setErrorDetails(errorMessage || 'Unknown error occurred')
    }

    const handleRejection = (event) => {
      const reason = event.reason
      const reasonMessage = reason?.message || reason?.toString() || 'Promise rejection occurred'
      if (reasonMessage.includes('className') && reasonMessage.includes('includes is not a function')) {
        console.warn('DOM className promise rejection detected and handled:', reasonMessage)
        event.preventDefault()
        return
      }
      console.error('Unhandled Promise Rejection:', reason)
      setHasError(true)
      setErrorDetails(reasonMessage)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  if (hasError) {
    return fallback || (
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
                <p className="text-sm text-gray-600">We encountered an error while loading the dashboard.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => { setHasError(false); setErrorDetails(null) }} variant="outline" size="sm">
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} size="sm" className="bg-cedo-blue hover:bg-cedo-blue/90">
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return children
}

// Responsive Stats Card with modern design
function StatsCard({ title, value, subtitle, trend, icon, iconBg, isLoading = false }) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-sm">
        <CardContent className="p-4 lg:p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const trendIcon = trend?.direction === 'up' ? ArrowUpRight : ArrowDownRight
  const trendColor = trend?.direction === 'up' ? 'text-emerald-600' : 'text-red-500'

  return (
    <Card className="
      group relative overflow-hidden 
      border-0 shadow-sm hover:shadow-md
      bg-white/80 backdrop-blur-sm
      transition-all duration-300 ease-out
      hover:-translate-y-0.5
    ">
      <CardContent className="p-4 lg:p-6 relative">
        <div className="relative space-y-3 lg:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-600 leading-tight">
                {title}
              </p>
            </div>
            <div className={`
              shrink-0 w-10 h-10 lg:w-12 lg:h-12 
              rounded-xl ${iconBg} 
              flex items-center justify-center 
              transition-transform duration-300 
              group-hover:scale-110
            `}>
              {React.cloneElement(icon, {
                className: "w-5 h-5 lg:w-6 lg:h-6 text-slate-700"
              })}
            </div>
          </div>

          {/* Value */}
          <div className="space-y-1">
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 leading-none">
              {value}
            </div>
            {/* Subtitle with trend */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">{subtitle}</span>
              {trend && (
                <div className={`flex items-center gap-1 ${trendColor}`}>
                  {React.createElement(trendIcon, { className: "w-3 h-3" })}
                  <span className="text-xs font-medium">{trend.value}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Responsive Event Card
function EventCard({ title, eventId, date, time, location, attendees, status, category }) {
  const statusColors = {
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    cancelled: "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Card className="
      group hover:shadow-md transition-all duration-200 
      border-slate-200 hover:border-blue-300/30
      bg-white/90 backdrop-blur-sm
    ">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 mb-1">
                {title}
              </h4>
              <Badge variant="outline" className="text-xs px-2 py-0.5 text-slate-600 border-slate-300">
                {category}
              </Badge>
            </div>
            <Badge className={`text-xs ${statusColors[status] || statusColors.pending}`}>
              {status}
            </Badge>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{date} at {time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-slate-400" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-slate-400" />
              <span>{attendees} attendees</span>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors text-xs h-8 justify-center"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Loading Component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 lg:p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-9 w-48" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isClient, setIsClient] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [realTimeStats, setRealTimeStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [nextRefresh, setNextRefresh] = useState(null)

  // Use ref to track interval to prevent multiple intervals
  const intervalRef = useRef(null)
  const countdownRef = useRef(null)

  // Get cached token function (same pattern as other components)
  const getCachedToken = useCallback(() => {
    // Try to get token from cookies first
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("cedo_token="));

    if (cookieValue) {
      return cookieValue.split("=")[1];
    }

    // Fallback to localStorage
    return localStorage.getItem('cedo_token') || localStorage.getItem('token');
  }, []);

  // Fetch real-time statistics from backend
  const fetchRealTimeStats = useCallback(async () => {
    try {
      console.log('📊 Frontend: Fetching real-time statistics...')
      setStatsLoading(true)

      // Use the same backend URL pattern as other components
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const apiUrl = `${backendUrl}/api/proposals/stats`

      // Alternative: Use Next.js API proxy (if rewrites are configured)
      // const apiUrl = '/api/proposals/stats'

      console.log('📊 Frontend: Calling API URL:', apiUrl)

      // Get authentication token
      const token = getCachedToken();
      console.log('📊 Frontend: Token available:', !!token);

      // Prepare headers with authentication
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add Authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers,
        // Add CORS and timeout settings
        mode: 'cors',
        credentials: 'include',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('📊 Frontend: API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl,
          errorText: errorText
        })
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 Frontend: Raw API response:', data)

      if (data.success) {
        console.log('📊 Frontend: Real-time stats received:', data.stats)
        setRealTimeStats(data.stats)
        setLastUpdated(new Date().toLocaleTimeString())
        setNetworkError(false)
      } else {
        throw new Error(data.message || 'Failed to fetch statistics')
      }
    } catch (error) {
      console.error('❌ Frontend: Error fetching real-time stats:', error)

      // Check if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.warn('🔐 Authentication required for dashboard stats')
        // You might want to redirect to login or show auth error
      }

      setNetworkError(true)
      // Set fallback stats only if no stats exist yet
      setRealTimeStats(prevStats => prevStats || {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        trends: {
          pending: { direction: 'up', value: '0' },
          approved: { direction: 'up', value: '0%' },
          rejected: { direction: 'down', value: '0' },
          total: { direction: 'up', value: '0%' }
        }
      })
    } finally {
      setStatsLoading(false)
    }
  }, [getCachedToken]) // Removed realTimeStats dependency to prevent infinite loops

  // Enhanced initialization with real-time data fetching
  useEffect(() => {
    let mounted = true
    let timeoutId

    const initializeComponent = async () => {
      try {
        if (typeof window !== 'undefined') {
          setIsClient(true)
          console.log('📊 Dashboard: Initializing component...')

          // Fetch initial stats immediately
          await fetchRealTimeStats()

          // Set up auto-refresh every 30 seconds (only if not already running)
          if (mounted && !intervalRef.current) {
            console.log('📊 Dashboard: Setting up 30-second auto-refresh interval')

            // Set initial next refresh time
            setNextRefresh(new Date(Date.now() + 30000))

            intervalRef.current = setInterval(() => {
              if (mounted) {
                console.log('📊 Dashboard: Auto-refresh triggered (30s interval)')
                fetchRealTimeStats()
                setNextRefresh(new Date(Date.now() + 30000)) // Update next refresh time
              }
            }, 30000) // 30 seconds

            // Optional: Add a countdown timer that updates every second
            countdownRef.current = setInterval(() => {
              if (mounted) {
                setNextRefresh(prev => {
                  if (prev && Date.now() < prev.getTime()) {
                    return prev // Keep the same time
                  }
                  return new Date(Date.now() + 30000) // Reset if expired
                })
              }
            }, 1000) // Update countdown every second
          }

          timeoutId = setTimeout(() => {
            if (mounted) {
              setIsLoading(false)
            }
          }, 1000) // Reduced timeout since we're fetching real data
        }
      } catch (error) {
        console.error('Dashboard initialization error:', error)
        if (mounted) {
          setNetworkError(true)
          setIsLoading(false)
        }
      }
    }

    initializeComponent()

    return () => {
      console.log('📊 Dashboard: Cleaning up intervals and timeouts')
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
        console.log('📊 Dashboard: Cleared initialization timeout')
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        console.log('📊 Dashboard: Cleared stats refresh interval')
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
        console.log('📊 Dashboard: Cleared countdown timer')
      }
    }
  }, [fetchRealTimeStats]) // Keep fetchRealTimeStats dependency but it's now stable

  // Manual refresh function
  const handleRefreshStats = useCallback(() => {
    fetchRealTimeStats()
    // Reset the next refresh timer
    setNextRefresh(new Date(Date.now() + 30000))
  }, [fetchRealTimeStats])

  // Test backend connection function
  const testBackendConnection = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      console.log('🔍 Testing backend connection to:', backendUrl)

      // Get authentication token for test
      const token = getCachedToken();
      console.log('🔍 Test: Token available:', !!token);

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${backendUrl}/api/proposals/stats`, {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      })

      console.log('🔍 Backend connection test result:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Backend response data:', data)
        return true
      }
      return false
    } catch (error) {
      console.error('🔍 Backend connection test failed:', error)
      return false
    }
  }, [getCachedToken])

  // Memoized filtered proposals for performance
  const filteredProposals = useMemo(() => {
    try {
      return recentProposals.filter(proposal => {
        const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          proposal.organization.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || proposal.status === statusFilter
        return matchesSearch && matchesStatus
      })
    } catch (error) {
      console.error('Filter error:', error)
      return recentProposals
    }
  }, [searchTerm, statusFilter])

  // Memoized stats calculation using real-time data
  const dashboardStats = useMemo(() => {
    try {
      // Use real-time stats if available, otherwise fall back to mock data
      if (realTimeStats) {
        return {
          pending: {
            value: realTimeStats.pending,
            trend: realTimeStats.trends?.pending || { direction: 'up', value: '0' }
          },
          approved: {
            value: realTimeStats.approved,
            trend: realTimeStats.trends?.approved || { direction: 'up', value: '0%' }
          },
          rejected: {
            value: realTimeStats.rejected,
            trend: realTimeStats.trends?.rejected || { direction: 'down', value: '0' }
          },
          total: {
            value: realTimeStats.total,
            trend: realTimeStats.trends?.total || { direction: 'up', value: '0%' }
          }
        }
      }

      // Fallback to mock data calculation if real-time stats not available
      const total = recentProposals.length
      const pending = recentProposals.filter(p => p.status === 'pending').length
      const approved = recentProposals.filter(p => p.status === 'approved').length
      const rejected = recentProposals.filter(p => p.status === 'rejected').length
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

      return {
        pending: { value: pending, trend: { direction: 'up', value: '+5' } },
        approved: { value: approved, trend: { direction: 'up', value: `${approvalRate}%` } },
        rejected: { value: rejected, trend: { direction: 'down', value: '-2' } },
        total: { value: total, trend: { direction: 'up', value: '+6%' } }
      }
    } catch (error) {
      console.error('Stats calculation error:', error)
      return {
        pending: { value: 0, trend: { direction: 'up', value: '0' } },
        approved: { value: 0, trend: { direction: 'up', value: '0%' } },
        rejected: { value: 0, trend: { direction: 'down', value: '0' } },
        total: { value: 0, trend: { direction: 'up', value: '0%' } }
      }
    }
  }, [realTimeStats])

  // Callbacks for performance
  const handleSearch = useCallback((value) => {
    try {
      setSearchTerm(value)
    } catch (error) {
      console.error('Search error:', error)
    }
  }, [])

  const handleStatusFilter = useCallback((status) => {
    try {
      setStatusFilter(status)
    } catch (error) {
      console.error('Filter error:', error)
    }
  }, [])

  // Network error state
  if (networkError) {
    return (
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">Network Error</h2>
                <p className="text-sm text-slate-600">Unable to load dashboard data</p>
              </div>
              <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (!isClient || isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <ErrorBoundary>
      {/* Dashboard Container - Mobile First, Responsive */}
      <div className="space-y-6 lg:space-y-8">

        {/* Enhanced Dashboard Header - Responsive */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Overview of proposals, events, and system activity
                {lastUpdated && (
                  <span className="ml-2 text-xs text-slate-500">
                    • Last updated: {lastUpdated}
                  </span>
                )}
                {nextRefresh && !networkError && (
                  <span className="ml-2 text-xs text-slate-500">
                    • Next refresh: {Math.max(0, Math.ceil((nextRefresh.getTime() - Date.now()) / 1000))}s
                  </span>
                )}
                {realTimeStats && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse block"></span>
                    Live Data (30s refresh)
                  </span>
                )}
                {networkError && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full block"></span>
                    {getCachedToken() ? 'Connection Error' : 'Authentication Required'}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStats}
                disabled={statsLoading}
                className="shrink-0 border-slate-300 hover:border-slate-400"
              >
                <Activity className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                {statsLoading ? 'Refreshing...' : 'Refresh Stats'}
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testBackendConnection}
                  className="shrink-0 border-slate-300 hover:border-slate-400 text-xs"
                >
                  Test API
                </Button>
              )}
              <Button variant="outline" size="sm" className="shrink-0 border-slate-300 hover:border-slate-400">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="shrink-0 border-slate-300 hover:border-slate-400">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid - Mobile First Responsive with Real-Time Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatsCard
            title="Pending Review"
            value={dashboardStats.pending.value}
            subtitle="Since yesterday"
            trend={dashboardStats.pending.trend}
            icon={<Clock />}
            iconBg="bg-amber-100"
            isLoading={statsLoading || isLoading}
          />
          <StatsCard
            title="Approved"
            value={dashboardStats.approved.value}
            subtitle="Approval rate"
            trend={dashboardStats.approved.trend}
            icon={<TrendingUp />}
            iconBg="bg-emerald-100"
            isLoading={statsLoading || isLoading}
          />
          <StatsCard
            title="Rejected"
            value={dashboardStats.rejected.value}
            subtitle="This month"
            trend={dashboardStats.rejected.trend}
            icon={<Activity />}
            iconBg="bg-red-100"
            isLoading={statsLoading || isLoading}
          />
          <StatsCard
            title="Total Proposals"
            value={dashboardStats.total.value}
            subtitle="Growth rate"
            trend={dashboardStats.total.trend}
            icon={<FileText />}
            iconBg="bg-blue-100"
            isLoading={statsLoading || isLoading}
          />
        </div>

        {/* Enhanced Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">

          {/* Recent Proposals - Enhanced with Better Filtering */}
          <div className="xl:col-span-2">
            <Card className="shadow-sm border-slate-200 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg lg:text-xl text-slate-900">
                      Recent Proposals
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Latest submissions and their current status
                    </p>
                  </div>

                  {/* Enhanced Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 lg:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="search"
                        placeholder="Search proposals..."
                        className="pl-9 lg:w-64 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={statusFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusFilter("all")}
                        className={statusFilter === "all" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 hover:border-slate-400"}
                      >
                        All
                      </Button>
                      <Button
                        variant={statusFilter === "pending" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusFilter("pending")}
                        className={statusFilter === "pending" ? "bg-amber-500 hover:bg-amber-600" : "border-slate-300 hover:border-slate-400"}
                      >
                        Pending
                      </Button>
                      <Button
                        variant={statusFilter === "approved" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusFilter("approved")}
                        className={statusFilter === "approved" ? "bg-emerald-500 hover:bg-emerald-600" : "border-slate-300 hover:border-slate-400"}
                      >
                        Approved
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Enhanced Responsive Table */}
                <div className="overflow-hidden">

                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-y border-slate-200">
                          <tr>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Proposal
                            </th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Organization
                            </th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Assigned
                            </th>
                            <th className="text-center py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredProposals.map((proposal, index) => (
                            <tr
                              key={proposal.id}
                              className={`hover:bg-slate-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                }`}
                            >
                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <div className="font-medium text-slate-900 text-sm">
                                    {proposal.title}
                                  </div>
                                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                                    {proposal.category}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm text-slate-900">
                                  {proposal.organization}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm text-slate-600">
                                  {new Date(proposal.submittedOn).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge
                                  className={
                                    proposal.status === "approved"
                                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                                      : proposal.status === "pending"
                                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                                        : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                  }
                                >
                                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm text-slate-900">
                                  {proposal.assignedTo}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile/Tablet Cards */}
                  <div className="lg:hidden p-4 space-y-4">
                    {filteredProposals.map((proposal) => (
                      <Card key={proposal.id} className="border-slate-200 hover:shadow-md transition-shadow bg-white/90">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 text-sm">
                                  {proposal.title}
                                </h4>
                                <p className="text-xs text-slate-600">
                                  {proposal.organization}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 hover:bg-slate-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <Badge
                                className={
                                  proposal.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                                    : proposal.status === "pending"
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                                      : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                }
                              >
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(proposal.submittedOn).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                              Assigned to: <span className="font-medium">{proposal.assignedTo}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Enhanced Pagination */}
                  <div className="bg-slate-50 px-4 py-3 sm:px-6 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-sm text-slate-600">
                        Showing <span className="font-medium">{filteredProposals.length}</span> of{' '}
                        <span className="font-medium">{recentProposals.length}</span> proposals
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled className="border-slate-300">
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled className="border-slate-300">
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Upcoming Events */}
          <div className="xl:col-span-1">
            <Card className="shadow-sm border-slate-200 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle className="text-lg text-slate-900">Upcoming Events</CardTitle>
                  <p className="text-sm text-slate-600">
                    Events scheduled for the next 7 days
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    title={event.title}
                    eventId={event.id}
                    date={event.date}
                    time={event.time}
                    location={event.location}
                    attendees={event.attendees}
                    status={event.status}
                    category={event.category}
                  />
                ))}

                <Button
                  variant="ghost"
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    router.push("/admin-dashboard/events?filter=upcoming&timeframe=7days")
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Events
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
