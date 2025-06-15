// frontend/src/app/(main)/student-dashboard/page.jsx

"use client"

import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import Progress from '@/components/dashboard/student/ui/progress';
import { Tabs, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs";
import { Calendar, ChevronRight, Clock, FileText, PlusCircle } from "lucide-react";
import Link from "next/link";
import { memo, useMemo, useState } from "react";

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

  // ✅ Memoized data to prevent unnecessary recalculations
  const sdpCredits = useMemo(() => ({
    totalEarned: 24,
    pending: 8,
  }), []);

  const recentEvents = useMemo(() => [
    {
      id: "EVENT-001",
      title: "Leadership Workshop",
      date: "2023-05-15",
      status: "approved",
      type: "leadership",
      credits: 5,
    },
    {
      id: "EVENT-002",
      title: "Community Service Day",
      date: "2023-05-10",
      status: "pending",
      type: "volunteerism",
      credits: 10,
    },
    {
      id: "EVENT-003",
      title: "Academic Seminar",
      date: "2023-05-05",
      status: "approved",
      type: "academic",
      credits: 5,
    },
    {
      id: "EVENT-004",
      title: "Research Symposium",
      date: "2023-04-28",
      status: "rejected",
      type: "academic",
      credits: 0,
    },
  ], []);

  // ✅ Memoized calculated values
  const dashboardStats = useMemo(() => {
    const upcomingEventsCount = recentEvents.filter(event =>
      new Date(event.date) > new Date() && (event.status === 'approved' || event.status === 'pending')
    ).length;

    const overallProgressPercentage = 67;
    const overallProgressText = "24 of 36 credits";

    return {
      upcomingEventsCount,
      overallProgressPercentage,
      overallProgressText,
    };
  }, [recentEvents]);

  // ✅ Memoized filtered events
  const filteredEvents = useMemo(() => {
    if (activeTab === "all") return recentEvents;
    return recentEvents.filter(event => event.status === activeTab);
  }, [recentEvents, activeTab]);

  return (
    <>
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 lg:items-center">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Track your Scholars Development Program events and credits
            </p>
          </div>
          <Link href="/student-dashboard/submit-event" prefetch={true}>
            <Button className="bg-[#001a56] hover:bg-[#001a56]/90 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="text-sm sm:text-base">New Event</span>
            </Button>
          </Link>
        </div>

        {/* Enhanced SDP Credits Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <StatCard
            title="Total SDP Credits"
            value={sdpCredits.totalEarned}
            icon={FileText}
            bgColor="bg-[#001a56]/10"
            textColor="text-[#001a56]"
          />

          <StatCard
            title="Pending Credits"
            value={sdpCredits.pending}
            icon={Clock}
            bgColor="bg-[#f0c14b]/10"
            textColor="text-[#001a56]"
          />

          <StatCard
            title="Upcoming Events"
            value={dashboardStats.upcomingEventsCount}
            icon={Calendar}
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
        </div>

        {/* Enhanced Credit Progress */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Credit Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 xl:grid-cols-2">
              {/* Overall Progress */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm sm:text-base">Overall Progress</h4>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {dashboardStats.overallProgressText}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#f0c14b]">
                  <div
                    className="h-2.5 rounded-full bg-[#001a56] transition-all duration-500 ease-out"
                    style={{ width: `${dashboardStats.overallProgressPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={dashboardStats.overallProgressPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <div className="text-right text-xs sm:text-sm text-muted-foreground">
                  {dashboardStats.overallProgressPercentage}% complete
                </div>
              </div>

              {/* Category Progress */}
              <div className="space-y-4 sm:space-y-6">
                <ProgressItem label="Leadership" current={8} total={12} value={67} />
                <ProgressItem label="Community Service" current={10} total={12} value={83} />
                <ProgressItem label="Professional Development" current={6} total={12} value={50} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Events */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Recent Events</CardTitle>
            <Link href="/student-dashboard/events" prefetch={true}>
              <Button variant="ghost" size="sm" className="gap-1 text-[#001a56] w-full sm:w-auto">
                View All
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Enhanced Tabs */}
              <TabsList className="mb-4 w-full grid grid-cols-4 h-auto p-1 sm:w-auto sm:inline-flex sm:h-10">
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5"
                >
                  Approved
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5"
                >
                  Draft
                </TabsTrigger>
              </TabsList>

              {/* Enhanced Table with Better Mobile Responsiveness */}
              <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-gray-200">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs sm:text-sm font-medium text-muted-foreground">
                        <th scope="col" className="py-3 pl-4 pr-3 sm:pl-6">
                          Event
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-3 hidden xs:table-cell">
                          Date
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-3">
                          Status
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-3 text-center">
                          Credits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                          <EventRow key={event.id} event={event} activeTab={activeTab} />
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center space-y-2">
                              <FileText className="h-8 w-8 text-gray-300" />
                              <p className="text-sm sm:text-base">
                                No {activeTab !== "all" ? activeTab : ""} events found
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}