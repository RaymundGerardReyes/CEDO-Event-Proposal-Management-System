/**
 * DocumentationTab - Documentation Content for Review Dialog
 * 
 * This component displays documentation and accomplishment reports
 * for approved proposals.
 */

import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Label } from "@/components/dashboard/admin/ui/label";
import { Download, FileText } from "lucide-react";

const DocumentationTab = ({ proposal }) => {
    if (!proposal) return null;

    const handleRequestDocumentation = () => {
        // This would call the review service to request documentation
        console.log('Requesting documentation for proposal:', proposal.id);
    };

    const handleDownload = (fileName) => {
        // This would handle file download
        console.log('Downloading file:', fileName);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Documentation & Accomplishment Reports
                </h3>
            </div>

            <div className="p-6">
                {proposal.details.accomplishmentReport ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Description
                                    </Label>
                                    <p className="mt-2 text-base text-gray-900">
                                        {proposal.details.accomplishmentReport.description}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Organization Type
                                    </Label>
                                    <p className="mt-2 text-base text-gray-900">
                                        {proposal.details.accomplishmentReport.organizationType.join(", ")}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Organization Name
                                    </Label>
                                    <p className="mt-2 text-base text-gray-900">
                                        {proposal.details.accomplishmentReport.organizationName}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Event Name
                                    </Label>
                                    <p className="mt-2 text-base text-gray-900">
                                        {proposal.details.accomplishmentReport.eventName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                                Attachments
                            </Label>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    <span className="text-base text-gray-900 font-medium">
                                        Accomplishment Report: {proposal.details.accomplishmentReport.attachments.report}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => handleDownload(proposal.details.accomplishmentReport.attachments.report)}
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </Button>
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <Label className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                Submission Status
                            </Label>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                    ✓ Submitted on {proposal.details.accomplishmentReport.submittedDate}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                            No documentation submitted yet
                        </h4>
                        <p className="text-gray-600 mb-4">
                            Documentation will appear here once submitted
                        </p>
                        <Button
                            className="bg-cedo-blue hover:bg-cedo-blue/90"
                            onClick={handleRequestDocumentation}
                        >
                            Request Documentation
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentationTab; 