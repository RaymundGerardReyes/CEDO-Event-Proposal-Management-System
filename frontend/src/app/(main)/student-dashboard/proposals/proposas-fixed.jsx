"use client"

import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { useEffect, useState } from "react"

// IMPORTANT: This is a completely new file that MUST replace the existing page.jsx
// After copying this file, rename it to page.jsx and delete the old page.jsx

export default function ProposalsPage() {
    // Use state for all data that would normally come from URL
    const [filter, setFilter] = useState("all")
    const [sort, setSort] = useState("newest")
    const [isLoading, setIsLoading] = useState(true)

    // Read URL parameters after component mount (client-side only)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search)
            setFilter(urlParams.get("filter") || "all")
            setSort(urlParams.get("sort") || "newest")
            setIsLoading(false)
        }
    }, [])

    // Sample proposals data
    const proposals = [
        { id: 1, title: "Research Project A", status: "pending", date: "2025-04-15" },
        { id: 2, title: "Community Service Initiative", status: "approved", date: "2025-03-22" },
        { id: 3, title: "Technology Workshop Series", status: "rejected", date: "2025-05-01" },
        { id: 4, title: "Environmental Awareness Campaign", status: "pending", date: "2025-04-28" },
    ]

    // Filter proposals based on the filter parameter
    const filteredProposals = filter === "all" ? proposals : proposals.filter((proposal) => proposal.status === filter)

    // Sort proposals based on the sort parameter
    const sortedProposals = [...filteredProposals].sort((a, b) => {
        if (sort === "newest") {
            return new Date(b.date) - new Date(a.date)
        } else {
            return new Date(a.date) - new Date(b.date)
        }
    })

    // Update URL when filter or sort changes
    const updateUrlParams = (newFilter, newSort) => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams()
            if (newFilter !== "all") params.set("filter", newFilter)
            if (newSort !== "newest") params.set("sort", newSort)
            const newUrl = params.toString() ? `?${params.toString()}` : ""
            window.history.pushState({}, "", newUrl)
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <PageHeader heading="Proposals" subheading="View and manage your proposals" />
                <div className="mt-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="border-b pb-4">
                                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Main content
    return (
        <div className="container mx-auto py-6">
            <PageHeader heading="Proposals" subheading="View and manage your proposals" />

            <div className="mt-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-semibold">Your Proposals</h2>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Filter:</span>
                                <select
                                    value={filter}
                                    onChange={(e) => {
                                        const newFilter = e.target.value
                                        setFilter(newFilter)
                                        updateUrlParams(newFilter, sort)
                                    }}
                                    className="border rounded px-2 py-1 text-sm"
                                >
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Sort:</span>
                                <select
                                    value={sort}
                                    onChange={(e) => {
                                        const newSort = e.target.value
                                        setSort(newSort)
                                        updateUrlParams(filter, newSort)
                                    }}
                                    className="border rounded px-2 py-1 text-sm"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {sortedProposals.length > 0 ? (
                            sortedProposals.map((proposal) => (
                                <div key={proposal.id} className="border-b pb-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium">{proposal.title}</h3>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${proposal.status === "approved"
                                                ? "bg-green-100 text-green-800"
                                                : proposal.status === "rejected"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">Submitted: {new Date(proposal.date).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <p>No proposals found matching your criteria.</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <Link
                            href="/student-dashboard/proposals/new"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Create New Proposal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
