"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getEventProposalDraft, getEventType, updateDraftSection } from '@/lib/utils/eventProposalStorage';
import { useState } from 'react';

/**
 * Manual Test Panel
 * Purpose: Provide manual testing capabilities for event type debugging
 * Key approaches: Manual data manipulation, function testing, storage inspection
 */
export default function ManualTestPanel({ draftId }) {
    const [testEventType, setTestEventType] = useState('community-based');
    const [testResult, setTestResult] = useState(null);

    const runManualTest = () => {
        const results = {
            timestamp: new Date().toISOString(),
            testEventType,
            steps: []
        };

        try {
            // Step 1: Get current draft
            results.steps.push({
                step: 'Get current draft',
                data: getEventProposalDraft(draftId),
                status: 'success'
            });

            // Step 2: Update event type manually
            updateDraftSection('eventType', {
                eventType: testEventType,
                selectedEventType: testEventType
            }, draftId);
            results.steps.push({
                step: 'Update event type manually',
                data: { eventType: testEventType },
                status: 'success'
            });

            // Step 3: Get updated draft
            const updatedDraft = getEventProposalDraft(draftId);
            results.steps.push({
                step: 'Get updated draft',
                data: updatedDraft,
                status: 'success'
            });

            // Step 4: Test getEventType function
            const eventType = getEventType(updatedDraft);
            results.steps.push({
                step: 'Test getEventType function',
                data: { result: eventType },
                status: eventType === testEventType ? 'success' : 'error'
            });

            // Step 5: Check localStorage
            const localStorageData = {
                eventProposalDraft: localStorage.getItem('eventProposalDraft'),
                eventTypeSelection: localStorage.getItem('eventTypeSelection'),
                selectedEventType: localStorage.getItem('selectedEventType'),
                eventProposalFormData: localStorage.getItem('eventProposalFormData')
            };
            results.steps.push({
                step: 'Check localStorage',
                data: localStorageData,
                status: 'info'
            });

            results.success = eventType === testEventType;
            setTestResult(results);

        } catch (error) {
            results.error = error.message;
            results.success = false;
            setTestResult(results);
        }
    };

    const clearAllStorage = () => {
        localStorage.removeItem('eventProposalDraft');
        localStorage.removeItem('eventTypeSelection');
        localStorage.removeItem('selectedEventType');
        localStorage.removeItem('eventProposalFormData');
        localStorage.removeItem('cedoFormData');
        setTestResult(null);
    };

    const getStatusBadge = (status) => {
        const variants = {
            success: 'default',
            error: 'destructive',
            info: 'secondary'
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    return (
        <Card className="w-full max-w-4xl mx-auto mb-6 border-2 border-green-300 bg-green-50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-green-800">
                        🧪 Manual Test Panel - Draft: {draftId}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={runManualTest}
                        >
                            🧪 Run Test
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={clearAllStorage}
                        >
                            🗑️ Clear All Storage
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Label htmlFor="testEventType">Test Event Type:</Label>
                        <Input
                            id="testEventType"
                            value={testEventType}
                            onChange={(e) => setTestEventType(e.target.value)}
                            placeholder="community-based or school-based"
                        />
                    </div>
                    <div className="text-sm text-gray-600">
                        <div>Valid values:</div>
                        <div>• community-based</div>
                        <div>• school-based</div>
                    </div>
                </div>

                {testResult && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Test Results:</h3>
                            {getStatusBadge(testResult.success ? 'success' : 'error')}
                        </div>

                        <div className="space-y-2">
                            {testResult.steps.map((step, index) => (
                                <div key={index} className="p-3 bg-white rounded border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-medium text-sm">
                                            Step {index + 1}: {step.step}
                                        </div>
                                        {getStatusBadge(step.status)}
                                    </div>
                                    {step.data && (
                                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                            {JSON.stringify(step.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>

                        {testResult.error && (
                            <div className="p-3 bg-red-100 border border-red-300 rounded">
                                <div className="font-medium text-red-800">Error:</div>
                                <div className="text-sm text-red-700">{testResult.error}</div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 