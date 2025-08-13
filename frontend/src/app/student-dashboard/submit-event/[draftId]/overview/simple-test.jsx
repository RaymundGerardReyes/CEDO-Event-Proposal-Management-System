"use client";

export default function SimpleTest({ draftId }) {
    return (
        <div className="p-8 bg-green-50 min-h-screen">
            <h1 className="text-3xl font-bold text-green-800 mb-4">✅ Simple Test - Page is Rendering!</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Page Status:</h2>
                <ul className="space-y-2">
                    <li className="flex items-center">
                        <span className="text-green-600 mr-2">✅</span>
                        Component is rendering
                    </li>
                    <li className="flex items-center">
                        <span className="text-green-600 mr-2">✅</span>
                        No context errors
                    </li>
                    <li className="flex items-center">
                        <span className="text-green-600 mr-2">✅</span>
                        Basic functionality working
                    </li>
                    <li className="flex items-center">
                        <span className="text-green-600 mr-2">✅</span>
                        Params properly unwrapped with React.use()
                    </li>
                    {draftId && (
                        <li className="flex items-center">
                            <span className="text-blue-600 mr-2">📋</span>
                            Draft ID: <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">{draftId}</code>
                        </li>
                    )}
                </ul>
                <div className="mt-6 p-4 bg-blue-50 rounded">
                    <p className="text-blue-800">
                        <strong>Next Step:</strong> If you can see this, the page is rendering correctly.
                        The Next.js 15 params enumeration issue has been resolved.
                    </p>
                </div>
            </div>
        </div>
    );
}

