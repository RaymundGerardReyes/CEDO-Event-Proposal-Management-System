/**
 * OverviewHeader Component
 * Displays the main header section for the overview page
 * 
 * Key approaches: Single responsibility, prop validation,
 * clean functional component design
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { CheckCircle, Edit, PlusCircle } from "lucide-react";
import PropTypes from 'prop-types';

const OverviewHeader = ({
    hasActiveProposal,
    proposalStatus,
    onStartProposal,
    onContinueEditing,
    onViewProposal
}) => {
    const isApproved = proposalStatus === "approved";
    const isDenied = proposalStatus === "denied";
    const isPending = proposalStatus === "pending";

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Event Proposal Overview
                </CardTitle>
                <CardDescription>
                    Manage your event proposals and track their status
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Start New Proposal */}
                    <div className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <PlusCircle className="h-8 w-8 text-blue-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">Start New Proposal</h3>
                        <p className="text-sm text-gray-600 text-center mb-3">
                            Create a new event proposal from scratch
                        </p>
                        <button
                            onClick={onStartProposal}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Start Proposal
                        </button>
                    </div>

                    {/* Continue Editing */}
                    {hasActiveProposal && (
                        <div className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50">
                            <Edit className="h-8 w-8 text-orange-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-1">Continue Editing</h3>
                            <p className="text-sm text-gray-600 text-center mb-3">
                                Resume working on your draft proposal
                            </p>
                            <button
                                onClick={onContinueEditing}
                                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* View Proposal Status */}
                    {hasActiveProposal && (
                        <div className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-1">View Proposal</h3>
                            <p className="text-sm text-gray-600 text-center mb-3">
                                Review your submitted proposal
                            </p>
                            <button
                                onClick={onViewProposal}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    )}
                </div>

                {/* Status Summary */}
                {hasActiveProposal && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isApproved ? 'bg-green-100 text-green-800' :
                                    isDenied ? 'bg-red-100 text-red-800' :
                                        isPending ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                {proposalStatus.charAt(0).toUpperCase() + proposalStatus.slice(1)}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

OverviewHeader.propTypes = {
    hasActiveProposal: PropTypes.bool.isRequired,
    proposalStatus: PropTypes.string.isRequired,
    onStartProposal: PropTypes.func.isRequired,
    onContinueEditing: PropTypes.func,
    onViewProposal: PropTypes.func
};

export default OverviewHeader;




