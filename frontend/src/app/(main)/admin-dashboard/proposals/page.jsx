"use client"
import React from 'react';
import { ProposalTable } from "@/components/dashboard/admin/proposal-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs"
import { PageHeader } from "@/components/dashboard/admin/page-header"

const ProposalsPage = () => {
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
}

export default ProposalsPage;
