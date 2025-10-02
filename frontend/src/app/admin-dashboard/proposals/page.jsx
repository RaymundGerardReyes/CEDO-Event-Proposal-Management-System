// frontend/src/app/admin-dashboard/proposals/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { ProposalTable } from "@/components/dashboard/admin/proposal-table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from 'react';

function ProposalsPage() {
  return (
    <div className="flex-1 p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Proposals</h1>
        <p className="text-sm text-muted-foreground">Review, approve, or deny submitted proposals</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="denied">Denied</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Suspense>
                <ProposalTable statusFilter="all" />
              </Suspense>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <Suspense>
                <ProposalTable statusFilter="pending" />
              </Suspense>
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              <Suspense>
                <ProposalTable statusFilter="approved" />
              </Suspense>
            </TabsContent>

            <TabsContent value="denied" className="space-y-4">
              <Suspense>
                <ProposalTable statusFilter="denied" />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProposalsPage;