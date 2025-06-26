"use client"

import { ProposalTable } from '@/components/dashboard/admin/proposal-table'

export default function TestProposalTablePage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Proposal Table Test</h1>
                <p className="text-gray-600 mt-2">Testing the ProposalTable component with MySQL backend data</p>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                        <strong>API Endpoint:</strong> /api/mongodb-unified/admin/proposals-hybrid
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">All Proposals</h2>
                    <ProposalTable statusFilter="all" />
                </div>
            </div>
        </div>
    )
} 