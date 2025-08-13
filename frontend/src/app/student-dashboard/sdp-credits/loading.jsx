// frontend/src/app/student-dashboard/sdp-credits/loading.jsx

import { Card, CardContent, CardHeader } from "@/components/dashboard/student/ui/card"
import { Skeleton } from "@/components/dashboard/student/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs"

export default function Loading() {
  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section - Responsive Skeleton */}
      <div className="space-y-1 sm:space-y-2">
        <Skeleton className="h-6 sm:h-8 lg:h-10 w-32 sm:w-48 lg:w-64" />
        <Skeleton className="h-3 sm:h-4 w-48 sm:w-72 lg:w-96" />
      </div>

      {/* Progress Cards - Responsive Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Overall Progress Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 space-y-2 sm:space-y-0">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 sm:h-5 lg:h-6 w-24 sm:w-32" />
              <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" />
            </div>
            <Skeleton className="h-3 sm:h-4 w-28 sm:w-36" />
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Progress Bar Skeleton */}
            <div className="space-y-1 sm:space-y-2">
              <Skeleton className="h-2 sm:h-2.5 w-full rounded-full" />
              <div className="flex justify-end">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
              </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gray-50 space-y-1 sm:space-y-2">
                <Skeleton className="h-5 sm:h-8 lg:h-10 w-8 sm:w-12 lg:w-16" />
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-gray-50 space-y-1 sm:space-y-2">
                <Skeleton className="h-5 sm:h-8 lg:h-10 w-8 sm:w-12 lg:w-16" />
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-gray-50 space-y-1 sm:space-y-2">
                <Skeleton className="h-5 sm:h-8 lg:h-10 w-8 sm:w-12 lg:w-16" />
                <Skeleton className="h-3 sm:h-4 w-14 sm:w-18" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits by Category Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <Skeleton className="h-4 sm:h-5 lg:h-6 w-32 sm:w-40" />
            <Skeleton className="h-3 sm:h-4 w-40 sm:w-56" />
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Category Progress Skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-28" />
                  <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                </div>
                <Skeleton className="h-1.5 sm:h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Credit History Card - Enhanced Responsive Design */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 space-y-2 sm:space-y-0">
          <div className="space-y-1 sm:space-y-2">
            <Skeleton className="h-4 sm:h-5 lg:h-6 w-28 sm:w-36" />
            <Skeleton className="h-3 sm:h-4 w-48 sm:w-64" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-full sm:w-20 rounded-md" />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="balance">
            {/* Responsive Tab Skeleton */}
            <TabsList className="mb-4 w-full grid grid-cols-2 sm:w-auto sm:inline-flex" disabled>
              <TabsTrigger value="approved" disabled className="text-xs sm:text-sm">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
              </TabsTrigger>
              <TabsTrigger value="pending" disabled className="text-xs sm:text-sm">
                <Skeleton className="h-3 sm:h-4 w-14 sm:w-18" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balance">
              {/* Mobile: Card Layout Skeleton */}
              <div className="space-y-3 sm:hidden">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop: Table Layout Skeleton */}
              <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="text-left">
                        <th scope="col" className="py-2 sm:py-3 pl-4 pr-3 sm:pl-0">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3">
                          <Skeleton className="h-3 sm:h-4 w-8 sm:w-12" />
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3">
                          <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3 text-right">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 ml-auto" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[1, 2, 3, 4].map((i) => (
                        <tr key={i}>
                          <td className="whitespace-nowrap py-3 sm:py-4 pl-4 pr-3 sm:pl-0">
                            <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4">
                            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4">
                            <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-right">
                            <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 ml-auto rounded-full" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Event Participants Section Skeleton */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 space-y-2 sm:space-y-0">
          <div className="space-y-1 sm:space-y-2">
            <Skeleton className="h-4 sm:h-5 lg:h-6 w-32 sm:w-40" />
            <Skeleton className="h-3 sm:h-4 w-40 sm:w-56" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-full sm:w-16 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Filter Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-10 sm:h-9 w-full rounded-md" />
          </div>

          {/* Event List Skeleton */}
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-md overflow-hidden">
                <div className="flex items-center justify-between p-3 sm:p-4 min-h-[60px] sm:min-h-[auto]">
                  <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                    <Skeleton className="h-4 sm:h-5 w-32 sm:w-48" />
                    <Skeleton className="h-3 sm:h-4 w-24 sm:w-36" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 ml-3">
                    <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 rounded-full" />
                    <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="mt-4 sm:mt-6 flex justify-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-md" />
              <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded-md" />
              <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded-md" />
              <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded-md" />
              <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
