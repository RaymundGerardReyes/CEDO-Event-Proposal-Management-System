"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getEventProposalDraft, getEventType } from '@/lib/utils/eventProposalStorage';
import { useEffect, useState } from 'react';

/**
 * Comprehensive Event Type Debugger
 * Purpose: Debug the entire event type flow through the [draftId] directory
 * Key approaches: Real-time monitoring, localStorage inspection, data flow tracking
 */
export default function EventTypeDebugger({ draftId }) {
    const [debugData, setDebugData] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);

    const collectDebugData = () => {
        const data = {
            timestamp: new Date().toISOString(),
            draftId,

            // 1. Unified Storage Analysis
            unifiedStorage: {
                exists: false,
                data: null,
                eventType: null,
                sections: null
            },

            // 2. Legacy Storage Analysis
            legacyStorage: {
                eventTypeSelection: null,
                selectedEventType: null,
                eventProposalFormData: null,
                cedoFormData: null
            },

            // 3. Function Results
            functionResults: {
                getEventProposalDraft: null,
                getEventType: null
            },

            // 4. localStorage Raw Data
            localStorageRaw: {}
        };

        try {
            // Check unified storage
            const unifiedData = localStorage.getItem('eventProposalDraft');
            data.unifiedStorage.exists = !!unifiedData;
            if (unifiedData) {
                data.unifiedStorage.data = JSON.parse(unifiedData);
                data.unifiedStorage.eventType = data.unifiedStorage.data?.sections?.eventType;
                data.unifiedStorage.sections = data.unifiedStorage.data?.sections;
            }

            // Check legacy storage
            const eventTypeSelection = localStorage.getItem('eventTypeSelection');
            data.legacyStorage.eventTypeSelection = eventTypeSelection ? JSON.parse(eventTypeSelection) : null;

            data.legacyStorage.selectedEventType = localStorage.getItem('selectedEventType');

            const eventProposalFormData = localStorage.getItem('eventProposalFormData');
            data.legacyStorage.eventProposalFormData = eventProposalFormData ? JSON.parse(eventProposalFormData) : null;

            const cedoFormData = localStorage.getItem('cedoFormData');
            data.legacyStorage.cedoFormData = cedoFormData ? JSON.parse(cedoFormData) : null;

            // Test function results
            try {
                const draft = getEventProposalDraft(draftId);
                data.functionResults.getEventProposalDraft = draft;
                data.functionResults.getEventType = getEventType(draft);
            } catch (error) {
                data.functionResults.error = error.message;
            }

            // Get all localStorage keys for this draft
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('event') || key.includes('draft') || key.includes('proposal'))) {
                    try {
                        const value = localStorage.getItem(key);
                        data.localStorageRaw[key] = value;
                    } catch (error) {
                        data.localStorageRaw[key] = `Error reading: ${error.message}`;
                    }
                }
            }

        } catch (error) {
            data.error = error.message;
        }

        setDebugData(data);
        return data;
    };

    useEffect(() => {
        collectDebugData();

        // Auto-refresh every 2 seconds
        const interval = setInterval(collectDebugData, 2000);
        return () => clearInterval(interval);
    }, [draftId]);

    const getEventTypeDisplay = (eventType) => {
        if (!eventType) return '❌ Not Set';
        if (eventType === 'community-based') return '✅ Community-Based Event';
        if (eventType === 'school-based') return '✅ School-Based Event';
        return `❓ Unknown: ${eventType}`;
    };

    const getStatusBadge = (condition, label) => {
        return (
            <Badge variant={condition ? "default" : "destructive"}>
                {condition ? "✅" : "❌"} {label}
            </Badge>
        );
    };

    return (
        <Card className="w-full max-w-4xl mx-auto mb-6 border-2 border-orange-300 bg-orange-50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-orange-800">
                        🔍 Event Type Debugger - Draft: {draftId}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={collectDebugData}
                        >
                            🔄 Refresh
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? "📦" : "📂"} {isExpanded ? "Collapse" : "Expand"}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Unified Storage</h3>
                        {getStatusBadge(debugData.unifiedStorage?.exists, "Exists")}
                        {getStatusBadge(!!debugData.unifiedStorage?.eventType, "Has Event Type")}
                        <div className="text-xs">
                            {getEventTypeDisplay(debugData.unifiedStorage?.eventType?.eventType)}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Legacy Storage</h3>
                        {getStatusBadge(!!debugData.legacyStorage?.eventTypeSelection, "eventTypeSelection")}
                        {getStatusBadge(!!debugData.legacyStorage?.selectedEventType, "selectedEventType")}
                        <div className="text-xs">
                            {getEventTypeDisplay(debugData.legacyStorage?.selectedEventType)}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Function Results</h3>
                        {getStatusBadge(!!debugData.functionResults?.getEventType, "getEventType()")}
                        <div className="text-xs">
                            {getEventTypeDisplay(debugData.functionResults?.getEventType)}
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <>
                        <Separator />

                        {/* Detailed Analysis */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-sm mb-2">🔍 Unified Storage Details</h3>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(debugData.unifiedStorage, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h3 className="font-semibold text-sm mb-2">🔍 Legacy Storage Details</h3>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(debugData.legacyStorage, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h3 className="font-semibold text-sm mb-2">🔍 Function Results Details</h3>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(debugData.functionResults, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h3 className="font-semibold text-sm mb-2">🔍 All localStorage Keys</h3>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(debugData.localStorageRaw, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
} 