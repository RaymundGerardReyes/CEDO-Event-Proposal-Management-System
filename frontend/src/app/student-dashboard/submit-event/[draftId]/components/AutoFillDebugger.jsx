/**
 * Auto-Fill Debug Tool for Form Testing
 * Purpose: Automatically populate all form fields for testing
 * Approach: Comprehensive field mapping with realistic test data
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Play,
    RotateCcw,
    Square,
    Upload
} from "lucide-react";
import { useCallback, useState } from "react";

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

const generateSchoolEventData = () => ({
    // Basic Information
    schoolEventName: "Academic Excellence Competition 2025",
    schoolVenue: "University Auditorium, Main Campus",

    // Date & Time
    schoolStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    schoolEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    schoolTimeStart: "09:00",
    schoolTimeEnd: "17:00",

    // Event Specifics
    schoolEventType: "academic-competition",
    schoolEventMode: "offline",
    schoolSDPCredits: "2",
    schoolTargetAudience: ["1st Year", "2nd Year", "3rd Year", "4th Year", "All Levels"],

    // Files (mock)
    schoolGPOAFile: createMockFile("Academic_Competition_GPOA.pdf"),
    schoolProposalFile: createMockFile("Academic_Competition_Proposal.pdf"),
});

const generateCommunityEventData = () => ({
    // Basic Information
    communityEventName: "Community Leadership Workshop Series",
    communityVenue: "Community Center, Downtown Plaza",

    // Date & Time
    communityStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    communityEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    communityTimeStart: "14:00",
    communityTimeEnd: "18:00",

    // Event Specifics
    communityEventType: "leadership-training",
    communityEventMode: "hybrid",
    communitySDPCredits: "1",
    communityTargetAudience: ["Leaders", "All Levels", "Alumni"],

    // Files (mock)
    communityGPOAFile: createMockFile("Leadership_Workshop_GPOA.pdf"),
    communityProposalFile: createMockFile("Leadership_Workshop_Proposal.pdf"),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function createMockFile(filename) {
    // Create a mock File object for testing
    const content = `Mock content for ${filename}`;
    const blob = new Blob([content], { type: 'application/pdf' });
    return new File([blob], filename, { type: 'application/pdf' });
}

function getFormTypeFromPath() {
    if (typeof window === 'undefined') return 'unknown';

    const path = window.location.pathname;
    if (path.includes('school-event')) return 'school';
    if (path.includes('community-event')) return 'community';
    return 'unknown';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AutoFillDebugger = ({
    onFillData,
    onClearData,
    onFillAndSubmit,
    isSubmitting = false
}) => {
    const [isFilling, setIsFilling] = useState(false);
    const [lastAction, setLastAction] = useState(null);
    const [formType] = useState(getFormTypeFromPath());

    // ============================================================================
    // ACTION HANDLERS
    // ============================================================================

    const handleFillData = useCallback(async (action = 'fill') => {
        setIsFilling(true);
        setLastAction(action);

        try {
            // Determine which data to use based on form type
            const testData = formType === 'school'
                ? generateSchoolEventData()
                : generateCommunityEventData();

            console.log(`🔧 Auto-filling ${formType} event form with:`, testData);

            // Call the parent handler
            await onFillData(testData);

            setLastAction({
                type: action,
                success: true,
                timestamp: new Date().toISOString(),
                data: testData
            });

            console.log('✅ Auto-fill completed successfully');
        } catch (error) {
            console.error('❌ Auto-fill failed:', error);
            setLastAction({
                type: action,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsFilling(false);
        }
    }, [formType, onFillData]);

    const handleClearData = useCallback(async () => {
        setIsFilling(true);
        setLastAction('clear');

        try {
            await onClearData();
            setLastAction({
                type: 'clear',
                success: true,
                timestamp: new Date().toISOString()
            });
            console.log('✅ Form cleared successfully');
        } catch (error) {
            console.error('❌ Clear failed:', error);
            setLastAction({
                type: 'clear',
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsFilling(false);
        }
    }, [onClearData]);

    const handleFillAndSubmit = useCallback(async () => {
        setIsFilling(true);
        setLastAction('fill-and-submit');

        try {
            const testData = formType === 'school'
                ? generateSchoolEventData()
                : generateCommunityEventData();

            console.log(`🔧 Auto-filling and submitting ${formType} event form`);

            await onFillAndSubmit(testData);

            setLastAction({
                type: 'fill-and-submit',
                success: true,
                timestamp: new Date().toISOString(),
                data: testData
            });

            console.log('✅ Auto-fill and submit completed successfully');
        } catch (error) {
            console.error('❌ Auto-fill and submit failed:', error);
            setLastAction({
                type: 'fill-and-submit',
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsFilling(false);
        }
    }, [formType, onFillAndSubmit]);

    // ============================================================================
    // RENDER
    // ============================================================================

    const getStatusIcon = () => {
        if (isFilling) return <RotateCcw className="h-4 w-4 animate-spin" />;
        if (lastAction?.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
        if (lastAction?.success === false) return <AlertCircle className="h-4 w-4 text-red-500" />;
        return <Play className="h-4 w-4" />;
    };

    const getStatusText = () => {
        if (isFilling) return "Processing...";
        if (lastAction?.success) return "Completed";
        if (lastAction?.success === false) return "Failed";
        return "Ready";
    };

    const getStatusColor = () => {
        if (isFilling) return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
        if (lastAction?.success) return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
        if (lastAction?.success === false) return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200";
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
    };

    return (
        <Card className="w-full max-w-4xl mx-auto mb-6 border-2 border-dashed border-yellow-300 dark:border-yellow-600">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        <div>
                            <CardTitle className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                                🧪 Auto-Fill Debug Tool
                            </CardTitle>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                Automatically populate all form fields for testing
                            </p>
                        </div>
                    </div>
                    <Badge className={getStatusColor()}>
                        {getStatusIcon()}
                        <span className="ml-2">{getStatusText()}</span>
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
                {/* Form Type Detection */}
                <Alert variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                    <AlertTitle className="text-blue-800 dark:text-blue-200">
                        📋 Detected Form Type
                    </AlertTitle>
                    <AlertDescription className="text-blue-600 dark:text-blue-400">
                        <strong>{formType === 'school' ? 'School Event Form' :
                            formType === 'community' ? 'Community Event Form' :
                                'Unknown Form Type'}</strong>
                        {formType === 'unknown' && (
                            <span className="block mt-1 text-sm">
                                Unable to detect form type from URL. Please ensure you're on the correct page.
                            </span>
                        )}
                    </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        onClick={() => handleFillData('fill')}
                        disabled={isFilling || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        {isFilling ? 'Filling...' : 'Fill All Fields'}
                    </Button>

                    <Button
                        onClick={handleClearData}
                        disabled={isFilling || isSubmitting}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <Square className="h-4 w-4 mr-2" />
                        {isFilling ? 'Clearing...' : 'Clear All Fields'}
                    </Button>

                    <Button
                        onClick={handleFillAndSubmit}
                        disabled={isFilling || isSubmitting}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {isFilling ? 'Processing...' : 'Fill & Submit'}
                    </Button>
                </div>

                {/* Test Data Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Basic Information
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Event Name:</span>
                                <span className="font-mono text-xs">
                                    {formType === 'school' ? 'Academic Excellence Competition 2025' : 'Community Leadership Workshop Series'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Venue:</span>
                                <span className="font-mono text-xs">
                                    {formType === 'school' ? 'University Auditorium' : 'Community Center'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Event Details
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Event Type:</span>
                                <span className="font-mono text-xs">
                                    {formType === 'school' ? 'Academic Competition' : 'Leadership Training'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Mode:</span>
                                <span className="font-mono text-xs">
                                    {formType === 'school' ? 'Offline' : 'Hybrid'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">SDP Credits:</span>
                                <span className="font-mono text-xs">
                                    {formType === 'school' ? '2' : '1'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last Action Status */}
                {lastAction && (
                    <Alert variant={lastAction.success ? "default" : "destructive"} className="mt-4">
                        <AlertTitle>
                            {lastAction.success ? '✅ Action Completed' : '❌ Action Failed'}
                        </AlertTitle>
                        <AlertDescription>
                            <div className="space-y-1">
                                <div><strong>Action:</strong> {lastAction.type}</div>
                                <div><strong>Time:</strong> {new Date(lastAction.timestamp).toLocaleTimeString()}</div>
                                {lastAction.error && (
                                    <div><strong>Error:</strong> {lastAction.error}</div>
                                )}
                                {lastAction.data && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer font-semibold">View Filled Data</summary>
                                        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                                            {JSON.stringify(lastAction.data, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Instructions */}
                <Alert variant="outline" className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700">
                    <AlertTitle className="text-gray-800 dark:text-gray-200">
                        📝 Usage Instructions
                    </AlertTitle>
                    <AlertDescription className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                        <div>• <strong>Fill All Fields:</strong> Populates all form fields with realistic test data</div>
                        <div>• <strong>Clear All Fields:</strong> Resets all form fields to empty state</div>
                        <div>• <strong>Fill & Submit:</strong> Fills the form and automatically submits it</div>
                        <div>• <strong>Note:</strong> File uploads will be simulated with mock files</div>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};

export default AutoFillDebugger; 