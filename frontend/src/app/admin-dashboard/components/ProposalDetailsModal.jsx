"use client"

import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Label } from "@/components/dashboard/admin/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Building, Calendar, Clock, FileText, MapPin, User, Users } from "lucide-react";
import { memo } from "react";

const ProposalDetailsModal = memo(({ proposal, isOpen, onClose }) => {
    if (!proposal) return null;

    const statusColors = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        approved: "bg-green-100 text-green-700 border-green-200",
        rejected: "bg-red-100 text-red-700 border-red-200"
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="
        fixed left-[50%] top-[50%] z-50 
        grid w-[95vw] h-[90vh] 
        sm:w-[85vw] sm:h-[80vh] sm:max-w-[700px] sm:max-h-[600px]
        md:w-[75vw] md:h-[75vh] md:max-w-[800px] md:max-h-[650px]
        lg:w-[65vw] lg:h-[70vh] lg:max-w-[900px] lg:max-h-[700px]
        xl:w-[55vw] xl:h-[65vh] xl:max-w-[1000px] xl:max-h-[750px]
        translate-x-[-50%] translate-y-[-50%]
        border-0 sm:border
        bg-white shadow-none sm:shadow-xl
        rounded-none sm:rounded-lg
        overflow-hidden
        duration-300 ease-out
        data-[state=open]:animate-in data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
        data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]
        data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
        data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
        focus:outline-none
      ">
                {/* Modal Header */}
                <DialogHeader className="
          sticky top-0 z-10 
          bg-white border-b border-gray-200
          p-4 sm:p-5 lg:p-6
          shadow-sm
        ">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                        <div className="flex-1 min-w-0 pr-4">
                            <DialogTitle className="
                text-lg sm:text-xl lg:text-2xl 
                font-bold text-gray-900 
                leading-tight mb-2
                break-words
              ">
                                {proposal.title || proposal.eventName || 'Proposal Details'}
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base text-gray-600">
                                Review and manage this proposal submission
                            </DialogDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                            <Badge
                                className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full border ${statusColors[proposal.status] || statusColors.pending}`}
                            >
                                {proposal.status?.charAt(0).toUpperCase() + proposal.status?.slice(1) || 'Pending'}
                            </Badge>
                            <div className="text-xs sm:text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                ID: {proposal.id}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="sm:hidden text-xs px-3 py-2 border-gray-300 hover:bg-gray-50"
                            >
                                ✕ Close
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-cedo-blue" />
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Organization
                                    </Label>
                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                        <Building className="h-4 w-4 mr-2 text-gray-500" />
                                        {proposal.organization || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Submitted On
                                    </Label>
                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                        {formatDate(proposal.submittedOn || proposal.date)}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Assigned To
                                    </Label>
                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                        <User className="h-4 w-4 mr-2 text-gray-500" />
                                        {proposal.assignedTo || 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Expected Participants
                                    </Label>
                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                                        {proposal.expectedParticipants || proposal.participants?.length || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-cedo-blue" />
                                Event Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Venue
                                    </Label>
                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                                        {proposal.proposedVenue || proposal.location || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Schedule
                                    </Label>
                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                        {formatDate(proposal.proposedSchedule || proposal.schedule)}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Speakers
                                    </Label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {proposal.proposedSpeakers || proposal.speakers || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {proposal.description && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Description
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {proposal.description}
                                </p>
                            </div>
                        )}

                        {/* Goals and Resources */}
                        {(proposal.intendedGoal || proposal.requiredResources) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {proposal.intendedGoal && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                            Intended Goal
                                        </h3>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {proposal.intendedGoal}
                                        </p>
                                    </div>
                                )}
                                {proposal.requiredResources && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                            Required Resources
                                        </h3>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {proposal.requiredResources}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sponsors */}
                        {proposal.sponsors && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Sponsors
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {proposal.sponsors}
                                </p>
                            </div>
                        )}

                        {/* Purpose */}
                        {proposal.purpose && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Purpose
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {proposal.purpose}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>
                        <Button
                            className="w-full sm:w-auto bg-cedo-blue hover:bg-cedo-blue/90"
                            onClick={() => {
                                // TODO: Implement edit functionality
                                console.log('Edit proposal:', proposal.id);
                            }}
                        >
                            Edit Proposal
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

ProposalDetailsModal.displayName = 'ProposalDetailsModal';

export default ProposalDetailsModal; 