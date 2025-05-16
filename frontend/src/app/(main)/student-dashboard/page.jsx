"use client"

import { EventCalendar } from "@/components/event-calendar"
import { EventList } from "@/components/event-list"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMobile } from "@/hooks/use-mobile"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

// Search params component that needs to be wrapped in Suspense
function EventSearch() {
    const searchParams = useSearchParams()
    const view = searchParams.get("view") || "calendar"

    return (
        <Tabs defaultValue={view} className="w-full">
            <div className="flex justify-between items-center mb-4">
                <TabsList>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="calendar" className="mt-0">
                <EventCalendar />
            </TabsContent>
            <TabsContent value="list" className="mt-0">
                <EventList />
            </TabsContent>
        </Tabs>
    )
}

export default function EventsPage() {
    const isMobile = useMobile()

    return (
        <div className="container mx-auto py-6">
            <PageHeader
                heading="Events"
                subheading="View and manage scheduled events"
                actions={
                    <div className="flex items-center gap-2">
                        {!isMobile && (
                            <>
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                    Export
                                </button>
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                    Create Event
                                </button>
                            </>
                        )}
                    </div>
                }
            />

            <div className="mt-6">
                <Suspense fallback={<div className="text-center py-10">Loading events...</div>}>
                    <EventSearch />
                </Suspense>
            </div>
        </div>
    )
}
