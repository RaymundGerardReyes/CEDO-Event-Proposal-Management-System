// @file: Section3_SchoolEvent.jsx

import { Checkbox } from "@/components/dashboard/student/ui/checkbox";
import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/dashboard/student/ui/radio-group";
import { getFieldClasses, hasFieldError } from "../../../validation";

/**
 * Basic Information Section Component (Refactored Inputs)
 */
export const BasicInfoSection = ({
    localFormData,
    handleLocalInputChange,
    validationErrors,
    disabled
}) => {
    const renderFieldError = (fieldName) => {
        if (!validationErrors[fieldName]) return null;
        return (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {validationErrors[fieldName]}
            </p>
        );
    };

    return (
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
            <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">
                Basic Information
            </legend>

            {/* Event Name */}
            <div className="space-y-2">
                <Label htmlFor="event_name" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    Event/Activity Name <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                    id="event_name"
                    name="event_name"
                    value={localFormData.event_name || ""}
                    onChange={handleLocalInputChange}
                    placeholder="e.g., Annual Science Fair"
                    className={getFieldClasses("event_name", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                    disabled={disabled}
                    required
                    aria-describedby="event_nameError"
                />
                {renderFieldError("event_name")}
            </div>

            {/* Event Venue */}
            <div className="space-y-2">
                <Label htmlFor="event_venue" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    Venue (Platform or Address) <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                    id="event_venue"
                    name="event_venue"
                    value={localFormData.event_venue || ""}
                    onChange={handleLocalInputChange}
                    placeholder="e.g., University Gymnasium or Zoom Meeting ID"
                    className={getFieldClasses("event_venue", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                    disabled={disabled}
                    required
                    aria-describedby="event_venueError"
                />
                {renderFieldError("event_venue")}
            </div>
        </fieldset>
    );
};

/**
 * Event Specifics Section Component (Refactored Inputs)
 */
export const EventSpecificsSection = ({
    localFormData,
    handleRadioChange,
    handleTargetAudienceChange,
    validationErrors,
    disabled
}) => {
    const renderFieldError = (fieldName) => {
        if (!validationErrors[fieldName]) return null;
        return (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {validationErrors[fieldName]}
            </p>
        );
    };

    return (
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
            <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">
                Event Specifics
            </legend>

            {/* Event Type */}
            <div className="space-y-2">
                <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    Type of Event <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <RadioGroup
                    value={localFormData.school_event_type || ""}
                    onValueChange={(value) => handleRadioChange("school_event_type", value)}
                    className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1 ${hasFieldError("school_event_type", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
                    disabled={disabled}
                >
                    {["academic-enhancement", "workshop-seminar-webinar", "conference", "competition", "cultural-show", "sports-fest", "other"].map(value => (
                        <div className="flex items-center space-x-2" key={value}>
                            <RadioGroupItem value={value} id={`school-event-${value}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                            <Label htmlFor={`school-event-${value}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">
                                {value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
                {renderFieldError("school_event_type")}
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
                <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    Target Audience <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <div className={`grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("school_target_audience", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}>
                    {["1st Year", "2nd Year", "3rd Year", "4th Year", "All Levels", "Faculty", "Staff", "Alumni", "External Guests"].map(label => (
                        <div className="flex items-center space-x-2" key={label}>
                            <Checkbox
                                id={`school-audience-${label}`}
                                checked={localFormData.school_target_audience?.includes(label) || false}
                                onCheckedChange={(checked) => handleTargetAudienceChange(label, Boolean(checked))}
                                disabled={disabled}
                                className="data-[state=checked]:bg-cedo-blue dark:data-[state=checked]:bg-cedo-gold data-[state=checked]:border-transparent dark:border-gray-500"
                            />
                            <Label htmlFor={`school-audience-${label}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{label}</Label>
                        </div>
                    ))}
                </div>
                {renderFieldError("school_target_audience")}
            </div>

            {/* Event Mode */}
            <div className="space-y-2">
                <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    Mode of Event <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <RadioGroup
                    value={localFormData.event_mode || ""}
                    onValueChange={(value) => handleRadioChange("event_mode", value)}
                    className={`grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("event_mode", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
                    disabled={disabled}
                >
                    {["offline", "online", "hybrid"].map(value => (
                        <div className="flex items-center space-x-2" key={value}>
                            <RadioGroupItem value={value} id={`school-mode-${value}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                            <Label htmlFor={`school-mode-${value}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">
                                {value.charAt(0).toUpperCase() + value.slice(1)}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
                {renderFieldError("event_mode")}
            </div>

            {/* Return Service Credits */}
            <div className="space-y-2">
                <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    Number of Return Service Credits <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <RadioGroup
                    value={String(localFormData.school_return_service_credit || "")}
                    onValueChange={(value) => handleRadioChange("school_return_service_credit", value)}
                    className={`grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 pt-1 ${hasFieldError("school_return_service_credit", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
                    disabled={disabled}
                >
                    {["1", "2", "3", "Not Applicable"].map(value => (
                        <div className="flex items-center space-x-2" key={value}>
                            <RadioGroupItem value={value} id={`school-credit-${value.toLowerCase().replace(/ /g, '-')}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                            <Label htmlFor={`school-credit-${value.toLowerCase().replace(/ /g, '-')}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{value}</Label>
                        </div>
                    ))}
                </RadioGroup>
                {renderFieldError("school_return_service_credit")}
            </div>
        </fieldset>
    );
};
