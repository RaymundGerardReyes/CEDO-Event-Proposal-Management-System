"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"

// Loading component for Suspense fallback
function NewProposalLoading() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-8"></div>
                    <div className="h-20 w-full bg-gray-100 rounded animate-pulse"></div>
                </div>
            </CardContent>
        </Card>
    )
}

// This component uses clientside-only hooks
function NewProposalContent() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-primary">Create New Proposal</h2>
                    <p>Use this form to submit a new proposal</p>

                    {/* Form would go here */}
                    <div className="py-8 text-center text-muted-foreground">
                        Proposal form placeholder
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Main page export
export default function NewProposalPage() {
    return (
        <div className="container mx-auto py-6">
            <PageHeader heading="New Proposal" subheading="Create a new proposal" />

            <div className="mt-6">
                <Suspense fallback={<NewProposalLoading />}>
                    <NewProposalContent />
                </Suspense>
            </div>
        </div>
    )
}
