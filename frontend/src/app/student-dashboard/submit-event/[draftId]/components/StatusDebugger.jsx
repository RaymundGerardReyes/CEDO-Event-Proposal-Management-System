/**
 * Status Debugger Component
 * Purpose: Track proposal status flow and localStorage values
 * Approach: Real-time monitoring of status changes
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export const StatusDebugger = ({ draftId, proposalStatus, mysqlId }) => {
    const [localStorageStatus, setLocalStorageStatus] = useState(null);
    const [localStorageMysqlId, setLocalStorageMysqlId] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        const updateStatus = () => {
            if (typeof window !== 'undefined') {
                const storedStatus = localStorage.getItem('current_proposal_status');
                const storedMysqlId = localStorage.getItem('current_mysql_proposal_id');

                setLocalStorageStatus(storedStatus);
                setLocalStorageMysqlId(storedMysqlId);
                setLastUpdate(new Date());
            }
        };

        // Update immediately
        updateStatus();

        // Update every 2 seconds
        const interval = setInterval(updateStatus, 2000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
            case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
            case 'denied': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <RefreshCw className="h-4 w-4 animate-spin" />;
            case 'approved': return <CheckCircle className="h-4 w-4" />;
            case 'draft': return <Info className="h-4 w-4" />;
            case 'denied': return <AlertCircle className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto mb-6 border-2 border-dashed border-blue-300 dark:border-blue-600">
            <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <div>
                            <CardTitle className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                🔍 Status Debugger
                            </CardTitle>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Track proposal status flow and localStorage values
                            </p>
                        </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                        <span className="text-xs">Last Update: {lastUpdate.toLocaleTimeString()}</span>
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
                {/* Component Props */}
                <Alert variant="outline" className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700">
                    <AlertTitle className="text-gray-800 dark:text-gray-200">
                        📋 Component Props
                    </AlertTitle>
                    <AlertDescription className="text-gray-600 dark:text-gray-400 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <strong>Draft ID:</strong>
                                <div className="font-mono text-xs mt-1">{draftId || 'null'}</div>
                            </div>
                            <div>
                                <strong>Proposal Status:</strong>
                                <div className="mt-1">
                                    <Badge className={getStatusColor(proposalStatus)}>
                                        {getStatusIcon(proposalStatus)}
                                        <span className="ml-2">{proposalStatus || 'null'}</span>
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <strong>MySQL ID:</strong>
                                <div className="font-mono text-xs mt-1">{mysqlId || 'null'}</div>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>

                {/* LocalStorage Values */}
                <Alert variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <AlertTitle className="text-green-800 dark:text-green-200">
                        💾 LocalStorage Values
                    </AlertTitle>
                    <AlertDescription className="text-green-600 dark:text-green-400 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <strong>Stored Status:</strong>
                                <div className="mt-1">
                                    <Badge className={getStatusColor(localStorageStatus)}>
                                        {getStatusIcon(localStorageStatus)}
                                        <span className="ml-2">{localStorageStatus || 'null'}</span>
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <strong>Stored MySQL ID:</strong>
                                <div className="font-mono text-xs mt-1">{localStorageMysqlId || 'null'}</div>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>

                {/* Status Comparison */}
                <Alert variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                    <AlertTitle className="text-purple-800 dark:text-purple-200">
                        🔄 Status Comparison
                    </AlertTitle>
                    <AlertDescription className="text-purple-600 dark:text-purple-400 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <strong>Props vs LocalStorage:</strong>
                                <div className="mt-1">
                                    {proposalStatus === localStorageStatus ? (
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                                            ✅ Match
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                                            ❌ Mismatch
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div>
                                <strong>Expected Status:</strong>
                                <div className="mt-1">
                                    <Badge className={getStatusColor(localStorageStatus || 'draft')}>
                                        {getStatusIcon(localStorageStatus || 'draft')}
                                        <span className="ml-2">{localStorageStatus || 'draft'}</span>
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>

                {/* Debug Info */}
                <Alert variant="outline" className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                    <AlertTitle className="text-orange-800 dark:text-orange-200">
                        🐛 Debug Information
                    </AlertTitle>
                    <AlertDescription className="text-orange-600 dark:text-orange-400 text-sm space-y-2">
                        <div>• <strong>Props Status:</strong> {proposalStatus || 'null'}</div>
                        <div>• <strong>LocalStorage Status:</strong> {localStorageStatus || 'null'}</div>
                        <div>• <strong>Draft ID:</strong> {draftId || 'null'}</div>
                        <div>• <strong>MySQL ID:</strong> {mysqlId || 'null'}</div>
                        <div>• <strong>Stored MySQL ID:</strong> {localStorageMysqlId || 'null'}</div>
                        <div>• <strong>Status Match:</strong> {proposalStatus === localStorageStatus ? 'Yes' : 'No'}</div>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};

export default StatusDebugger; 