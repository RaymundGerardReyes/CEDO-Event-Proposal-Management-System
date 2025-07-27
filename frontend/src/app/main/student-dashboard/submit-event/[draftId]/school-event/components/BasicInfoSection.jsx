// @file: Section3_SchoolEvent.jsx

import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { getFieldClasses } from "../../../validation";

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
                <Label
                    htmlFor="event_name"
                    className="font-semibold text-gray-800 dark:text-gray-200 flex items-center"
                >
                    Event/Activity Name <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                    id="event_name"
                    name="event_name"
                    value={localFormData.event_name || ""}
                    onChange={handleLocalInputChange}
                    placeholder="e.g., Annual Science Fair"
                    className={getFieldClasses(
                        "event_name",
                        validationErrors,
                        "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold"
                    )}
                    disabled={disabled}
                    required
                    aria-describedby="event_nameError"
                />
                {renderFieldError("event_name")}
            </div>

            {/* Event Venue */}
            <div className="space-y-2">
                <Label
                    htmlFor="event_venue"
                    className="font-semibold text-gray-800 dark:text-gray-200 flex items-center"
                >
                    Venue (Platform or Address) <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                    id="event_venue"
                    name="event_venue"
                    value={localFormData.event_venue || ""}
                    onChange={handleLocalInputChange}
                    placeholder="e.g., University Gymnasium or Zoom Meeting ID"
                    className={getFieldClasses(
                        "event_venue",
                        validationErrors,
                        "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold"
                    )}
                    disabled={disabled}
                    required
                    aria-describedby="event_venueError"
                />
                {renderFieldError("event_venue")}
            </div>
        </fieldset>
    );
};
