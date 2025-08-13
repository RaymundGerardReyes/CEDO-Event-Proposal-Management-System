"use client";

import { useDraftContext } from '@/contexts/draft-context';

export default function DebugComponent() {
    try {
        const context = useDraftContext();
        return (
            <div className="p-4 bg-green-100 border border-green-400 rounded mb-4">
                <h3 className="text-green-800 font-bold">✅ Context Debug Info</h3>
                <p className="text-green-700">Is Initialized: {context.isInitialized ? 'Yes' : 'No'}</p>
                <p className="text-green-700">Current Draft ID: {context.currentDraftId || 'None'}</p>
                <p className="text-green-700">Loading: {context.loading ? 'Yes' : 'No'}</p>
                <p className="text-green-700">Drafts Count: {context.drafts.size}</p>
            </div>
        );
    } catch (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
                <h3 className="text-red-800 font-bold">❌ Context Debug Error</h3>
                <p className="text-red-700">Error: {error.message}</p>
            </div>
        );
    }
}





