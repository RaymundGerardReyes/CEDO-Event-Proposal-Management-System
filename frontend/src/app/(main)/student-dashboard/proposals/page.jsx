"use client" // Ensures this page and its direct children can use client-side hooks

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { PageHeader } from "@/components/page-header";
import { ProposalTable } from "@/components/proposal-table"; // Assuming this is the component using useSearchParams or rendering one that does
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from 'react'; // Import Suspense

// A simple fallback UI. You can customize this with a skeleton loader.
const ProposalsLoadingFallback = () => <div>Loading proposals...</div>;

export default function ProposalsPage() {
  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="Proposals" subtitle="View and manage all your submitted proposals" />

      <Card className="cedo-card">
        <CardHeader>
          <CardTitle className="text-cedo-blue text-xl">Proposal Management</CardTitle>
          <CardDescription>Track the status of your proposals and view feedback</CardDescription>
        </CardHeader>
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
              {/* Wrap the component that uses useSearchParams */}
              <Suspense fallback={<ProposalsLoadingFallback />}>
                <ProposalTable />
              </Suspense>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <Suspense fallback={<ProposalsLoadingFallback />}>
                <ProposalTable />
              </Suspense>
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              <Suspense fallback={<ProposalsLoadingFallback />}>
                <ProposalTable />
              </Suspense>
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              <Suspense fallback={<ProposalsLoadingFallback />}>
                <ProposalTable />
              </Suspense>
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4">
              <Suspense fallback={<ProposalsLoadingFallback />}>
                <ProposalTable />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}