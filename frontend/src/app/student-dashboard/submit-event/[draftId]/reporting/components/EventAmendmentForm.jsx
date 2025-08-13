/**
 * Event Amendment Form Component
 * Purpose: Allow students to report changes to event logistics from the original proposal
 * Approach: Conditional form that appears when user indicates changes were made
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import {
    AlertTriangleIcon,
    CalendarIcon,
    ClockIcon,
    EditIcon,
    Loader2Icon,
    MapPinIcon,
    MonitorIcon
} from "lucide-react";
import { useEffect, useState } from 'react';

/**
 * Event Amendment Form Component
 */
export const EventAmendmentForm = ({
    draftId,
    mysqlId,
    reportStatus = 'draft',
    isReportInRevision = false,
    isReportApproved = false
}) => {
    const { toast } = useToast();

    // Form state
    const [hasChanges, setHasChanges] = useState(false);
    const [showAmendmentForm, setShowAmendmentForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Amendment form data
    const [amendmentData, setAmendmentData] = useState({
        finalVenue: '',
        finalStartDate: '',
        finalEndDate: '',
        finalTimeStart: '',
        finalTimeEnd: '',
        finalEventMode: '',
        changeReason: ''
    });

    // Original event data (for comparison)
    const [originalEventData, setOriginalEventData] = useState(null);

    // Load original event data
    useEffect(() => {
        loadOriginalEventData();
    }, [mysqlId]);

    const loadOriginalEventData = async () => {
        if (!mysqlId) return;

        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/mongodb-unified/reports/proposal/${mysqlId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.proposal) {
                    setOriginalEventData(data.proposal);
                }
            }
        } catch (error) {
            console.error('Error loading original event data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle checkbox change
    const handleHasChangesChange = (checked) => {
        setHasChanges(checked);
        setShowAmendmentForm(checked);

        if (!checked) {
            // Reset form when unchecking
            setAmendmentData({
                finalVenue: '',
                finalStartDate: '',
                finalEndDate: '',
                finalTimeStart: '',
                finalTimeEnd: '',
                finalEventMode: '',
                changeReason: ''
            });
            setErrors({});
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAmendmentData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handle select change
    const handleSelectChange = (name, value) => {
        setAmendmentData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Validate amendment form
    const validateAmendmentForm = () => {
        const newErrors = {};

        if (!amendmentData.finalVenue.trim()) {
            newErrors.finalVenue = 'Final venue is required';
        }

        if (!amendmentData.finalStartDate) {
            newErrors.finalStartDate = 'Final start date is required';
        }

        if (!amendmentData.finalEndDate) {
            newErrors.finalEndDate = 'Final end date is required';
        }

        if (!amendmentData.finalTimeStart) {
            newErrors.finalTimeStart = 'Final start time is required';
        }

        if (!amendmentData.finalTimeEnd) {
            newErrors.finalTimeEnd = 'Final end time is required';
        }

        if (!amendmentData.finalEventMode) {
            newErrors.finalEventMode = 'Final event mode is required';
        }

        if (!amendmentData.changeReason.trim()) {
            newErrors.changeReason = 'Please provide a reason for the changes';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle amendment submission
    const handleAmendmentSubmit = async (e) => {
        e.preventDefault();

        if (!validateAmendmentForm()) {
            toast({
                title: "Validation Error",
                description: "Please fix the errors in the amendment form",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/mongodb-unified/reports/event-amendments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    proposal_id: mysqlId || draftId,
                    has_changes: true,
                    final_venue: amendmentData.finalVenue,
                    final_start_date: amendmentData.finalStartDate,
                    final_end_date: amendmentData.finalEndDate,
                    final_time_start: amendmentData.finalTimeStart,
                    final_time_end: amendmentData.finalTimeEnd,
                    final_event_mode: amendmentData.finalEventMode,
                    change_reason: amendmentData.changeReason
                })
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Event amendments submitted successfully",
                    variant: "default",
                });

                // Reset form
                setHasChanges(false);
                setShowAmendmentForm(false);
                setAmendmentData({
                    finalVenue: '',
                    finalStartDate: '',
                    finalEndDate: '',
                    finalTimeStart: '',
                    finalTimeEnd: '',
                    finalEventMode: '',
                    changeReason: ''
                });

            } else {
                throw new Error(result.message || 'Failed to submit amendments');
            }

        } catch (error) {
            console.error('Error submitting amendments:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit event amendments",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't show if report is approved
    if (isReportApproved) {
        return null;
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <EditIcon className="h-5 w-5 text-orange-600" />
                    Event Detail Amendments
                </CardTitle>
                <CardDescription>
                    Report any changes to event logistics from the original proposal
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Change Toggle */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hasChanges"
                        checked={hasChanges}
                        onCheckedChange={handleHasChangesChange}
                        disabled={isSubmitting}
                    />
                    <Label htmlFor="hasChanges" className="text-sm font-medium">
                        Were there any changes to the event logistics from the original proposal?
                    </Label>
                </div>

                {/* Amendment Form */}
                {showAmendmentForm && (
                    <form onSubmit={handleAmendmentSubmit} className="space-y-6">
                        <Alert>
                            <AlertTriangleIcon className="h-4 w-4" />
                            <AlertDescription>
                                Please provide the final, updated information for your event.
                            </AlertDescription>
                        </Alert>

                        {/* Final Venue */}
                        <div className="space-y-2">
                            <Label htmlFor="finalVenue">
                                Final Event Venue *
                            </Label>
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4 text-gray-500" />
                                <Input
                                    id="finalVenue"
                                    name="finalVenue"
                                    value={amendmentData.finalVenue}
                                    onChange={handleInputChange}
                                    placeholder="Enter the final venue where the event was held"
                                    className={errors.finalVenue ? 'border-red-500' : ''}
                                />
                            </div>
                            {errors.finalVenue && (
                                <p className="text-sm text-red-600">{errors.finalVenue}</p>
                            )}
                        </div>

                        {/* Final Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="finalStartDate">
                                    Final Start Date *
                                </Label>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                                    <Input
                                        type="date"
                                        id="finalStartDate"
                                        name="finalStartDate"
                                        value={amendmentData.finalStartDate}
                                        onChange={handleInputChange}
                                        className={errors.finalStartDate ? 'border-red-500' : ''}
                                    />
                                </div>
                                {errors.finalStartDate && (
                                    <p className="text-sm text-red-600">{errors.finalStartDate}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="finalEndDate">
                                    Final End Date *
                                </Label>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                                    <Input
                                        type="date"
                                        id="finalEndDate"
                                        name="finalEndDate"
                                        value={amendmentData.finalEndDate}
                                        onChange={handleInputChange}
                                        className={errors.finalEndDate ? 'border-red-500' : ''}
                                    />
                                </div>
                                {errors.finalEndDate && (
                                    <p className="text-sm text-red-600">{errors.finalEndDate}</p>
                                )}
                            </div>
                        </div>

                        {/* Final Times */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="finalTimeStart">
                                    Final Start Time *
                                </Label>
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-gray-500" />
                                    <Input
                                        type="time"
                                        id="finalTimeStart"
                                        name="finalTimeStart"
                                        value={amendmentData.finalTimeStart}
                                        onChange={handleInputChange}
                                        className={errors.finalTimeStart ? 'border-red-500' : ''}
                                    />
                                </div>
                                {errors.finalTimeStart && (
                                    <p className="text-sm text-red-600">{errors.finalTimeStart}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="finalTimeEnd">
                                    Final End Time *
                                </Label>
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-gray-500" />
                                    <Input
                                        type="time"
                                        id="finalTimeEnd"
                                        name="finalTimeEnd"
                                        value={amendmentData.finalTimeEnd}
                                        onChange={handleInputChange}
                                        className={errors.finalTimeEnd ? 'border-red-500' : ''}
                                    />
                                </div>
                                {errors.finalTimeEnd && (
                                    <p className="text-sm text-red-600">{errors.finalTimeEnd}</p>
                                )}
                            </div>
                        </div>

                        {/* Final Event Mode */}
                        <div className="space-y-2">
                            <Label htmlFor="finalEventMode">
                                Final Event Mode *
                            </Label>
                            <div className="flex items-center gap-2">
                                <MonitorIcon className="h-4 w-4 text-gray-500" />
                                <Select
                                    value={amendmentData.finalEventMode}
                                    onValueChange={(value) => handleSelectChange('finalEventMode', value)}
                                >
                                    <SelectTrigger className={errors.finalEventMode ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select event mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="offline">Offline</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.finalEventMode && (
                                <p className="text-sm text-red-600">{errors.finalEventMode}</p>
                            )}
                        </div>

                        {/* Change Reason */}
                        <div className="space-y-2">
                            <Label htmlFor="changeReason">
                                Reason for Changes *
                            </Label>
                            <textarea
                                id="changeReason"
                                name="changeReason"
                                value={amendmentData.changeReason}
                                onChange={handleInputChange}
                                placeholder="Please explain why these changes were necessary"
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.changeReason ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.changeReason && (
                                <p className="text-sm text-red-600">{errors.changeReason}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                        Submitting Amendments...
                                    </>
                                ) : (
                                    'Submit Amendments'
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {/* No Changes Option */}
                {!showAmendmentForm && hasChanges === false && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <p className="text-sm text-gray-600">
                            If there were no changes to your event logistics, you can proceed with your accomplishment report submission.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 