<<<<<<< HEAD
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ProposalsPageContent() {
    const searchParams = useSearchParams();
    // Your logic using searchParams here

    return (
        <div>
            {/* Your proposals page content */}
            <h1>Student Proposals</h1>
            {/* Example: */}
            <p>Query: {searchParams.get("q")}</p>
        </div>
    );
}

export default function ProposalsPage() {
    return (
        <Suspense fallback={<div>Loading proposals...</div>}>
            <ProposalsPageContent />
        </Suspense>
    );
=======
"use client"
import { ProposalTable } from "@/components/proposal-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"

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
              <ProposalTable />
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <ProposalTable />
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              <ProposalTable />
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              <ProposalTable />
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4">
              <ProposalTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
}
