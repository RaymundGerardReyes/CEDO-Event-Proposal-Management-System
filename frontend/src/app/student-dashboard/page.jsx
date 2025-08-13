// frontend/src/app/student-dashboard/page.jsx

"use client"

import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import Progress from '@/components/dashboard/student/ui/progress';
import { Tabs, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { Calendar, ChevronRight, Clock, FileText, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";

// ✅ Enhanced Memoized StatCard component with better responsive design
const StatCard = memo(({ title, value, icon: Icon, bgColor, textColor }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-4 sm:p-6 flex justify-between items-center">
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm sm:text-base lg:text-lg font-medium ${textColor} mb-1 truncate`}>
          {title}
        </h3>
        <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${textColor} tabular-nums`}>
          {value}
        </p>
      </div>
      <div className={`${bgColor} p-2 sm:p-3 rounded-full flex-shrink-0 ml-2 sm:ml-4`}>
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${textColor}`} aria-hidden="true" />
      </div>
    </CardContent>
  </Card>
));

StatCard.displayName = "StatCard";

// ✅ Enhanced Memoized ProgressItem component
const ProgressItem = memo(({ label, current, total, value }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm sm:text-base font-medium truncate">{label}</span>
      <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0 ml-2">
        {current} / {total}
      </span>
    </div>
    <Progress value={value} className="h-2 sm:h-2.5" />
  </div>
));

ProgressItem.displayName = "ProgressItem";

// ✅ Enhanced Memoized EventRow component with better mobile design
const EventRow = memo(({ event, activeTab }) => {
  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="py-3 pl-4 pr-3 sm:pl-0">
        <div className="font-medium text-gray-900 text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
          {event.title}
        </div>
        <div className="text-xs sm:text-sm text-gray-500 mt-1 capitalize">{event.type}</div>
      </td>
      <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-gray-500 hidden xs:table-cell">
        {event.date}
      </td>
      <td className="px-2 sm:px-3 py-3">
        <Badge
          variant={event.status === 'approved' ? 'default' : event.status === 'pending' ? 'secondary' : 'destructive'}
          className={`text-xs ${event.status === 'approved'
            ? 'bg-green-100 text-green-800 hover:bg-green-100'
            : event.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
              : 'bg-red-100 text-red-800 hover:bg-red-100'
            }`}
        >
          {event.status}
        </Badge>
      </td>
      <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-gray-500 text-center">
        {event.credits}
      </td>
    </tr>
  );
});

EventRow.displayName = "EventRow";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Authentication and routing
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const router = useRouter();

  // ✅ Enhanced authentication state management
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait for auth to be initialized
      if (!isInitialized) {
        console.log('🔄 Dashboard: Waiting for auth initialization...');
        return;
      }

      // If auth is still loading, wait
      if (authLoading) {
        console.log('🔄 Dashboard: Auth is loading...');
        return;
      }

      // If no user and auth is initialized, redirect to login
      if (!user && isInitialized) {
        console.log('❌ Dashboard: No user found, redirecting to login');
        router.push('/auth/sign-in?redirect=/student-dashboard');
        return;
      }

      // If user exists and auth is initialized, allow access
      if (user && isInitialized) {
        console.log('✅ Dashboard: User authenticated:', user.role);
        setAuthChecked(true);
      }
    };

    checkAuthAndRedirect();
  }, [user, authLoading, isInitialized, router]);

  // Simplified data fetching with fallback
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch data if authentication is confirmed
      if (!authChecked) {
        return;
      }

      try {
        setLoading(true);
        // Use fallback data for now to test routing
        const fallbackData = {
          sdpCredits: {
            totalEarned: 12,
            pending: 3,
            totalRequired: 36
          },
          events: {
            upcoming: 2,
            total: 8,
            approved: 5,
            pending: 2,
            draft: 1,
            rejected: 0
          },
          progress: {
            overallPercentage: 33,
            overallText: "12 of 36 credits",
            categories: {
              leadership: { current: 4, total: 12, percentage: 33 },
              communityService: { current: 5, total: 12, percentage: 42 },
              professionalDevelopment: { current: 3, total: 12, percentage: 25 }
            }
          },
          recentEvents: [
            {
              id: 1,
              title: "Community Service Event",
              type: "community",
              date: "2024-01-15",
              status: "approved",
              credits: 3
            },
            {
              id: 2,
              title: "Leadership Workshop",
              type: "leadership",
              date: "2024-01-20",
              status: "pending",
              credits: 2
            }
          ]
        };

        setDashboardData(fallbackData);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authChecked]);

  // Memoized computed values
  const stats = useMemo(() => {
    if (!dashboardData) return null;

    return {
      totalCredits: dashboardData.sdpCredits.totalEarned,
      pendingCredits: dashboardData.sdpCredits.pending,
      totalRequired: dashboardData.sdpCredits.totalRequired,
      progressPercentage: dashboardData.progress.overallPercentage,
      upcomingEvents: dashboardData.events.upcoming,
      totalEvents: dashboardData.events.total
    };
  }, [dashboardData]);

  // Show loading state while auth is being checked
  if (!authChecked || authLoading || !isInitialized) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Dashboard data could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your SDP credits and event progress</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/student-dashboard/submit-event">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              Submit New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Credits"
          value={stats.totalCredits}
          icon={FileText}
          bgColor="bg-blue-100"
          textColor="text-blue-600"
        />
        <StatCard
          title="Pending Credits"
          value={stats.pendingCredits}
          icon={Clock}
          bgColor="bg-yellow-100"
          textColor="text-yellow-600"
        />
        <StatCard
          title="Progress"
          value={`${stats.progressPercentage}%`}
          icon={Calendar}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        <StatCard
          title="Upcoming Events"
          value={stats.upcomingEvents}
          icon={ChevronRight}
          bgColor="bg-purple-100"
          textColor="text-purple-600"
        />
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-500">{dashboardData.progress.overallText}</span>
          </div>
          <Progress value={stats.progressPercentage} className="h-3" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <ProgressItem
              label="Leadership"
              current={dashboardData.progress.categories.leadership.current}
              total={dashboardData.progress.categories.leadership.total}
              value={dashboardData.progress.categories.leadership.percentage}
            />
            <ProgressItem
              label="Community Service"
              current={dashboardData.progress.categories.communityService.current}
              total={dashboardData.progress.categories.communityService.total}
              value={dashboardData.progress.categories.communityService.percentage}
            />
            <ProgressItem
              label="Professional Development"
              current={dashboardData.progress.categories.professionalDevelopment.current}
              total={dashboardData.progress.categories.professionalDevelopment.total}
              value={dashboardData.progress.categories.professionalDevelopment.percentage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {dashboardData.recentEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Event</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 hidden xs:table-cell">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentEvents.map((event) => (
                    <EventRow key={event.id} event={event} activeTab={activeTab} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No events found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}