/**
 * Community-Specific Section
 * 
 * Purpose: Community-specific form fields for community-based events
 * Key approaches: Community-specific validation, partner handling, event types
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/student/ui/select";
import { Textarea } from "@/components/dashboard/student/ui/textarea";
import { cn } from "@/lib/utils";
import { Globe, MapPin, Users } from "lucide-react";

/**
 * Community-specific form section
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export const CommunitySpecificSection = ({
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

    // Community event types
    const communityEventTypes = [
        { value: "seminar-webinar", label: "Seminar/Webinar" },
        { value: "workshop-training", label: "Workshop/Training" },
        { value: "community-outreach", label: "Community Outreach" },
        { value: "health-campaign", label: "Health Campaign" },
        { value: "environmental-project", label: "Environmental Project" },
        { value: "educational-program", label: "Educational Program" },
        { value: "cultural-celebration", label: "Cultural Celebration" },
        { value: "sports-tournament", label: "Sports Tournament" },
        { value: "fundraising-event", label: "Fundraising Event" },
        { value: "awareness-campaign", label: "Awareness Campaign" },
        { value: "other", label: "Other" }
    ];

    // Event modes
    const eventModes = [
        { value: "face-to-face", label: "Face-to-Face" },
        { value: "online", label: "Online/Virtual" },
        { value: "hybrid", label: "Hybrid (Face-to-Face + Online)" }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    Community Event Details
                </CardTitle>
                <CardDescription>
                    Provide specific details for your community-based event
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Community Venue */}
                <div className="space-y-2">
                    <Label htmlFor="communityVenue" className="text-sm font-medium">
                        Community Venue *
                    </Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            id="communityVenue"
                            type="text"
                            placeholder="Enter community venue or location"
                            value={formData.communityVenue || ""}
                            onChange={(e) => handleInputChange("communityVenue", e.target.value)}
                            className={cn(getFieldClasses("communityVenue"), "pl-10")}
                            disabled={disabled}
                        />
                    </div>
                    {hasFieldError("communityVenue") && (
                        <p className="text-sm text-red-500">
                            {validationErrors.communityVenue}
                        </p>
                    )}
                </div>

                {/* Community Event Type */}
                <div className="space-y-2">
                    <Label htmlFor="communityEventType" className="text-sm font-medium">
                        Event Type *
                    </Label>
                    <Select
                        value={formData.communityEventType || ""}
                        onValueChange={(value) => handleInputChange("communityEventType", value)}
                        disabled={disabled}
                    >
                        <SelectTrigger className={getFieldClasses("communityEventType")}>
                            <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                            {communityEventTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasFieldError("communityEventType") && (
                        <p className="text-sm text-red-500">
                            {validationErrors.communityEventType}
                        </p>
                    )}
                </div>

                {/* Custom Event Type */}
                {formData.communityEventType === "other" && (
                    <div className="space-y-2">
                        <Label htmlFor="customCommunityEventType" className="text-sm font-medium">
                            Specify Custom Event Type
                        </Label>
                        <Input
                            id="customCommunityEventType"
                            type="text"
                            placeholder="Please specify the custom event type..."
                            value={formData.customCommunityEventType || ""}
                            onChange={(e) => handleInputChange("customCommunityEventType", e.target.value)}
                            className="w-full"
                            disabled={disabled}
                        />
                    </div>
                )}

                {/* Event Mode */}
                <div className="space-y-2">
                    <Label htmlFor="communityEventMode" className="text-sm font-medium">
                        Event Mode
                    </Label>
                    <Select
                        value={formData.communityEventMode || ""}
                        onValueChange={(value) => handleInputChange("communityEventMode", value)}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select event mode" />
                        </SelectTrigger>
                        <SelectContent>
                            {eventModes.map((mode) => (
                                <SelectItem key={mode.value} value={mode.value}>
                                    {mode.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Community Partners */}
                <div className="space-y-2">
                    <Label htmlFor="communityPartners" className="text-sm font-medium">
                        Community Partners
                    </Label>
                    <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            id="communityPartners"
                            type="text"
                            placeholder="e.g., Local Government, NGOs, Community Organizations"
                            value={formData.communityPartners || ""}
                            onChange={(e) => handleInputChange("communityPartners", e.target.value)}
                            className="pl-10"
                            disabled={disabled}
                        />
                    </div>
                </div>

                {/* Expected Community Impact */}
                <div className="space-y-2">
                    <Label htmlFor="communityImpact" className="text-sm font-medium">
                        Expected Community Impact
                    </Label>
                    <Textarea
                        id="communityImpact"
                        placeholder="Describe the expected impact on the community..."
                        value={formData.communityImpact || ""}
                        onChange={(e) => handleInputChange("communityImpact", e.target.value)}
                        className="min-h-[100px]"
                        disabled={disabled}
                    />
                </div>

                {/* Community Event Coordinator */}
                <div className="space-y-2">
                    <Label htmlFor="communityCoordinator" className="text-sm font-medium">
                        Event Coordinator
                    </Label>
                    <Input
                        id="communityCoordinator"
                        type="text"
                        placeholder="Name of the event coordinator"
                        value={formData.communityCoordinator || ""}
                        onChange={(e) => handleInputChange("communityCoordinator", e.target.value)}
                        className="w-full"
                        disabled={disabled}
                    />
                </div>

                {/* Community Event Budget */}
                <div className="space-y-2">
                    <Label htmlFor="communityBudget" className="text-sm font-medium">
                        Estimated Budget (PHP)
                    </Label>
                    <Input
                        id="communityBudget"
                        type="number"
                        placeholder="Enter estimated budget"
                        value={formData.communityBudget || ""}
                        onChange={(e) => handleInputChange("communityBudget", e.target.value)}
                        className="w-full"
                        min="0"
                        step="0.01"
                        disabled={disabled}
                    />
                </div>

                {/* SDP Credits */}
                <div className="space-y-2">
                    <Label htmlFor="communitySDPCredits" className="text-sm font-medium">
                        SDP Credits
                    </Label>
                    <Input
                        id="communitySDPCredits"
                        type="number"
                        placeholder="Enter SDP credits (if applicable)"
                        value={formData.communitySDPCredits || ""}
                        onChange={(e) => handleInputChange("communitySDPCredits", e.target.value)}
                        className="w-full"
                        min="0"
                        step="0.5"
                        disabled={disabled}
                    />
                </div>

                {/* Community Event Requirements */}
                <div className="space-y-2">
                    <Label htmlFor="communityRequirements" className="text-sm font-medium">
                        Special Requirements
                    </Label>
                    <Textarea
                        id="communityRequirements"
                        placeholder="Any special requirements, permits, or resources needed..."
                        value={formData.communityRequirements || ""}
                        onChange={(e) => handleInputChange("communityRequirements", e.target.value)}
                        className="min-h-[100px]"
                        disabled={disabled}
                    />
                </div>

                {/* Community Event Goals */}
                <div className="space-y-2">
                    <Label htmlFor="communityGoals" className="text-sm font-medium">
                        Event Goals
                    </Label>
                    <Textarea
                        id="communityGoals"
                        placeholder="What are the specific goals of this community event?"
                        value={formData.communityGoals || ""}
                        onChange={(e) => handleInputChange("communityGoals", e.target.value)}
                        className="min-h-[100px]"
                        disabled={disabled}
                    />
                </div>
            </CardContent>
        </Card>
    );
}; 