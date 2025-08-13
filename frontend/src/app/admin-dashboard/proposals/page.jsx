// frontend/src/app/admin-dashboard/proposals/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';
import { PageHeader } from "@/components/dashboard/admin/page-header";
import { ProposalTable } from "@/components/dashboard/admin/proposal-table";
import { Card, CardContent } from "@/components/dashboard/admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs";
import { Suspense, useState } from 'react'; // Added useState

const ProposalsPage = () => {
  // ✅ Single state to manage current active tab/status filter
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');

  // Enhanced fallback UI for Suspense with zoom-perfect responsive design
  const ProposalTableFallback = () => (
    <div className="w-full max-w-full zoom-safe">
      <div className="space-y-fluid">
        <div className="border-l-4 border-l-blue-500 shadow-sm bg-white rounded-lg zoom-safe">
          <div className="p-fluid">
            <div className="responsive-flex-between gap-fluid-sm">
              <div
                className="animate-spin rounded-full border-b-2 border-blue-600 zoom-safe"
                style={{
                  width: 'clamp(1.25rem, 2.5vw, 1.5rem)',
                  height: 'clamp(1.25rem, 2.5vw, 1.5rem)'
                }}
              ></div>
              <span
                className="text-gray-600 zoom-safe"
                style={{ fontSize: 'clamp(0.875rem, 1.75vw, 1rem)' }}
              >
                Loading proposals...
              </span>
            </div>
            {/* Zoom-perfect skeleton cards with fluid spacing */}
            <div className="mt-fluid space-y-fluid-xs">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse border rounded-lg bg-gray-50 zoom-safe"
                  style={{
                    padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                    animationDelay: `${index * 150}ms`
                  }}
                >
                  <div className="responsive-flex-between gap-fluid-sm">
                    <div
                      className="bg-gray-200 rounded flex-1 zoom-safe"
                      style={{ height: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}
                    ></div>
                    <div
                      className="bg-gray-200 rounded zoom-safe"
                      style={{
                        height: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                        width: 'clamp(5rem, 10vw, 6rem)'
                      }}
                    ></div>
                    <div
                      className="bg-gray-200 rounded zoom-safe"
                      style={{
                        height: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                        width: 'clamp(3rem, 6vw, 3.5rem)'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Handle tab changes and update status filter
  const handleTabChange = (newValue) => {
    console.log('🔄 Tab changed from', activeStatusFilter, 'to', newValue);
    setActiveStatusFilter(newValue);
  };

  return (
    <div
      className="flex-1 bg-[#f8f9fa] min-h-screen zoom-safe"
      style={{ padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}
    >
      <div className="w-full max-w-full space-y-fluid zoom-safe">
        <PageHeader
          title="Proposals"
          subtitle="View and manage all your submitted proposals"
        />

        <Card className="cedo-card shadow-sm border-0 zoom-safe">
          <CardContent style={{ padding: 'clamp(0.75rem, 3vw, 1.25rem)' }}>
            <Tabs
              defaultValue="all"
              value={activeStatusFilter}
              onValueChange={handleTabChange}
              className="space-y-fluid zoom-safe"
            >
              <div className="overflow-x-auto zoom-safe">
                <TabsList className="inline-flex w-auto min-w-full grid-cols-5 bg-gray-100 rounded-lg zoom-safe"
                  style={{
                    height: 'auto',
                    padding: 'clamp(0.25rem, 0.5vw, 0.375rem)'
                  }}
                >
                  <TabsTrigger
                    value="all"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap zoom-safe"
                    style={{
                      fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                      padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem)'
                    }}
                  >
                    All Proposals
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap zoom-safe"
                    style={{
                      fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                      padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem)'
                    }}
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap zoom-safe"
                    style={{
                      fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                      padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem)'
                    }}
                  >
                    Approved
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap zoom-safe"
                    style={{
                      fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                      padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem)'
                    }}
                  >
                    Rejected
                  </TabsTrigger>
                  <TabsTrigger
                    value="drafts"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap zoom-safe"
                    style={{
                      fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                      padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem)'
                    }}
                  >
                    Drafts
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ✅ Single ProposalTable that reacts to status filter changes */}
              <div
                className="zoom-safe"
                style={{ marginTop: 'clamp(0.75rem, 1.5vw, 1rem)' }}
              >
                <Suspense fallback={<ProposalTableFallback />}>
                  <ProposalTable
                    statusFilter={activeStatusFilter === 'drafts' ? 'draft' : activeStatusFilter}
                    key={activeStatusFilter} // Force re-mount on filter change to ensure fresh data
                  />
                </Suspense>
              </div>

              {/* ✅ Keep TabsContent for proper tab functionality but don't render separate tables */}
              <TabsContent value="all" className="hidden" />
              <TabsContent value="pending" className="hidden" />
              <TabsContent value="approved" className="hidden" />
              <TabsContent value="rejected" className="hidden" />
              <TabsContent value="drafts" className="hidden" />
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProposalsPage;