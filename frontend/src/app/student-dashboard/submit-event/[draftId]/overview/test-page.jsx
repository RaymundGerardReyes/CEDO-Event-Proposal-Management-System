"use client";

import { useDraftContext } from '@/contexts/draft-context';

export default function TestPage() {
    console.log('🔄 TestPage: Component rendering');

    try {
        const context = useDraftContext();
        console.log('✅ TestPage: Context loaded successfully', context);

        return (
            <div className="p-8 bg-blue-50 min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Test Page - Overview</h1>
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-2">Context Status:</h2>
                    <ul className="space-y-1">
                        <li>✅ Is Initialized: {context.isInitialized ? 'Yes' : 'No'}</li>
                        <li>✅ Current Draft ID: {context.currentDraftId || 'None'}</li>
                        <li>✅ Loading: {context.loading ? 'Yes' : 'No'}</li>
                        <li>✅ Drafts Count: {context.drafts.size}</li>
                    </ul>
                </div>
            </div>
        );
    } catch (error) {
        console.error('❌ TestPage: Context error', error);

        return (
            <div className="p-8 bg-red-50 min-h-screen">
                <h1 className="text-2xl font-bold mb-4 text-red-800">Test Page - Error</h1>
                <div className="bg-white p-4 rounded shadow border border-red-200">
                    <h2 className="text-lg font-semibold mb-2 text-red-800">Context Error:</h2>
                    <p className="text-red-600">{error.message}</p>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {error.stack}
                    </pre>
                </div>
            </div>
        );
    }
}





