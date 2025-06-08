"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';
import { PageHeader } from "@/components/dashboard/admin/page-header";
import { ProposalTable } from "@/components/dashboard/admin/proposal-table";
import { Card, CardContent } from "@/components/dashboard/admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs";
import { Suspense } from 'react'; // Added Suspense import

const ProposalsPage = () => {
  // Define a fallback UI for Suspense
  const ProposalTableFallback = () => <div>Loading proposals...</div>;

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="Proposals" subtitle="View and manage all your submitted proposals" />

      <Card className="cedo-card">
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Proposals</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
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
  )
}

export default ProposalsPage;