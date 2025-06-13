"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';
import { PageHeader } from "@/components/dashboard/admin/page-header";
import { ProposalTable } from "@/components/dashboard/admin/proposal-table";
import { Card, CardContent } from "@/components/dashboard/admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs";
import { Suspense } from 'react'; // Added Suspense import

const ProposalsPage = () => {
  // Enhanced fallback UI for Suspense with responsive design
  const ProposalTableFallback = () => (
    <div className="@container w-full max-w-full overflow-hidden">
      <div className="space-y-4 sm:space-y-6">
        <div className="border-l-4 border-l-blue-500 shadow-lg bg-white rounded-lg">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm sm:text-base text-gray-600">Loading proposals...</span>
            </div>
            {/* Enhanced skeleton cards */}
            <div className="mt-6 space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse p-4 border rounded-lg bg-gray-50"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex flex-col @md:flex-row @md:space-x-4 space-y-3 @md:space-y-0">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f8f9fa] p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="@container w-full max-w-full">
        <PageHeader title="Proposals" subtitle="View and manage all your submitted proposals" />

        <Card className="cedo-card shadow-lg border-0">
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100 rounded-lg">
                <TabsTrigger value="all" className="text-xs sm:text-sm py-2 px-2 sm:px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  All Proposals
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm py-2 px-2 sm:px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm py-2 px-2 sm:px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs sm:text-sm py-2 px-2 sm:px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Rejected
                </TabsTrigger>
                <TabsTrigger value="drafts" className="text-xs sm:text-sm py-2 px-2 sm:px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Drafts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <Suspense fallback={<ProposalTableFallback />}>
                  <ProposalTable statusFilter="all" />
                </Suspense>
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <Suspense fallback={<ProposalTableFallback />}>
                  <ProposalTable statusFilter="pending" />
                </Suspense>
              </TabsContent>

              <TabsContent value="approved" className="space-y-4">
                <Suspense fallback={<ProposalTableFallback />}>
                  <ProposalTable statusFilter="approved" />
                </Suspense>
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                <Suspense fallback={<ProposalTableFallback />}>
                  <ProposalTable statusFilter="rejected" />
                </Suspense>
              </TabsContent>

              <TabsContent value="drafts" className="space-y-4">
                <Suspense fallback={<ProposalTableFallback />}>
                  <ProposalTable statusFilter="draft" />
                </Suspense>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProposalsPage;