/**
 * OverviewTab - Overview Content for Review Dialog
 * 
 * This component displays the proposal overview information
 * including submission details and organization information.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/admin/ui/avatar";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Label } from "@/components/dashboard/admin/ui/label";

const OverviewTab = ({ proposal }) => {
    if (!proposal) return null;

    return (
        <>
            {/* Submission Overview Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-cedo-blue rounded-full mr-3"></div>
                        Submission Overview
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Proposal ID
                            </Label>
                            <p className="mt-2 text-base font-semibold text-gray-900">
                                {proposal.id}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Submission Date
                            </Label>
                            <p className="mt-2 text-base text-gray-900">
                                {new Date(proposal.date).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Purpose
                            </Label>
                            <p className="mt-2 text-base text-gray-900">
                                {proposal.details.purpose}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Category
                            </Label>
                            <p className="mt-2 text-base text-gray-900">
                                {proposal.category}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Priority
                            </Label>
                            <p className="mt-2 text-base text-gray-900 capitalize">
                                {proposal.priority}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Status
                            </Label>
                            <Badge variant="outline" className="mt-2 font-medium">
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organization Information Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-cedo-blue rounded-full mr-3"></div>
                        Organization Information
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Description
                        </Label>
                        <p className="mt-2 text-base text-gray-900 leading-relaxed">
                            {proposal.details.organization.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Organization Type
                            </Label>
                            <p className="mt-2 text-base text-gray-900">
                                {proposal.details.organization.type.join(", ")}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Submitter
                            </Label>
                            <div className="flex items-center gap-3 mt-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={proposal.submitter.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xs bg-cedo-blue text-white font-medium">
                                        {proposal.submitter.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-base text-gray-900 font-medium">
                                    {proposal.submitter.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OverviewTab; 