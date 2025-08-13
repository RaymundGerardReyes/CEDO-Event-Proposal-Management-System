/**
 * Accomplishment Report Form Component
 * Purpose: Main form for submitting final accomplishment reports after approved events
 * Approach: Comprehensive form with file upload, validation, and status-based rendering
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    FileIcon,
    FileTextIcon,
    Loader2Icon,
    UploadCloudIcon
} from "lucide-react";
import { useEffect, useState } from 'react';

/**
 * Validate file naming convention
 */
const validateFileName = (fileName, organizationName) => {
    if (!fileName) return { isValid: false, error: 'Please select a file' };

    const expectedName = `${organizationName}_AR`;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!['pdf', 'doc', 'docx'].includes(fileExtension)) {
        return { isValid: false, error: 'File must be PDF or DOC/DOCX format' };
    }

    // Check if filename starts with organization name
    const fileNameWithoutExt = fileName.split('.')[0];
    if (!fileNameWithoutExt.includes(organizationName.replace(/\s+/g, '_'))) {
        return {
            isValid: false,
            error: `File must be named following the format: ${organizationName}_AR.${fileExtension}`
        };
    }

    return { isValid: true, error: null };
};

/**
 * Accomplishment Report Form Component
 */
export const AccomplishmentReportForm = ({
    draftId,
    mysqlId,
    reportStatus = 'draft',
    isReportInRevision = false,
    isReportApproved = false,
    adminComments = '',
    onStatusUpdate
}) => {
    const { toast } = useToast();
    const { user } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        eventName: '',
        completionDetails: '',
        outcomeReporting: '',
        accomplishmentReportFile: null
    });

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showAmendmentForm, setShowAmendmentForm] = useState(false);

    // Load existing report data if in revision
    useEffect(() => {
        if (isReportInRevision || isReportApproved) {
            loadExistingReport();
        }
    }, [isReportInRevision, isReportApproved]);

    // Load existing report data
    const loadExistingReport = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/mongodb-unified/reports/accomplishment/${mysqlId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.report) {
                    setFormData({
                        eventName: data.report.eventName || '',
                        completionDetails: data.report.completionDetails || '',
                        outcomeReporting: data.report.outcomeReporting || '',
                        accomplishmentReportFile: null // File needs to be re-uploaded
                    });
                }
            }
        } catch (error) {
            console.error('Error loading existing report:', error);
            toast({
                title: "Error",
                description: "Failed to load existing report data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handle file upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const organizationName = user?.organization || 'Unknown_Organization';
        const validation = validateFileName(file.name, organizationName);

        if (!validation.isValid) {
            toast({
                title: "Invalid File Name",
                description: validation.error,
                variant: "destructive",
            });
            e.target.value = '';
            return;
        }

        setFormData(prev => ({ ...prev, accomplishmentReportFile: file }));
        setErrors(prev => ({ ...prev, accomplishmentReportFile: null }));
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.eventName.trim()) {
            newErrors.eventName = 'Event name is required';
        }

        if (!formData.completionDetails.trim()) {
            newErrors.completionDetails = 'Event completion details are required';
        }

        if (!formData.outcomeReporting.trim()) {
            newErrors.outcomeReporting = 'Outcome reporting is required';
        }

        if (!formData.accomplishmentReportFile && !isReportApproved) {
            newErrors.accomplishmentReportFile = 'Accomplishment report file is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast({
                title: "Validation Error",
                description: "Please fix the errors in the form",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('proposal_id', mysqlId || draftId);
            formDataToSend.append('event_name', formData.eventName);
            formDataToSend.append('completion_details', formData.completionDetails);
            formDataToSend.append('outcome_reporting', formData.outcomeReporting);

            if (formData.accomplishmentReportFile) {
                formDataToSend.append('accomplishmentReport', formData.accomplishmentReportFile);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/mongodb-unified/reports/accomplishment-reports`, {
                method: 'POST',
                body: formDataToSend
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: isReportInRevision ? "Report updated successfully" : "Accomplishment report submitted successfully",
                    variant: "default",
                });

                // Update status
                if (onStatusUpdate) {
                    onStatusUpdate('pending');
                }

                // Update localStorage
                localStorage.setItem('current_report_status', 'pending');
                localStorage.setItem('submission_timestamp', new Date().toISOString());

            } else {
                throw new Error(result.message || 'Failed to submit report');
            }

        } catch (error) {
            console.error('Error submitting report:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit accomplishment report",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show approved state
    if (isReportApproved) {
        return (
            <Card className="w-full border-green-200 bg-green-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircleIcon className="h-5 w-5" />
                        Accomplishment Report Approved
                    </CardTitle>
                    <CardDescription className="text-green-700">
                        Your accomplishment report has been successfully approved
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Alert className="border-green-200 bg-green-100">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Your accomplishment report has been reviewed and approved by administrators.
                            </AlertDescription>
                        </Alert>

                        <div className="bg-white border border-green-200 rounded-md p-4">
                            <h4 className="text-sm font-medium text-green-800 mb-2">Report Details</h4>
                            <div className="space-y-2 text-sm">
                                <p><strong>Event Name:</strong> {formData.eventName}</p>
                                <p><strong>Status:</strong> <Badge className="bg-green-100 text-green-800">Approved</Badge></p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-blue-600" />
                    Accomplishment Report Submission
                </CardTitle>
                <CardDescription>
                    Submit your final accomplishment report after completing your approved event
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Event Name */}
                    <div className="space-y-2">
                        <Label htmlFor="eventName">Name of Event/Activity Implemented *</Label>
                        <Input
                            id="eventName"
                            name="eventName"
                            value={formData.eventName}
                            onChange={handleInputChange}
                            placeholder="Enter the final name of the event as it was conducted"
                            className={errors.eventName ? 'border-red-500' : ''}
                        />
                        {errors.eventName && (
                            <p className="text-sm text-red-600">{errors.eventName}</p>
                        )}
                    </div>

                    {/* Event Completion Details */}
                    <div className="space-y-2">
                        <Label htmlFor="completionDetails">Event Completion Details *</Label>
                        <Textarea
                            id="completionDetails"
                            name="completionDetails"
                            value={formData.completionDetails}
                            onChange={handleInputChange}
                            placeholder="Provide a narrative summary of how the event unfolded, including key activities, challenges faced, and how they were addressed"
                            rows={4}
                            className={errors.completionDetails ? 'border-red-500' : ''}
                        />
                        {errors.completionDetails && (
                            <p className="text-sm text-red-600">{errors.completionDetails}</p>
                        )}
                    </div>

                    {/* Outcome Reporting */}
                    <div className="space-y-2">
                        <Label htmlFor="outcomeReporting">Outcome Reporting *</Label>
                        <Textarea
                            id="outcomeReporting"
                            name="outcomeReporting"
                            value={formData.outcomeReporting}
                            onChange={handleInputChange}
                            placeholder="Describe the results, impact, and success metrics of the event. Include attendance numbers, feedback received, and measurable outcomes"
                            rows={4}
                            className={errors.outcomeReporting ? 'border-red-500' : ''}
                        />
                        {errors.outcomeReporting && (
                            <p className="text-sm text-red-600">{errors.outcomeReporting}</p>
                        )}
                    </div>

                    {/* Documentation Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="accomplishmentReportFile">
                            Documentation Upload *
                            <span className="text-sm text-gray-500 ml-2">
                                (PDF or DOC/DOCX only)
                            </span>
                        </Label>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                                <input
                                    type="file"
                                    id="accomplishmentReportFile"
                                    name="accomplishmentReportFile"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                />
                                <label htmlFor="accomplishmentReportFile" className="cursor-pointer">
                                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                                        Choose file
                                    </span>
                                    <span className="text-gray-500"> or drag and drop</span>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                File must be named: <strong>{user?.organization || 'OrganizationName'}_AR.pdf</strong>
                            </p>
                        </div>

                        {formData.accomplishmentReportFile && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                <FileIcon className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700">
                                    {formData.accomplishmentReportFile.name}
                                </span>
                            </div>
                        )}

                        {errors.accomplishmentReportFile && (
                            <p className="text-sm text-red-600">{errors.accomplishmentReportFile}</p>
                        )}
                    </div>

                    {/* File Naming Convention Info */}
                    <Alert>
                        <AlertTriangleIcon className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Important:</strong> Your file must be named following the format: <code>{user?.organization || 'OrganizationName'}_AR.pdf</code>
                        </AlertDescription>
                    </Alert>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                    {isReportInRevision ? 'Updating Report...' : 'Submitting Report...'}
                                </>
                            ) : (
                                <>
                                    {isReportInRevision ? 'Update Report' : 'Submit Report'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}; 