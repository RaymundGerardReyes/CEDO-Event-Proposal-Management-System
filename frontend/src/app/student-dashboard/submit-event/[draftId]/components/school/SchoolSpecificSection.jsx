/**
 * School-Specific Section
 * 
 * Purpose: School-specific form fields for school-based events
 * Key approaches: School-specific validation, venue handling, event types
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/student/ui/select";
import { cn } from "@/lib/utils";
import { Building2, MapPin } from "lucide-react";

/**
 * School-specific form section
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export const SchoolSpecificSection = ({
    formData = {},
    handleInputChange,
    validationErrors = {},
    disabled = false
}) => {
    const getFieldClasses = (fieldName) => {
        return cn(
            "w-full",
            validationErrors[fieldName] && "border-red-500 focus:border-red-500"
        );
    };

    const hasFieldError = (fieldName) => {
        return !!validationErrors[fieldName];
    };

    // School event types
    const schoolEventTypes = [
        { value: "academic-competition", label: "Academic Competition" },
        { value: "workshop-seminar", label: "Workshop/Seminar" },
        { value: "cultural-event", label: "Cultural Event" },
        { value: "sports-activity", label: "Sports Activity" },
        { value: "leadership-training", label: "Leadership Training" },
        { value: "community-service", label: "Community Service" },
        { value: "career-guidance", label: "Career Guidance" },
        { value: "health-wellness", label: "Health & Wellness" },
        { value: "technology-workshop", label: "Technology Workshop" },
        { value: "environmental-awareness", label: "Environmental Awareness" },
        { value: "other", label: "Other" }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    School Event Details
                </CardTitle>
                <CardDescription>
                    Provide specific details for your school-based event
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* School Venue */}
                <div className="space-y-2">
                    <Label htmlFor="schoolVenue" className="text-sm font-medium">
                        School Venue *
                    </Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            id="schoolVenue"
                            type="text"
                            placeholder="Enter school venue (e.g., School Auditorium, Gymnasium)"
                            value={formData.schoolVenue || ""}
                            onChange={(e) => handleInputChange("schoolVenue", e.target.value)}
                            className={cn(getFieldClasses("schoolVenue"), "pl-10")}
                            disabled={disabled}
                        />
                    </div>
                    {hasFieldError("schoolVenue") && (
                        <p className="text-sm text-red-500">
                            {validationErrors.schoolVenue}
                        </p>
                    )}
                </div>

                {/* School Event Type */}
                <div className="space-y-2">
                    <Label htmlFor="schoolEventType" className="text-sm font-medium">
                        Event Type *
                    </Label>
                    <Select
                        value={formData.schoolEventType || ""}
                        onValueChange={(value) => handleInputChange("schoolEventType", value)}
                        disabled={disabled}
                    >
                        <SelectTrigger className={getFieldClasses("schoolEventType")}>
                            <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                            {schoolEventTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasFieldError("schoolEventType") && (
                        <p className="text-sm text-red-500">
                            {validationErrors.schoolEventType}
                        </p>
                    )}
                </div>

                {/* Custom Event Type */}
                {formData.schoolEventType === "other" && (
                    <div className="space-y-2">
                        <Label htmlFor="customSchoolEventType" className="text-sm font-medium">
                            Specify Custom Event Type
                        </Label>
                        <Input
                            id="customSchoolEventType"
                            type="text"
                            placeholder="Please specify the custom event type..."
                            value={formData.customSchoolEventType || ""}
                            onChange={(e) => handleInputChange("customSchoolEventType", e.target.value)}
                            className="w-full"
                            disabled={disabled}
                        />
                    </div>
                )}

                {/* Expected Attendance */}
                <div className="space-y-2">
                    <Label htmlFor="expectedAttendance" className="text-sm font-medium">
                        Expected Attendance
                    </Label>
                    <Input
                        id="expectedAttendance"
                        type="number"
                        placeholder="Enter expected number of participants"
                        value={formData.expectedAttendance || ""}
                        onChange={(e) => handleInputChange("expectedAttendance", e.target.value)}
                        className="w-full"
                        min="1"
                        disabled={disabled}
                    />
                </div>

                {/* School Department/Organization */}
                <div className="space-y-2">
                    <Label htmlFor="schoolDepartment" className="text-sm font-medium">
                        Department/Organization
                    </Label>
                    <Input
                        id="schoolDepartment"
                        type="text"
                        placeholder="e.g., Student Council, Science Club, etc."
                        value={formData.schoolDepartment || ""}
                        onChange={(e) => handleInputChange("schoolDepartment", e.target.value)}
                        className="w-full"
                        disabled={disabled}
                    />
                </div>

                {/* School Event Coordinator */}
                <div className="space-y-2">
                    <Label htmlFor="schoolCoordinator" className="text-sm font-medium">
                        Event Coordinator
                    </Label>
                    <Input
                        id="schoolCoordinator"
                        type="text"
                        placeholder="Name of the event coordinator"
                        value={formData.schoolCoordinator || ""}
                        onChange={(e) => handleInputChange("schoolCoordinator", e.target.value)}
                        className="w-full"
                        disabled={disabled}
                    />
                </div>

                {/* School Event Budget */}
                <div className="space-y-2">
                    <Label htmlFor="schoolBudget" className="text-sm font-medium">
                        Estimated Budget (PHP)
                    </Label>
                    <Input
                        id="schoolBudget"
                        type="number"
                        placeholder="Enter estimated budget"
                        value={formData.schoolBudget || ""}
                        onChange={(e) => handleInputChange("schoolBudget", e.target.value)}
                        className="w-full"
                        min="0"
                        step="0.01"
                        disabled={disabled}
                    />
                </div>

                {/* School Event Requirements */}
                <div className="space-y-2">
                    <Label htmlFor="schoolRequirements" className="text-sm font-medium">
                        Special Requirements
                    </Label>
                    <textarea
                        id="schoolRequirements"
                        placeholder="Any special requirements, equipment, or resources needed..."
                        value={formData.schoolRequirements || ""}
                        onChange={(e) => handleInputChange("schoolRequirements", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        disabled={disabled}
                    />
                </div>
            </CardContent>
        </Card>
    );
}; 