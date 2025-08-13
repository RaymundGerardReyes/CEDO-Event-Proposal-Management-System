"use client"

import { DraftProvider, useDraftContext } from '@/contexts/draft-context'
import { useDraft } from '@/hooks/useDraft'

function TestContextComponent() {
    try {
        const context = useDraftContext()
        return (
            <div className="p-4 bg-green-100 border border-green-400 rounded mb-4">
                <h2 className="text-green-800 font-bold">✅ Context Working!</h2>
                <p className="text-green-700">Context loaded successfully</p>
                <p className="text-green-700">Is Initialized: {context.isInitialized ? 'Yes' : 'No'}</p>
                <p className="text-green-700">Current Draft ID: {context.currentDraftId || 'None'}</p>
                <p className="text-green-700">Loading: {context.loading ? 'Yes' : 'No'}</p>
            </div>
        )
    } catch (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
                <h2 className="text-red-800 font-bold">❌ Context Failed!</h2>
                <p className="text-red-700">Error: {error.message}</p>
            </div>
        )
    }
}

function TestUseDraftComponent() {
    try {
        const draftHook = useDraft('test-draft-id')
        return (
            <div className="p-4 bg-blue-100 border border-blue-400 rounded mb-4">
                <h2 className="text-blue-800 font-bold">✅ useDraft Hook Working!</h2>
                <p className="text-blue-700">Loading: {draftHook.loading ? 'Yes' : 'No'}</p>
                <p className="text-blue-700">Error: {draftHook.error || 'None'}</p>
                <p className="text-blue-700">Has Draft: {draftHook.hasDraft() ? 'Yes' : 'No'}</p>
                <p className="text-blue-700">Draft Status: {draftHook.getDraftStatus()}</p>
            </div>
        )
    } catch (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
                <h2 className="text-red-800 font-bold">❌ useDraft Hook Failed!</h2>
                <p className="text-red-700">Error: {error.message}</p>
            </div>
        )
    }
}

export default function TestDraftContextPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-8">Draft Context Test</h1>

            <DraftProvider>
                <TestContextComponent />
                <TestUseDraftComponent />
            </DraftProvider>
        </div>
    )
}
