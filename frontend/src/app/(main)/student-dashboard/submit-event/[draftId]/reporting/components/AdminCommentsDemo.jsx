/**
 * Demo Component for Testing Admin Comments Functionality
 * This component can be used to test the admin comments display system
 */

import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { useState } from 'react';
import { ReportingLocked } from './ReportingLocked';

export const AdminCommentsDemo = () => {
    const [demoStatus, setDemoStatus] = useState('pending');
    const [demoProposalId, setDemoProposalId] = useState('202');

    const mockFormData = {
        organizationName: "Test Organization",
        contactEmail: "test@example.com",
        id: demoProposalId,
        proposalId: demoProposalId
    };

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Comments System Demo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <label className="font-medium">Proposal ID:</label>
                        <input
                            type="text"
                            value={demoProposalId}
                            onChange={(e) => setDemoProposalId(e.target.value)}
                            className="border rounded px-3 py-1"
                            placeholder="Enter proposal ID"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Button
                            onClick={() => setDemoStatus('pending')}
                            variant={demoStatus === 'pending' ? 'default' : 'outline'}
                            size="sm"
                        >
                            Pending
                        </Button>
                        <Button
                            onClick={() => setDemoStatus('denied')}
                            variant={demoStatus === 'denied' ? 'default' : 'outline'}
                            size="sm"
                        >
                            Denied (Show Comments)
                        </Button>
                        <Button
                            onClick={() => setDemoStatus('rejected')}
                            variant={demoStatus === 'rejected' ? 'default' : 'outline'}
                            size="sm"
                        >
                            Rejected (Show Comments)
                        </Button>
                        <Button
                            onClick={() => setDemoStatus('approved')}
                            variant={demoStatus === 'approved' ? 'default' : 'outline'}
                            size="sm"
                        >
                            Approved
                        </Button>
                    </div>

                    <div className="text-sm text-gray-600">
                        <p><strong>Current Status:</strong> {demoStatus}</p>
                        <p><strong>Proposal ID:</strong> {demoProposalId}</p>
                        <p><strong>Comments will show for:</strong> denied, rejected status</p>
                    </div>
                </CardContent>
            </Card>

            <div className="border-t pt-6">
                <ReportingLocked
                    proposalStatus={demoStatus}
                    proposalId={demoProposalId}
                    isCheckingStatus={false}
                    lastChecked={new Date().toISOString()}
                    error={null}
                    dataRecoveryStatus="success"
                    formData={mockFormData}
                    onRefreshStatus={() => console.log('Refresh status clicked')}
                    onForceRefresh={() => console.log('Force refresh clicked')}
                    onPrevious={() => console.log('Previous clicked')}
                />
            </div>
        </div>
    );
};

export default AdminCommentsDemo; 